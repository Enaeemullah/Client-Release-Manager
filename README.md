# Client Release Manager

A full-stack release tracker built with React + Vite on the frontend and NestJS + MySQL on the backend. Users can sign up, authenticate with JWTs, and manage client/environment release metadata that is persisted entirely in a relational database.

## Getting started

1. Install dependencies

   ```bash
   npm install
   (cd server && npm install)
   ```

2. Configure environment variables

   ```bash
   cp server/.env.example server/.env   # update DB credentials + secrets
   ```

   Ensure a MySQL database (default `client_release_manager`) exists and the configured user has permissions.

3. Run the dev servers (in separate terminals)

   ```bash
   npm run server   # starts NestJS backend on http://localhost:3000
   npm run dev      # starts Vite frontend on http://localhost:5173
   ```

4. Optionally build/preview the frontend

   ```bash
   npm run build
   npm run preview
   ```

## Project structure

```
src/
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
- Search across clients, branches, versions, and environments
- JSON export of the current user's release catalog
- Responsive layout with accessible modals and form semantics
