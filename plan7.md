# 7-Day Server Rebuild Plan (TypeScript + Express + Prisma)

**5–6 hours/day | Start: March 28, 2026**

---

## Day 1 — Project Foundation & Config (March 28)

**Goal:** Clean slate setup. TypeScript ESM, environment, database, Redis all connected and verified.

### Tasks
- [ ] Delete all existing `src/` contents — start fresh
- [ ] Verify `tsconfig.json` is ESM (`module: NodeNext`, `moduleResolution: NodeNext`)
- [ ] Verify `package.json` has `"type": "module"` and correct scripts (`dev`, `build`, `start`)
- [ ] Set up `src/app.ts` — bare Express app with health route only (`GET /api/health`)
- [ ] Set up `src/config/env.ts` — Zod schema validating all env vars (DB, Redis, JWT, OAuth, S3, LLM)
- [ ] Set up `src/config/db.ts` — Prisma client singleton
- [ ] Set up `src/config/redis.ts` — ioredis client singleton with connection error handling
- [ ] Write `.env.example` with all required keys documented
- [ ] Run `prisma migrate dev` — confirm DB schema applies cleanly
- [ ] Confirm `GET /api/health` returns `{ db: "ok", redis: "ok" }` with real connection checks
- [ ] Add core middleware to app: Helmet, CORS, Morgan, compression, JSON body parser, rate limiter

**Done when:** `npm run dev` starts, health route returns 200 with live DB + Redis checks.

---

## Day 2 — Auth System (March 29)

**Goal:** Full local auth (register, login, logout, refresh, me) working end-to-end with JWT + sessions in DB.

### Tasks
- [ ] Create `src/middleware/auth.ts` — `requireAuth` middleware (validate Bearer JWT, attach `req.user`)
- [ ] Create `src/middleware/error.ts` — global error handler (catches thrown errors, returns JSON)
- [ ] Create `src/utils/jwt.ts` — `signAccessToken`, `signRefreshToken`, `verifyToken` helpers
- [ ] Create `src/services/user.service.ts`:
  - `createUser(email, password, firstName, lastName)`
  - `findUserByEmail(email)`
  - `findUserById(id)`
  - `updateUser(id, data)`
  - `verifyPassword(plain, hash)`
- [ ] Create `src/services/session.service.ts`:
  - `createSession(userId, userAgent, ip)`
  - `findSession(token)`
  - `invalidateSession(token)`
  - `invalidateAllSessions(userId)`
- [ ] Create `src/controllers/auth.controller.ts`:
  - `POST /api/auth/register` — hash pw, create user + session, return tokens
  - `POST /api/auth/login` — verify pw, create session, return tokens
  - `POST /api/auth/refresh` — validate refresh token, issue new access token
  - `GET /api/auth/me` — return user from `req.user`
  - `PUT /api/auth/profile` — update firstName, lastName
  - `POST /api/auth/change-password` — verify old pw, hash new pw
  - `POST /api/auth/logout` — invalidate session(s)
- [ ] Wire `src/routes/auth.routes.ts` to controllers with correct rate limits
- [ ] Mount auth router on app

**Done when:** Register → Login → refresh token → `/me` → logout all work via Postman/curl.

---

## Day 3 — Document CRUD (March 30)

**Goal:** Full document management — create, read, update, delete — with file upload support via S3.

### Tasks
- [ ] Create `src/utils/storage.ts`:
  - `uploadFile(buffer, key, mimeType)` → S3 put
  - `deleteFile(key)` → S3 delete
  - `getPresignedUrl(key, expiresIn)` → S3 presign
- [ ] Create `src/services/document.service.ts`:
  - `createDocument(userId, data, file?)` — create DB record, upload file if present
  - `getUserDocuments(userId)` — list with pagination
  - `getDocumentById(id, userId)` — fetch + ownership check
  - `updateDocument(id, userId, data)` — update content/title
  - `deleteDocument(id, userId)` — delete record + S3 file
- [ ] Create `src/controllers/document.controller.ts`:
  - `GET /api/docs` — list user documents
  - `POST /api/docs` — create document (JSON or multipart via Multer)
  - `GET /api/docs/:id` — get single document
  - `PUT /api/docs/:id` — update document
  - `DELETE /api/docs/:id` — delete document
- [ ] Add Multer middleware for file uploads (memory storage, type/size validation)
- [ ] Wire `src/routes/document.routes.ts` to controllers
- [ ] Mount document router on app (all routes behind `requireAuth`)

**Done when:** Full document CRUD works; file uploads store in S3 and URL is returned.

---

## Day 4 — Version Control (March 31)

**Goal:** Auto-versioning on document updates, manual restore, version history, and diff comparison.

### Tasks
- [ ] Create `src/services/version.service.ts`:
  - `createVersion(documentId, content, userId, summary?)` — snapshot creation
  - `getVersionsByDocument(documentId)` — list all versions (newest first)
  - `getPaginatedHistory(documentId, page, limit)` — paginated history
  - `getVersionById(versionId)` — fetch single version
  - `restoreVersion(documentId, versionId, userId)` — create new version from old content + update document
  - `compareVersions(versionId1, versionId2)` — return diff (line-by-line)
