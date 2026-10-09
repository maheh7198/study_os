# StudyOS

StudyOS is a student productivity and placement preparation app with a React frontend, an Express API, and a MySQL database.

## Features

- Dashboard, subjects and topics, tasks, notes, goals, and study planning
- Pomodoro sessions, habit tracking, analytics, placement preparation, and leaderboard
- AI Mentor integration through backend environment settings
- Account registration, login, and server-side sessions
- Light and night themes

## Tech stack

- Frontend: React, JavaScript, JSX, Vite, CSS
- Backend: Node.js, Express.js, raw SQL with `mysql2`
- Database: MySQL 8

The current frontend uses custom CSS and does not depend on Bootstrap.

## Project structure

```text
StudyOS/
├── public/                 # Static assets and favicon
├── src/                    # React app, pages, styles, services, components
├── scripts/                # Local browser and API checks
├── backend/
│   ├── database/            # MySQL schema, seed, migrations
│   ├── src/                 # Express routes, services, middleware, config
│   ├── scripts/
│   └── test/
├── .env.example             # Frontend Vite settings
└── package.json             # Frontend scripts and dependencies
```

## Requirements

- Node.js 20 or newer
- MySQL 8

## Local setup

Install and configure the backend:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Set the local MySQL values in `backend/.env`. To create a new database, create the database named by `DB_NAME`, then apply the schema:

```powershell
Get-Content database/schema.sql | mysql -u root -p studyos
```

Start the API in one terminal:

```powershell
cd backend
npm run dev
```

In another terminal, from the repository root, install and start the frontend:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend defaults to the Vite `/api` proxy at `http://localhost:5000`. Set `BACKEND_DEV_URL` in the frontend `.env` to change the local API target. `VITE_API_URL` is the public API base path or origin ending in `/api`; never put credentials in a `VITE_*` variable.

For an existing StudyOS database, configure the backend variables and run `npm run migrate:auth` from `backend/`. This adds authentication storage without deleting existing records. Existing data under the legacy development account remains associated with that account.

## Environment variables

Copy each `.env.example` to `.env` in its respective folder. Backend settings include database connection values, `PORT`, `CLIENT_URL`, and optional AI provider settings. Keep real credentials out of source control and frontend variables.

## Checks

From the repository root:

```powershell
npm run lint
npm run build
```

From `backend/`:

```powershell
npm run lint
npm test
```

The backend integration test uses the configured MySQL database and creates then removes test accounts. Use a disposable test database before running it.

## Deployment notes

Apply `backend/database/schema.sql` to MySQL 8 before starting a new deployment. Configure the backend's production environment, including the exact frontend origin in `CLIENT_URL`. Serve the frontend over HTTPS and configure its `VITE_API_URL` for the deployed API. Do not commit `.env` files or push credentials.
