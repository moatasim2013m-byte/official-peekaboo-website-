# AGENTS.md

## Repository structure
- `frontend/`: React (CRACO) customer/staff/admin web UI.
- `backend/node-app/`: Express + MongoDB API server mounted under `/api`.

## Project conventions
- **API origin rule:** Frontend requests must use same-origin `/api/...` endpoints (do not hardcode cross-origin backend URLs in client code).
- **Language and layout:** Product is **Arabic-first** and should preserve **RTL** UX/content defaults.
- **Database:** Backend data layer is MongoDB Atlas and must be configured via `MONGO_URL` (plus related env vars such as `DB_NAME` when needed).
- **Email sending:** All transactional emails should go through `backend/node-app/utils/email.js` using `sendEmail()` (and related templates/helpers in that module).

## Local development commands

### Frontend (`frontend/`)
- Install dependencies: `npm install`
- Run local dev server: `npm start`
- Run tests: `npm test`

### Backend (`backend/node-app/`)
- Install dependencies: `npm install`
- Run local API server: `node index.js`
- Seed local data (optional): `node seed.js`

## Build commands

### Frontend (`frontend/`)
- Production build: `npm run build`

### Backend (`backend/node-app/`)
- Build: No compile step required (runtime Node.js service).

## Test commands

### Frontend
- Unit/integration tests: `cd frontend && npm test`

### Backend
- Basic API smoke test flow:
  1. `cd backend/node-app && node index.js`
  2. From another shell: `curl http://localhost:8080/api/healthz`
