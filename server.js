require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const MAX_CONTENT_LENGTH = 50000;

const documentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  content: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});
const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);
const activeUsers = new Map();
const temporaryDocuments = new Map();

function usersInDocument(id) {
  return [...activeUsers.values()].filter(user => user.documentId === id).map(user => ({ username: user.username }));
}
function sendOnlineUsers(id) { io.to(id).emit("online-users", usersInDocument(id)); }
function clean(value, limit) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function mongoReady() { return mongoose.connection.readyState === 1; }

async function readDocument(id) {
  if (mongoReady()) {
    const doc = await Document.findOne({ documentId: id }).lean();
    return { content: doc ? doc.content : "", storage: "mongodb" };
  }
  return { content: temporaryDocuments.get(id) || "", storage: "memory" };
}
async function saveDocument(id, content) {
  if (mongoReady()) {
    await Document.findOneAndUpdate(
      { documentId: id },
      { $set: { content, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return "mongodb";
  }
  temporaryDocuments.set(id, content);
  return "memory";
}

io.on("connection", socket => {
  socket.on("join-document", async payload => {
    const username = clean(payload && payload.username, 24);
    const documentId = clean(payload && payload.documentId, 40).toLowerCase();
    if (!username || !/^[a-z0-9-]+$/.test(documentId)) {
      socket.emit("app-error", "Please enter a valid name and document ID.");
      return;
    }

    const previous = activeUsers.get(socket.id);
    if (previous) {
      socket.leave(previous.documentId);
      activeUsers.delete(socket.id);
      sendOnlineUsers(previous.documentId);
    }

    activeUsers.set(socket.id, { username, documentId });
    socket.join(documentId);
    socket.emit("joined-document", { username, documentId });

    try {
      socket.emit("document-content", await readDocument(documentId));
    } catch (error) {
      console.error("Document load failed:", error.message);
      socket.emit("app-error", "Could not load the document. Check MongoDB connection.");
    }
    sendOnlineUsers(documentId);
  });

  socket.on("edit-document", async payload => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    const content = payload && typeof payload.content === "string" ? payload.content : "";
    if (content.length > MAX_CONTENT_LENGTH) {
      socket.emit("app-error", "Please keep the document under 50,000 characters.");
      return;
    }
    try {
      const storage = await saveDocument(user.documentId, content);
      socket.emit("document-saved", { storage });
      socket.to(user.documentId).emit("document-change", {
        content, username: user.username, updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Document save failed:", error.message);
      socket.emit("app-error", "Could not save changes. Check MongoDB connection.");
    }
  });

  socket.on("disconnect", () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    activeUsers.delete(socket.id);
    sendOnlineUsers(user.documentId);
  });
});

app.get("/api/status", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoReady() ? "connected" : "not connected (temporary memory mode)",
    activeCollaborators: activeUsers.size
  });
});

const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res, next) => {
  res.sendFile(path.join(dist, "index.html"), error => { if (error) next(); });
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected.");
    } catch (error) {
      console.error("MongoDB connection failed; using temporary memory mode:", error.message);
    }
  } else {
    console.log("MONGODB_URI not set; using temporary memory mode.");
  }
  server.listen(PORT, () => console.log(`StudySync server: http://localhost:${PORT}`));
}
start();
