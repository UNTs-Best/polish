# Polish — Fix & Rewrite Plan

> Goal: rewrite the entire backend in TypeScript, migrate from Supabase/CosmosDB to plain PostgreSQL, replace Azure/Supabase file storage with S3-compatible storage, and clean up the Next.js frontend so everything compiles and runs without errors.

---

## Status — what was already cleaned up

The following were removed or stubbed in the initial cleanup pass:

- Deleted `server/src/config/supabase.js`, `server/src/config/db.js` (CosmosDB), `server/src/utils/supabaseStorage.js`, `server/src/utils/azureBlob.js`
- Deleted `app/client/` (entire duplicate Next.js app + zip inside it)
- Fixed `server/src/app.js` — removed dead `connectSupabase()` call and duplicate route
- Fixed `server/src/controllers/user.controller.js` — broken named imports from a class
- Fixed `server/src/controllers/document.controller.js` — removed broken storage import
- Fixed `server/src/routes/upload.routes.js` — removed broken storage import
- Created `lib/claude-client.ts` and `lib/mcp-tools.ts` — were imported by chat and verify routes but never existed
- Stubbed all `app/api/documents/` routes (were importing non-existent `@/lib/cosmosdb`)
- Cleaned root `package.json` — removed server packages, Azure SDK, Node polyfills, fixed broken `tailwindcss- animate` package name
- Removed `express-oauth2-jwt-bearer` (Auth0 remnant) from server `package.json`

---

## Phase 1 — Infrastructure setup

### 1.1 PostgreSQL

- Spin up a PostgreSQL instance (local Docker for dev, managed instance for prod)
- Run the schema from `features.md` — creates all 5 tables with indexes and foreign keys
- Set `DATABASE_URL` in `.env`
- Verify connection with `psql $DATABASE_URL -c "SELECT 1"`

### 1.2 S3-compatible file storage

- For dev: run MinIO in Docker (`docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"`)
- For prod: AWS S3 bucket or managed MinIO
- Set `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL` in `.env`
- Test upload/download manually before wiring into services

### 1.3 Redis

- Run Redis locally (`docker run -p 6379:6379 redis:alpine`)
- Used for: session storage, rate limiting
- Set `REDIS_URL` in `.env`

### 1.4 Monorepo structure

Reorganize into:

```
/
├── apps/
│   ├── web/          ← move current Next.js app here
│   └── api/          ← new TypeScript Express/Fastify server
├── packages/
│   └── types/        ← shared TypeScript types (User, Document, Version, etc.)
├── pnpm-workspace.yaml
└── turbo.json
```

Install pnpm if not already: `npm install -g pnpm`

---

## Phase 2 — Backend rewrite (TypeScript)

Work in `apps/api/`. Create from scratch — do not migrate the existing JS files line by line.

### 2.1 Project setup

```
apps/api/
├── src/
│   ├── config/
│   │   ├── db.ts         ← pg.Pool
│   │   ├── redis.ts      ← ioredis client
│   │   └── env.ts        ← validated env vars (use zod)
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── error.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   │   └── storage.ts    ← S3 upload/delete/presign
│   └── app.ts
├── package.json
└── tsconfig.json
```

Dependencies to install:
```
fastify @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/multipart
pg @types/pg
ioredis
drizzle-orm drizzle-kit
@aws-sdk/client-s3 @aws-sdk/s3-request-presigner
jsonwebtoken @types/jsonwebtoken
bcryptjs @types/bcryptjs
zod
```

### 2.2 Database layer — Drizzle ORM

- Define schema in `src/db/schema.ts` — single source of truth for DB structure and TypeScript types
- Run `drizzle-kit generate` to produce migration SQL
- Run `drizzle-kit migrate` to apply to PostgreSQL
- Export typed query helpers — no raw `any` from `pool.query`

### 2.3 Config — validated env vars

Use `zod` to parse and validate all environment variables at startup. If a required var is missing the server refuses to start with a clear error instead of a cryptic crash later.

```typescript
// src/config/env.ts
const env = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // ... all vars
}).parse(process.env)
export default env
```

