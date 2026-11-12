# StudySync — Real-Time Collaborative Study Notes

StudySync is a simple shared document editor for students. Teammates enter the same document ID and can edit the same notes. Changes are sent live with Socket.IO and saved to MongoDB when a database connection is configured.

## Features
- Join using a display name and shared document ID
- Real-time collaborative text editing
- Online collaborator list
- Automatic saving after a short pause in typing
- Word and character counter
- Light/dark theme
- Responsive design
- MongoDB persistence, with temporary memory fallback

## Technologies
React.js · CSS · Node.js · Express · Socket.IO · MongoDB · Mongoose · Vite

## Folder structure
```text
StudySync_Collaborative_Editor/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── style.css
├── index.html
├── server.js
├── package.json
├── vite.config.js
└── .env.example
```

## Run locally
1. Install Node.js (LTS).
2. Extract the ZIP and open the `StudySync_Collaborative_Editor` folder in VS Code.
3. Open the terminal in this folder and run:
   ```bash
   npm install
   ```
4. (Recommended) Configure MongoDB:
   - Create a free MongoDB Atlas cluster and a database user.
   - Allow your IP address in Atlas Network Access.
   - Copy `.env.example` to a new file named `.env`.
   - Put your real MongoDB connection string in `MONGODB_URI` in `.env`.
   - Keep `.env` private; do not upload it to GitHub.
5. Start the project:
   ```bash
   npm run dev
   ```
6. Open the Vite URL shown in the terminal, usually **http://localhost:5173**.

If you skip MongoDB setup, the project still runs in temporary memory mode. Documents in that mode are lost when the server stops.

## Test collaboration
1. Open the app in two browser tabs.
2. Enter different names in each tab.
3. Enter the exact same document ID in both, for example `dbms-unit-3`.
4. Join from both tabs and type in the editor.
5. Changes should appear in the other tab.

## Production mode
```bash
npm run build
npm start
```
Then open **http://localhost:3000**.

## Server status
Visit `http://localhost:3000/api/status` to see server and database status.

## Important notes
- Do not use Live Server. Start the project with `npm run dev`.
- Anyone who knows a document ID can join that demo document. Do not use private information.
- MongoDB saves documents permanently when `MONGODB_URI` is configured. Otherwise the server uses temporary in-memory storage.
- This is an internship demonstration project, not a secure production document service.

## Internship
**CODTECH Internship — Task 3: Real-Time Collaborative Document Editor**
