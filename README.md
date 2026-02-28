# Live Polling System

A real-time classroom polling app. Teachers create timed polls with multiple choices; students join by name, vote, and see live results. Includes a shared chat and participant list, with poll history persisted in the database.

---

## Live Demo

| App        | URL |
|-----------|-----|
| **Frontend** | [https://realtime-polling-system-chi.vercel.app/](https://realtime-polling-system-chi.vercel.app/)  |
| **Backend**  | [https://realtime-polling-system-731v.onrender.com](https://realtime-polling-system-731v.onrender.com/api/polls/history) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| **Backend**  | Node.js, Express, TypeScript |
| **Database** | MongoDB (Mongoose) |
| **Real-time**| Socket.IO (client + server) |

---

## Features

### Teacher

- Create polls: question, options, and duration (up to 60 seconds).
- See live results and countdown while a poll is active.
- View completed polls in a history list (REST API).
- See connected students; remove a student (kick) from the session.
- Chat with students and view participants in a side panel.

### Student

- Enter and persist name (session storage); rejoin with same name.
- See active poll and submit one vote per poll; see results after voting or when time runs out.
- Chat and view participant list; get removed (kicked) if the teacher kicks them.

### System resilience

- Database errors (e.g. MongoDB network/timeout) are caught and surfaced as user-friendly messages instead of raw stack traces.
- Reconnecting clients receive current poll state and student list via Socket.IO.
- Poll expiry is enforced server-side; votes after expiry are rejected.

---

## Architecture

**Backend — Controller–Service split**

- **Controllers** (e.g. `poll.controller.ts`) handle HTTP: request/response and status codes. They call into services and return JSON or errors.
- **Services** (e.g. `poll.service.ts`) hold business logic: validation, Mongoose models, and error handling. Socket handlers and REST routes both use the same service layer so behavior stays consistent.

**Frontend — Custom hooks**

- **`useSocket`** centralizes Socket.IO connection, event subscription, and actions (create poll, vote, register student, kick, chat). Teacher and student UIs use the same hook with a `role` and optional `initialStudentName`.
- **`usePollTimer`** turns a `remainingTimeMs` value from the server into a per-second countdown for the UI.

---

## Getting Started (Local Setup)

1. **Clone and open the repo**

   ```bash
   git clone <your-repo-url>
   cd support-ticket-system
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   ```

   Create a `backend/.env` (see [Environment Variables](#environment-variables)) with at least `MONGO_URI` and optionally `PORT`.

   ```bash
   npm run dev
   ```

   The API and Socket.IO server will run (default port **4000**).

3. **Frontend**

   In a new terminal, from the repo root:

   ```bash
   cd frontend
   npm install
   ```

   Point the frontend at your local backend by setting the Socket (and any API) base URL in `frontend/src/services/socket.ts` (and `TeacherPage.tsx` for the history API) to `http://localhost:4000`, then:

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (e.g. `http://localhost:5173`) and choose Teacher or Student.

4. **Run both from the repo root (optional)**

   ```bash
   npm run dev:backend   # terminal 1
   npm run dev:frontend # terminal 2
   ```

---

## Environment Variables

Backend only. Create `backend/.env`:

| Variable   | Description |
|-----------|-------------|
| `MONGO_URI` | MongoDB connection string (required for DB). Example: `mongodb://localhost:27017/livepolling` or a MongoDB Atlas URI. |
| `PORT`     | Server port. Defaults to `4000` if unset. |

---

## Deployment

- **Frontend:** Deploy the `frontend` folder to **Vercel** (e.g. connect the repo and set the root to `frontend`). Set the build command to `npm run build` and the output directory to `dist`. Configure environment variables so the app uses your production backend URL for Socket.IO and the poll-history API.
- **Backend:** Deploy the `backend` folder to **Render** (or another Node host). Use a Web Service, set the start command to `npm run build && npm start`, and add `MONGO_URI` (and optionally `PORT`) in the Render dashboard. Ensure the frontend’s Socket and API base URLs point to this backend URL.

---

## Folder Structure

```
support-ticket-system/
├── package.json              # Root scripts (dev:backend, dev:frontend)
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts         # Express + Socket.IO bootstrap
│   │   ├── config/
│   │   │   └── env.ts        # PORT, MONGO_URI
│   │   ├── controllers/
│   │   │   └── poll.controller.ts
│   │   ├── services/
│   │   │   └── poll.service.ts
│   │   ├── models/
│   │   │   ├── Poll.ts
│   │   │   └── Vote.ts
│   │   ├── sockets/
│   │   │   ├── index.ts
│   │   │   └── poll.socket.ts
│   │   └── utils/
│   │       └── db.ts
│   └── .env                  # Not committed; MONGO_URI, PORT
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── pages/
    │   │   ├── RoleSelectionPage.tsx
    │   │   ├── TeacherPage.tsx
    │   │   └── StudentPage.tsx
    │   ├── components/
    │   │   ├── TeacherCreatePollView.tsx
    │   │   ├── TeacherLivePollView.tsx
    │   │   ├── PollHistoryView.tsx
    │   │   ├── StudentNameEntry.tsx
    │   │   ├── StudentWaitingView.tsx
    │   │   ├── StudentActivePollView.tsx
    │   │   ├── StudentRemovedView.tsx
    │   │   ├── ChatPanel.tsx
    │   │   └── RoleCard.tsx
    │   ├── hooks/
    │   │   ├── useSocket.ts
    │   │   └── usePollTimer.ts
    │   └── services/
    │       └── socket.ts     # Socket.IO client URL
    └── ...
```

---
