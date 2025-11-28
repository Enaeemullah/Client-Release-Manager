# Verto

Verto is a full-stack release tracker built with React + Vite on the frontend and NestJS + MySQL on the backend. Users can sign up, authenticate with JWTs, manage client/environment release metadata, and customize their personal settings (profile, avatar, password) without leaving the workspace.

## Repo layout

- `backend/` – NestJS + TypeORM API (JWT auth, releases CRUD, MySQL integration)
- `frontend/` – React + Vite dashboard (shown below)

## Getting started

1. Install dependencies

   ```bash
   (cd backend && npm install)
   (cd frontend && npm install)
   ```

2. Configure environment variables

   ```bash
   cp backend/.env.example backend/.env   # update DB credentials + secrets + SMTP settings for invites
   ```

   Ensure a MySQL database (default `verto`) exists and the configured user has permissions.

3. Run the dev servers (in separate terminals)

   ```bash
   (cd backend && npm run start:dev)   # http://localhost:3000
   (cd frontend && npm run dev)        # http://localhost:5173
   ```

4. Optionally build/preview the frontend

   ```bash
   (cd frontend && npm run build)
   (cd frontend && npm run preview)
   ```

## Project structure

```
frontend/src/
├─ components/
│  ├─ AppContent.tsx
│  ├─ auth/
│  ├─ common/
│  └─ dashboard/
├─ contexts/
├─ services/
├─ styles/
├─ types/
└─ utils/
```

- `contexts/` keeps isolated auth + release providers.
- `services/` holds API + session helpers.
- `components/` are split by feature (auth vs dashboard) with smaller presentational children.
- `utils/` centralizes data shaping helpers (flattening/grouping releases, exporting JSON, etc.).
- `styles/` includes shared tokens plus CSS modules per component for maintainable styling.

## Features

- Email + password auth persisted in MySQL and secured with JWTs
- Add/edit/delete release metadata per client/environment with server-side validation
- Invite collaborators to specific client projects via emailed signup links
- Search across clients, branches, versions, and environments
- JSON export of the current user's release catalog
- Responsive layout with accessible modals and form semantics