- [ ] Add auto-versioning to `document.service.updateDocument` — call `createVersion` on every update
- [ ] Create `src/controllers/version.controller.ts`:
  - `GET /api/versions/document/:documentId` — list versions
  - `GET /api/versions/document/:documentId/history` — paginated
  - `GET /api/versions/:versionId` — get version content
  - `POST /api/versions/document/:documentId/restore/:versionId` — restore
  - `GET /api/versions/compare/:versionId1/:versionId2` — diff
- [ ] Wire `src/routes/version.routes.ts` to controllers
- [ ] Mount version router (all behind `requireAuth`)

**Done when:** Update document → version created automatically. Restore → document content reverts. Diff returns meaningful output.

---

## Day 5 — LLM Integration (April 1)

**Goal:** AI endpoints working — suggestions, quality score, summary — with interaction logging.

### Tasks
- [ ] Create `src/services/llm.service.ts`:
  - `generateSuggestions(content, documentType)` → OpenAI call, returns structured suggestions
  - `applySuggestions(content, suggestions)` → merge suggestions into content
  - `summarizeDocument(content)` → returns short summary string
  - `scoreDocumentQuality(content, documentType)` → returns `{ score, issues, strengths }`
- [ ] Create `src/services/aiInteraction.service.ts`:
  - `logInteraction(userId, documentId, prompt, response, model, tokens, cost, type)` — DB insert
- [ ] Add interaction logging to all LLM service calls (wrap calls, log after response)
- [ ] Create `src/controllers/llm.controller.ts`:
  - `POST /api/llm/documents/:documentId/suggestions` — generate suggestions
  - `POST /api/llm/documents/:documentId/apply-suggestions` — apply + auto-version
  - `GET /api/llm/documents/:documentId/summary` — summarize
  - `GET /api/llm/documents/:documentId/quality` — quality score
  - `PUT /api/llm/documents/:documentId/content` — update raw content
- [ ] Wire `src/routes/llm.routes.ts` to controllers
- [ ] Mount LLM router (all behind `requireAuth`)

**Done when:** Quality score and suggestion endpoints return structured JSON from OpenAI with interaction logged in DB.

---

## Day 6 — OAuth (April 2)

**Goal:** Google and GitHub OAuth flows complete. Apple optional (complex — implement last if time allows).

### Tasks
- [ ] Create `src/services/oauth.service.ts`:
  - `getAuthorizationUrl(provider)` → build provider OAuth URL with state param
  - `exchangeCode(provider, code)` → exchange code for access token
  - `fetchUserProfile(provider, accessToken)` → fetch email + name from provider
  - `findOrCreateOAuthUser(profile, provider)` → upsert user in DB
  - `generateStateToken()` / `validateStateToken(state)` — CSRF protection using Redis
- [ ] Create `src/controllers/oauth.controller.ts`:
  - `GET /api/oauth/providers` — list enabled providers from env
  - `GET /api/oauth/:provider/url` — return authorization URL
  - `GET /api/oauth/:provider/callback` — handle callback, create session, redirect to client
  - `POST /api/oauth/:provider/callback` — same for POST flows
  - `GET /api/oauth/:provider` — initiate redirect
- [ ] Block `change-password` for OAuth-only users (check `hashedpw` is null)
- [ ] Wire `src/routes/oauth.routes.ts` and mount router
- [ ] Test Google OAuth full flow end-to-end
- [ ] Test GitHub OAuth full flow end-to-end

**Done when:** Google/GitHub login redirects, creates user on first login, returns JWT, subsequent logins reuse same user record.

---

## Day 7 — Hardening, Error Handling & Smoke Tests (April 3)

**Goal:** Production-ready error handling, input validation on all routes, and a full integration smoke test pass.

### Tasks
- [ ] Add Zod request validation to every controller (body, params, query)
- [ ] Audit all service functions — ensure ownership checks are enforced (users can't access other users' data)
- [ ] Ensure error handler in `src/middleware/error.ts` handles:
  - Zod validation errors → 400 with field details
  - Prisma not found errors → 404
  - JWT errors → 401
  - Generic errors → 500 with safe message (no stack traces in prod)
- [ ] Add `prisma.$disconnect()` and `redis.quit()` to graceful shutdown (`SIGTERM`, `SIGINT`)
- [ ] Update `GET /api/health` to check S3 connectivity (list bucket or head object)
- [ ] Write smoke test script (`scripts/smoke-test.ts`) that hits every endpoint in sequence:
  - Register → Login → Create doc → Update doc → Get versions → Restore → LLM quality → Logout
- [ ] Run `npm run build` — fix all TypeScript compile errors
- [ ] Run smoke test against local dev server — all endpoints return expected status codes
- [ ] Update `.env.example` with any missing vars discovered during testing

**Done when:** `npm run build` passes clean. Smoke test hits every route with 200/201. No unhandled promise rejections in logs.

---

## Summary

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Foundation | App boots, health route live, DB + Redis connected |
| 2 | Auth | Register, login, JWT, sessions, logout |
| 3 | Documents | CRUD + S3 file uploads |
| 4 | Versions | Auto-versioning, restore, diff |
| 5 | LLM | AI suggestions, quality score, interaction logging |
| 6 | OAuth | Google + GitHub login |
| 7 | Hardening | Validation, error handling, smoke tests, clean build |