### 2.4 Services to rewrite

Rewrite each service using `pool.query` (or Drizzle helpers). Keep the same method signatures as the existing JS services so the controllers need minimal changes.

| Service | Key changes from current JS version |
|---------|-------------------------------------|
| `UserService` | Replace Supabase SDK calls with parameterized SQL. Fix `getUserbyEmail` → `getUserByEmail` (typo). |
| `DocumentService` | Replace Supabase SDK calls. Keep auto-versioning logic on update. |
| `VersionService` | Replace Supabase SDK calls. Keep cascade delete via FK (no manual delete needed). |
| `SessionService` | Move session storage to Redis (`SET session:{id}` with TTL) instead of DB table. Keep JWT generation/verification logic unchanged. |
| `LLMService` | No DB changes — just convert to TypeScript. Add proper return types. |
| `OAuthService` | No DB changes — just convert to TypeScript. Fix Apple Sign-In JWT parsing types. |
| `AIInteractionService` | Replace Supabase SDK calls. |

### 2.5 File storage utility

Create `src/utils/storage.ts`:

```typescript
uploadFile(buffer, key, mimeType) → { url, path }
deleteFile(key) → void
getPresignedUrl(key, expiresIn) → string
```

Uses `@aws-sdk/client-s3`. Set `forcePathStyle: true` when `S3_ENDPOINT` is set (MinIO). For AWS S3, omit endpoint.

### 2.6 Auth middleware

Same logic as current `auth.middleware.js` — validate `Authorization: Bearer <token>`, decode JWT, set `req.user`. Convert to TypeScript with proper request type augmentation:

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; provider: string }
  }
}
```

### 2.7 LLM streaming — switch to SSE

Current implementation waits for the full OpenAI response before returning. Replace with Server-Sent Events:

- `POST /api/llm/documents/:id/suggestions/stream` — streams tokens as they arrive
- Frontend reads via `EventSource` or `fetch` with `ReadableStream`
- Keep the existing non-streaming endpoints as fallback during transition

### 2.8 Routes

Same routes as documented in `features.md`. No changes to the API surface — only the implementation underneath changes.

Register a health route that also checks DB and Redis connectivity:
```
GET /api/health → { db: "ok", redis: "ok", storage: "ok" }
```

---

## Phase 3 — Next.js frontend fixes

### 3.1 Remove remaining broken imports

Search for any remaining imports of deleted packages:
```bash
grep -r "@azure/cosmos\|supabase\|cosmosdb" app/ --include="*.ts" --include="*.tsx"
```
Should return nothing after cleanup. If anything remains, delete or stub it.

### 3.2 Wire document API routes to Express backend

The `app/api/documents/` routes currently return 501. Replace each with a thin proxy to the Express API:

```typescript
// app/api/documents/route.ts
const API = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")
  const res = await fetch(`${API}/api/docs`, { headers: { authorization: token ?? "" } })
  return NextResponse.json(await res.json(), { status: res.status })
}
```

Repeat for all document/version routes. This keeps the frontend API surface stable while the backend is being built.

### 3.3 Claude chat route

`app/api/chat/route.ts` and `app/api/claude/verify/route.ts` now import from `lib/claude-client.ts` which exists. Verify these work end-to-end:

- Start Next.js dev server
- Set `ANTHROPIC_API_KEY` or test with a user-provided key
- Hit `/api/claude/verify` with a valid key — should return `{ valid: true }`
- Hit `/api/chat` with a message — should return a streamed or full response

### 3.4 Autosave route

`app/api/autosave/route.ts` currently simulates a 500ms delay. Wire it to `POST /api/docs/:id` on the Express backend once that's running.

### 3.5 Export route

`app/api/export/route.ts` generates PDF/DOCX/LaTeX client-side using `jspdf` and `docx`. This is self-contained and does not need backend changes. Verify it still works after the `package.json` cleanup.

### 3.6 Remove localStorage as primary data store

Currently `lib/user-storage.ts` uses `localStorage` as the source of truth for documents. Once the Express API is running, components should fetch from the API and use localStorage only as a cache or fallback.

---

## Phase 4 — Shared types package

Create `packages/types/src/index.ts` with DTOs shared between frontend and backend:

```typescript
export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatarUrl: string | null
  authProvider: "local" | "google" | "github" | "apple"
  emailVerified: boolean
  createdAt: string
}

