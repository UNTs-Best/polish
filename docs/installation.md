# Polish — Installation and Deployment Guide

**Project:** Polish — AI-Powered Resume Editor
**Author:** Arnav Verma

---

## 1. Overview

This document provides complete step-by-step instructions for installing and running **Polish** locally on any machine using Docker and Docker Compose.

**Polish** is a full-stack AI-powered resume editing web application. Users upload an existing resume, edit it inline in the browser, receive real-time AI suggestions powered by Google Gemini 2.5 Flash, maintain a full version history, and export the finished document in PDF, DOCX, RTF, or LaTeX format.

The application consists of four components:

| Component | Technology | Port |
|---|---|---|
| Frontend | Next.js 14 (Docker) | 3000 |
| Backend API | Express.js (Docker) | 3001 |
| Database | PostgreSQL 16 (Docker) | 5432 |
| Cache | Redis 7 (Docker) | 6379 |

The `docker-compose.yml` file at the project root spins up the PostgreSQL and Redis infrastructure services. The frontend and backend are run directly with Node.js for local development, or built and run via their individual Dockerfiles for a production-like local setup.

---

## 2. Assumptions

- The machine running the application has **Docker Desktop** (or Docker Engine + Docker Compose) installed and running.
- **Node.js 20 LTS** and **npm** are installed locally (required to run the frontend and backend outside of Docker, or to run database migrations).
- The deployer has a **Google AI Studio** account and has generated a Gemini API key at [aistudio.google.com](https://aistudio.google.com).
- Ports **3000**, **3001**, **5432**, and **6379** are free on the local machine.
- All commands are run from the **root of the project directory** (`polish/`) unless stated otherwise.
- No S3 object storage is required for basic local operation — the S3 file upload feature will be disabled gracefully if S3 environment variables are not set.

---

## 3. Dependencies

### 3.1 Required Tools

| Tool | Version | Purpose | Install |
|---|---|---|---|
| Docker Desktop | 4.x or later | Runs PostgreSQL and Redis containers | [docker.com](https://www.docker.com/products/docker-desktop) |
| Node.js | 20 LTS | Runs frontend and backend | [nodejs.org](https://nodejs.org) |
| npm | 10.x (bundled with Node 20) | Package installation | Bundled with Node.js |

### 3.2 Frontend Libraries (installed via `npm ci`)

| Package | Version | Purpose |
|---|---|---|
| `next` | ^14.2.5 | React framework (App Router) |
| `react` | ^18.3.1 | UI rendering |
| `tailwindcss` | ^4.0.0 | Utility-first CSS |
| `jspdf` | ^2.5.1 | Client-side PDF export |
| `pdfjs-dist` | ^4.6.82 | PDF parsing on upload |
| `docx` | ^8.5.0 | DOCX export |
| `@radix-ui/*` | ^1–2.x | Accessible UI primitives |
| `lucide-react` | ^0.441.0 | Icon library |

### 3.3 Backend Libraries (installed via `npm ci` inside `server/`)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.19.2 | HTTP server framework |
| `@prisma/client` | 5.22.0 | PostgreSQL ORM |
| `@google/generative-ai` | ^0.21.0 | Gemini API SDK |
| `jsonwebtoken` | ^9.0.2 | JWT signing and verification |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `ioredis` | ^5.4.1 | Redis client |
| `zod` | ^3.23.8 | Request body validation |
| `multer` | ^1.4.5-lts.1 | File upload handling |
| `helmet` | ^7.1.0 | Security HTTP headers |
| `express-rate-limit` | ^7.3.1 | API rate limiting |

### 3.4 External APIs

| API | Required | Purpose |
|---|---|---|
| Google Gemini 2.5 Flash | **Yes** | AI suggestions, chat, scoring, summarisation |
| AWS S3 / Cloudflare R2 | No (optional) | Resume file storage on upload |

---

## 4. Constraints

- **Google Gemini API key is required.** Without it the AI chat, suggestions, scoring, and summary features will return errors. The editor itself will still work for manual editing and export.
- **The backend must be reachable from the browser at `http://localhost:3001`.** If you change the backend port, you must also update `NEXT_PUBLIC_API_URL` in the frontend environment and rebuild.
- **`NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time**, not at runtime. Changing it after `npm run build` has no effect — you must rebuild the frontend.
- **Prisma migrations must be applied before the backend starts** for the first time. The backend Docker image runs `prisma migrate deploy` automatically on startup. If running without Docker, this step must be done manually (see Section 8).
- **Node.js 20 is required.** The project uses `ES2022` TypeScript targets and native `crypto` APIs that are not available in Node 18 or below.
- **Do not commit `.env` files.** All secret values must remain local.

---

## 5. Description of Deployment Artifacts

```
polish/                          ← Project root
├── docker-compose.yml           ← Spins up PostgreSQL and Redis
├── Dockerfile                   ← Frontend production Docker image
├── package.json                 ← Frontend dependencies
├── next.config.js               ← Next.js config (standalone output)
│
├── app/                         ← Next.js App Router pages
│   ├── page.tsx                 ← Landing page
│   ├── dashboard/page.tsx       ← Document dashboard
│   ├── editor/page.tsx          ← Main resume editor
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   └── api/                     ← Next.js API routes (autosave, export)
│
├── components/                  ← Shared React components
│   ├── resume-renderer.tsx      ← ContentEditable resume canvas
│   ├── ai-chat.tsx              ← AI chat sidebar
│   ├── export-dialog.tsx        ← PDF/DOCX/RTF/LaTeX export
│   └── version-history.tsx      ← Version restore panel
│
├── lib/                         ← Frontend utilities
│   └── user-storage.ts          ← localStorage token management
│
└── server/                      ← Backend (Express.js)
    ├── Dockerfile               ← Backend production Docker image
    ├── package.json             ← Backend dependencies
    ├── prisma/
    │   ├── schema.prisma        ← Database schema definition
    │   └── migrations/          ← SQL migration files
    └── src/
        ├── app.ts               ← Express app setup and middleware
        ├── server.ts            ← HTTP server entry point
        ├── config/
        │   ├── db.ts            ← Prisma client singleton
        │   ├── env.ts           ← Environment variable validation
        │   └── redis.ts         ← Redis client
        ├── routes/              ← auth, docs, versions, llm
        ├── controllers/         ← HTTP request handlers
        ├── services/            ← Business logic
        ├── middleware/          ← auth, error handler
        └── utils/               ← JWT, S3 storage helpers
```

---

## 6. Data Initialisation

The database schema is managed by **Prisma** using `db push`, which directly synchronises the schema defined in `server/prisma/schema.prisma` with the PostgreSQL database. There is no seed data required — the application starts with an empty database and users register themselves.

Run the following once after the database container is healthy:

```
npx prisma db push
```

This creates all five tables in the database:

- `users`
- `sessions`
- `documents`
- `versions`
- `ai_interactions`

No manual SQL is required. No initial admin data needs to be inserted.

---

## 7. Admin Credentials

There is no admin panel or admin-specific account in Polish. All accounts are regular user accounts created through the registration flow at `/signup`.

The following credentials are used internally by the infrastructure and must be set in your environment files:

| Credential | Where Set | Purpose |
|---|---|---|
| `POSTGRES_PASSWORD` | `docker-compose.yml` (default: `polish_secret`) | PostgreSQL superuser password |
| `JWT_SECRET` | `server/.env` | Signs access tokens — must be at least 32 characters |
| `JWT_REFRESH_SECRET` | `server/.env` | Signs refresh tokens — must be different from `JWT_SECRET` |
| `GOOGLE_AI_API_KEY` | `server/.env` | Gemini API key from Google AI Studio |

---

## 8. Deployment Process

Follow these steps in order to run Polish locally.

---

### Step 1 — Clone or extract the source code

If working from the source zip, extract it and open a terminal in the `polish/` root directory.

```bash
cd polish
```

---

### Step 2 — Start the database and cache

```bash
docker compose up -d
```

This starts two containers in the background:

- `polish_postgres` — PostgreSQL 16 on port `5432`
- `polish_redis` — Redis 7 on port `6379`

Wait a few seconds for the health checks to pass. Verify both containers are running:

```bash
docker compose ps
```

Both services should show `healthy` under Status.

---

### Step 3 — Configure the backend environment

Create a `.env` file inside the `server/` directory:

```bash
cp server/.env.example server/.env
```

If no `.env.example` exists, create `server/.env` manually with the following content:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://polish:polish_secret@localhost:5432/polish_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different-from-above
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_AI_API_KEY=your_gemini_api_key_here

CLIENT_URL=http://localhost:3000

# Optional — leave blank to disable file upload to S3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# S3_BUCKET=
```

Replace `your-super-secret-jwt-key-minimum-32-characters`, `your-super-secret-refresh-key-different-from-above`, and `your_gemini_api_key_here` with your actual values.

---

### Step 4 — Install backend dependencies and push the schema

```bash
cd server
npm ci
npx prisma generate
npx prisma db push
cd ..
```

This installs all backend packages, generates the Prisma client, and pushes the schema to PostgreSQL, creating all five tables. You should see `The database is already in sync with the Prisma schema` or a list of tables created.

---

### Step 5 — Start the backend

In a terminal (keep this running):

```bash
cd server
npm run dev
```

The backend will start at `http://localhost:3001`. You should see:

```
[server] running on port 3001 (development)
```

Verify it is healthy:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{ "status": "ok", "db": "ok", "redis": "ok" }
```

---

### Step 6 — Configure the frontend environment

Create a `.env.local` file in the project root:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

---

### Step 7 — Install frontend dependencies

```bash
npm ci
```

---

### Step 8 — Start the frontend

In a second terminal (keep this running):

```bash
npm run dev
```

The frontend will start at `http://localhost:3000`.

---

### Step 9 — Open the application

Open your browser and navigate to:

```
http://localhost:3000
```

Click **Get Started**, register a new account, and you will be taken to the dashboard. Create a new document or upload an existing resume to begin.

---

### Quick Reference — All commands in order

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend setup (run once)
cd server && npm ci && npx prisma generate && npx prisma db push && cd ..

# 3. Start backend (terminal 1)
cd server && npm run dev

# 4. Start frontend (terminal 2)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm ci && npm run dev
```

---

### Stopping the application

```bash
# Stop frontend and backend: Ctrl+C in each terminal

# Stop and remove Docker containers
docker compose down

# To also delete all database data (full reset)
docker compose down -v
```
