# Client Release Manager

A lightweight React + TypeScript dashboard for tracking client releases across environments. The app includes email/password auth stored in `localStorage`, per-user release data, and tooling based on Vite.

## Getting started

```bash
pnpm install     # or npm/yarn install
pnpm dev         # start Vite dev server on http://localhost:5173
pnpm build       # production build
pnpm preview     # preview built assets
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
- `services/` holds storage helpers that abstract `localStorage`.
- `components/` are split by feature (auth vs dashboard) with smaller presentational children.
- `utils/` centralizes data shaping helpers (flattening/grouping releases, exporting JSON, etc.).
- `styles/` includes shared tokens plus CSS modules per component for maintainable styling.

## Features

- Email + password auth with account creation, backed by browser storage
- Add/edit/delete release metadata per client/environment
- Search across clients, branches, versions, and environments
- JSON export of the current user's release catalog
- Responsive layout with accessible modals and form semantics