export interface DocumentDto {
  id: string
  userId: string
  title: string
  content: string
  fileUrl: string | null
  mimeType: string | null
  createdAt: string
  updatedAt: string
}

export interface VersionDto {
  id: string
  documentId: string
  versionNumber: number
  content: string
  changeSummary: string
  createdBy: string
  createdAt: string
}
```

Both `apps/web` and `apps/api` import from `@polish/types`. API response types and frontend fetch call types stay in sync automatically.

---

## Phase 5 — Testing

### 5.1 Backend

Use the existing test structure (`src/test/`). Rewrite tests in TypeScript.

- Unit tests: each service method with a test database (run PostgreSQL in Docker in CI)
- Integration tests: full HTTP request → response via Supertest (or Fastify's inject)
- No mocking the database — the existing tests already had this requirement

CI runs: `npm test` in `apps/api/`

### 5.2 Frontend

- Verify `npm run build` passes with zero errors (currently `ignoreBuildErrors: true` in next.config — remove this once all broken imports are gone)
- Manually test: sign in, create document, get AI suggestions, export PDF

---

## Phase 6 — Environment & deployment

### 6.1 Environment files

```
apps/api/.env
  DATABASE_URL=
  REDIS_URL=
  JWT_SECRET=
  JWT_REFRESH_SECRET=
  S3_ENDPOINT=          # MinIO only
  S3_REGION=
  S3_ACCESS_KEY_ID=
  S3_SECRET_ACCESS_KEY=
  S3_BUCKET=
  S3_PUBLIC_URL=
  OPENAI_API_KEY=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=
  GITHUB_REDIRECT_URI=
  APPLE_CLIENT_ID=
  APPLE_CLIENT_SECRET=
  APPLE_REDIRECT_URI=

apps/web/.env.local
  NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 6.2 Docker Compose (local dev)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: polish
      POSTGRES_USER: polish
      POSTGRES_PASSWORD: polish
    ports: ["5432:5432"]

  redis:
    image: redis:alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
```

Run all infra: `docker compose up -d`

### 6.3 next.config.mjs

Once all broken imports are resolved:
- Remove `typescript: { ignoreBuildErrors: true }`
- Remove `eslint: { ignoreDuringBuilds: true }`
- Remove `images: { unoptimized: true }` unless needed

---

## Order of execution

| # | Task | Depends on |
|---|------|-----------|
| 1 | Set up Docker Compose (Postgres, Redis, MinIO) | — |
| 2 | Initialize `apps/api/` TypeScript project | — |
| 3 | Write and validate env schema (`config/env.ts`) | 2 |
| 4 | Run DB schema migrations (Drizzle) | 1, 2 |
| 5 | Write `config/db.ts` and `config/redis.ts` | 1, 2 |
| 6 | Write `utils/storage.ts` (S3) | 1, 2 |
| 7 | Rewrite `UserService` | 4, 5 |
| 8 | Rewrite `SessionService` | 5, 7 |
| 9 | Rewrite `OAuthService` | 7, 8 |
| 10 | Write auth middleware | 8 |
| 11 | Rewrite `DocumentService` | 4, 5 |
| 12 | Rewrite `VersionService` | 4, 5, 11 |
| 13 | Rewrite `LLMService` | 2 |
| 14 | Rewrite `AIInteractionService` | 4, 5 |
| 15 | Wire up routes + controllers | 7–14 |
| 16 | Write `packages/types/` shared DTOs | 15 |
| 17 | Wire Next.js API routes to Express | 15, 16 |
| 18 | End-to-end test: auth → document → AI → export | 17 |
| 19 | Remove `ignoreBuildErrors` from next.config | 18 |
| 20 | Write/rewrite tests | 15 |
