# Student AI Tools — Starter

This workspace contains a minimal starter scaffold for a Student AI Tools directory:

- Frontend: `frontend/` — Vite + React + Tailwind (client)
- Backend: `backend/` — Node + Express + Mongoose (API + auth placeholder)

Quick start (each in its folder):

Frontend
```bash
cd frontend
npm install
npm run dev
```

Backend
```bash
cd backend
npm install
npm run dev
```

Create a `backend/.env` with `MONGO_URI`, `SESSION_SECRET`, and optional OAuth/search keys before running the backend.

Seeding sample data (after installing backend deps):

```bash
cd backend
node src/scripts/seed.js
```

Notes:
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` when you want Google OAuth.
- Replace `G-XXXXXXX` in `frontend/index.html` with your GA4 measurement id.
- Add your AdSense `ca-pub-` id to `index.html` only after approval.
