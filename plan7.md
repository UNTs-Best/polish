# Polish — Full Rebuild Plan

**5–6 hours/day | Start: March 28, 2026**

---

## Stack

### Backend (`server/`)
- **Runtime:** Node.js + TypeScript (ESM — `module: NodeNext`)
- **Framework:** Express.js
- **ORM:** Prisma + PostgreSQL
- **Cache/Sessions:** Redis (ioredis)
- **Auth:** JWT + bcryptjs + OAuth (Google, GitHub)
- **Validation:** Zod
- **File uploads:** Multer → S3
- **AI:** Gemini 2.5 Flash Using Google AI studio
- 

### Frontend (`client/`)
- **Bundler:** Vite
- **Framework:** React + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + DaisyUI (`pastel` theme)
- **Fonts:** Instrument Serif (headings) + Instrument Sans (body text)
- **API calls:** Native `fetch` with a shared `api.ts` client pointing to Express backend

### Design Tokens
- Background: `#EAE4DA`
- Body text: `#1D1D1B`
- Headings / accent: `#f96015`
- Primary / foreground: `#013e37`

---

## Day 1 — Backend Foundation (March 28)

**Goal:** Clean slate. TypeScript ESM, env config, DB, Redis all connected and verified.

### Tasks
- [ ] Delete all existing `src/` contents — start fresh
- [ ] Verify `tsconfig.json`: `module: NodeNext`, `moduleResolution: NodeNext`
- [ ] Verify `package.json`: `"type": "module"`, correct `dev` / `build` / `start` scripts
- [ ] `src/app.ts` — bare Express app, health route only (`GET /api/health`)
- [ ] `src/config/env.ts` — Zod schema for all env vars (DB, Redis, JWT, OAuth, S3, LLM)
- [ ] `src/config/db.ts` — Prisma client singleton
- [ ] `src/config/redis.ts` — ioredis singleton with error handling
- [ ] `.env.example` — every required key documented
- [ ] `prisma migrate dev` — schema applies cleanly
- [ ] `GET /api/health` returns `{ db: "ok", redis: "ok" }` with live connection checks
- [ ] Core middleware: Helmet, CORS, Morgan, compression, JSON body parser, rate limiter

**Done when:** `npm run dev` starts, health route returns 200 with live DB + Redis checks.

---

## Day 2 — Auth System (March 29)

**Goal:** Full local auth (register, login, logout, refresh, me) end-to-end with JWT + sessions in DB.

### Tasks
- [ ] `src/middleware/auth.ts` — `requireAuth` (validate Bearer JWT, attach `req.user`)
- [ ] `src/middleware/error.ts` — global error handler (caught errors → JSON response)
- [ ] `src/utils/jwt.ts` — `signAccessToken`, `signRefreshToken`, `verifyToken`
- [ ] `src/services/user.service.ts`:
  - `createUser(email, password, firstName, lastName)`
  - `findUserByEmail(email)`
  - `findUserById(id)`
  - `updateUser(id, data)`
  - `verifyPassword(plain, hash)`
- [ ] `src/services/session.service.ts`:
  - `createSession(userId, userAgent, ip)`
  - `findSession(token)`
  - `invalidateSession(token)`
  - `invalidateAllSessions(userId)`
- [ ] `src/controllers/auth.controller.ts`:
  - `POST /api/auth/register` — hash pw, create user + session, return tokens
  - `POST /api/auth/login` — verify pw, create session, return tokens
  - `POST /api/auth/refresh` — validate refresh token, issue new access token
  - `GET /api/auth/me` — return user from `req.user`
  - `PUT /api/auth/profile` — update firstName, lastName
  - `POST /api/auth/change-password` — verify old pw, hash new pw
  - `POST /api/auth/logout` — invalidate session(s)
- [ ] Wire `src/routes/auth.routes.ts`, mount on app

**Done when:** Register → Login → refresh → `/me` → logout all work via curl.

---

## Day 3 — Document CRUD (March 30)

**Goal:** Full document management with file upload support via S3.

### Tasks
- [ ] `src/utils/storage.ts`:
  - `uploadFile(buffer, key, mimeType)` → S3 put
  - `deleteFile(key)` → S3 delete
  - `getPresignedUrl(key, expiresIn)` → S3 presign
- [ ] `src/services/document.service.ts`:
  - `createDocument(userId, data, file?)`
  - `getUserDocuments(userId)`
  - `getDocumentById(id, userId)` — with ownership check
  - `updateDocument(id, userId, data)`
  - `deleteDocument(id, userId)` — delete DB record + S3 file
- [ ] `src/controllers/document.controller.ts`:
  - `GET /api/docs` — list user documents
  - `POST /api/docs` — create (JSON or multipart via Multer)
  - `GET /api/docs/:id`
  - `PUT /api/docs/:id`
  - `DELETE /api/docs/:id`
- [ ] Multer middleware — memory storage, type/size validation
- [ ] Wire `src/routes/document.routes.ts`, mount behind `requireAuth`

**Done when:** Full CRUD works. File uploads store in S3, URL returned in response.

---

## Day 4 — Version Control (March 31)

**Goal:** Auto-versioning on updates, restore, paginated history, and diff.

### Tasks
- [ ] `src/services/version.service.ts`:
  - `createVersion(documentId, content, userId, summary?)`
  - `getVersionsByDocument(documentId)`
  - `getPaginatedHistory(documentId, page, limit)`
  - `getVersionById(versionId)`
  - `restoreVersion(documentId, versionId, userId)` — new version from old content + update doc
  - `compareVersions(versionId1, versionId2)` — line-by-line diff
- [ ] Hook `createVersion` into `document.service.updateDocument` — auto-snapshot every update
- [ ] `src/controllers/version.controller.ts`:
  - `GET /api/versions/document/:documentId`
  - `GET /api/versions/document/:documentId/history`
  - `GET /api/versions/:versionId`
  - `POST /api/versions/document/:documentId/restore/:versionId`
  - `GET /api/versions/compare/:versionId1/:versionId2`
- [ ] Wire `src/routes/version.routes.ts`, mount behind `requireAuth`

**Done when:** Update doc → version auto-created. Restore → content reverts. Diff returns output.

---

## Day 5 — LLM Integration (April 1)

**Goal:** AI endpoints working with interaction logging.

### Tasks
- [ ] `src/services/llm.service.ts`:
  - `generateSuggestions(content, documentType)` → OpenAI, returns structured suggestions
  - `applySuggestions(content, suggestions)` → merged content string
  - `summarizeDocument(content)` → summary string
  - `scoreDocumentQuality(content, documentType)` → `{ score, issues, strengths }`
- [ ] `src/services/aiInteraction.service.ts`:
  - `logInteraction(userId, documentId, prompt, response, model, tokens, cost, type)`
- [ ] Wrap all LLM calls with interaction logging
- [ ] `src/controllers/llm.controller.ts`:
  - `POST /api/llm/documents/:documentId/suggestions`
  - `POST /api/llm/documents/:documentId/apply-suggestions` — apply + auto-version
  - `GET /api/llm/documents/:documentId/summary`
  - `GET /api/llm/documents/:documentId/quality`
  - `PUT /api/llm/documents/:documentId/content`
- [ ] Wire `src/routes/llm.routes.ts`, mount behind `requireAuth`

**Done when:** Quality + suggestions endpoints return structured JSON. Interaction logged in DB.

---

## Day 6 — OAuth (April 2)

**Goal:** Google and GitHub OAuth flows complete end-to-end.

### Tasks
- [ ] `src/services/oauth.service.ts`:
  - `getAuthorizationUrl(provider)` — build URL with state param
  - `exchangeCode(provider, code)` → access token
  - `fetchUserProfile(provider, accessToken)` → email + name
  - `findOrCreateOAuthUser(profile, provider)` → upsert user in DB
  - `generateStateToken()` / `validateStateToken(state)` — Redis CSRF protection
- [ ] `src/controllers/oauth.controller.ts`:
  - `GET /api/oauth/providers`
  - `GET /api/oauth/:provider/url`
  - `GET /api/oauth/:provider/callback` — callback, create session, redirect to client
  - `GET /api/oauth/:provider` — initiate redirect
- [ ] Block `change-password` for OAuth-only users (`hashedpw` is null check)
- [ ] Wire `src/routes/oauth.routes.ts`, mount on app
- [ ] Test Google OAuth full flow
- [ ] Test GitHub OAuth full flow

**Done when:** Google/GitHub login creates user on first visit, reuses record on return.

---

## Day 7 — Backend Hardening & Smoke Tests (April 3)

**Goal:** Production-ready validation, error handling, and a full smoke test pass.

### Tasks
- [ ] Zod request validation on every controller (body, params, query)
- [ ] Audit all services — ownership checks enforced everywhere
- [ ] Error handler covers:
  - Zod errors → 400 with field details
  - Prisma not found → 404
  - JWT errors → 401
  - Generic → 500 (no stack traces in prod)
- [ ] Graceful shutdown: `prisma.$disconnect()` + `redis.quit()` on `SIGTERM` / `SIGINT`
- [ ] `GET /api/health` checks S3 connectivity
- [ ] Smoke test script `scripts/smoke-test.ts`:
  - Register → Login → Create doc → Update doc → Get versions → Restore → LLM quality → Logout
- [ ] `npm run build` — zero TypeScript errors
- [ ] Smoke test passes — every route returns expected status codes

**Done when:** Clean build. Smoke test green. No unhandled rejections in logs.

---

## Day 8 — Frontend Setup & Scaffold (April 4)

**Goal:** Delete Next.js. New Vite + React + TypeScript project wired to the backend.

### Tasks
- [ ] Delete entire `client/` directory contents
- [ ] `npm create vite@latest client -- --template react-ts`
- [ ] Install dependencies:
  - `react-router-dom` (v6)
  - `tailwindcss`, `daisyui`, `@tailwindcss/typography`
  - `lucide-react`
  - `@tanstack/react-query` (for API state)
- [ ] Configure Tailwind: add DaisyUI plugin, set theme to `pastel`
- [ ] Add fonts to `index.html`: Instrument Serif + Instrument Sans from Google Fonts
- [ ] `src/styles/index.css` — set font families, apply base colors
- [ ] `src/api/client.ts` — base fetch wrapper:
  - Reads `VITE_API_URL` from env
  - Attaches `Authorization: Bearer <token>` from localStorage
  - Handles 401 → redirect to login
- [ ] `src/api/auth.ts` — typed wrappers: `register`, `login`, `logout`, `refresh`, `getMe`
- [ ] `src/api/documents.ts` — `listDocuments`, `createDocument`, `getDocument`, `updateDocument`, `deleteDocument`
- [ ] `src/api/versions.ts` — `listVersions`, `getHistory`, `restoreVersion`, `compareVersions`
- [ ] `src/api/llm.ts` — `getSuggestions`, `applySuggestions`, `getSummary`, `getQualityScore`
- [ ] Set up React Router in `src/main.tsx` with route structure:
  - `/` → Landing
  - `/signin` → Sign In
  - `/signup` → Sign Up
  - `/dashboard` → Dashboard (protected)
  - `/editor/:id` → Editor (protected)
  - `/onboarding` → Onboarding (protected)
- [ ] `src/context/AuthContext.tsx` — stores user + tokens, exposes `login`, `logout`, `isAuthed`
- [ ] `ProtectedRoute` component — redirects to `/signin` if not authenticated
- [ ] `client/.env.example` with `VITE_API_URL=http://localhost:3000`

**Done when:** `npm run dev` starts, router loads, API client sends requests with auth headers.

---

## Day 9 — Frontend Pages: Landing, Auth, Dashboard (April 5)

**Goal:** Landing page, sign in/up, and dashboard fully built and wired to backend.

### Tasks

#### Landing Page (`/`)
- [ ] Navbar: logo, Home / Pricing links, Login + Get Started buttons
- [ ] Hero: headline, subheadline, Get Started CTA
- [ ] Features section: 3 cards (AI editing, version history, export)
- [ ] Pricing section: Free vs Pro comparison table
- [ ] Footer

#### Sign In (`/signin`)
- [ ] Email + password form → calls `api/auth.login` → stores tokens → redirect to `/dashboard`
- [ ] OAuth buttons: Google, GitHub, Apple (UI only — OAuth Day 6 wires these)
- [ ] Link to `/signup`
- [ ] Show error toast on failed login

#### Sign Up (`/signup`)
- [ ] First name, last name, email, password → calls `api/auth.register` → redirect to `/onboarding`
- [ ] Same OAuth buttons
- [ ] Link to `/signin`

#### Dashboard (`/dashboard`)
- [ ] Fetch + display document cards via `api/documents.listDocuments`
- [ ] Card shows: title, document type badge, last edited date
- [ ] "New Document" button → `api/documents.createDocument` → redirect to `/editor/:id`
- [ ] Delete document button with confirmation
- [ ] Empty state for no documents
- [ ] User avatar menu (top right): profile, sign out

**Done when:** Can register, sign in, see dashboard with real data, create and delete documents.

---

## Day 10 — Frontend: Editor Page (April 6)

**Goal:** Full document editor wired to backend — editing, autosave, version history, AI tools.

### Tasks

#### Editor Layout
- [ ] Left sidebar: document list (links to other docs), version history panel
- [ ] Main area: `<textarea>` or `contenteditable` div for document content
- [ ] Right panel: AI tools (collapsible)
- [ ] Top bar: editable document title, save status indicator, export button

#### Core Editor
- [ ] Load document on mount via `api/documents.getDocument(id)`
- [ ] Autosave on change (debounced 2s) → `api/documents.updateDocument`
- [ ] Save status: "Saving…" / "Saved" / "Error"
- [ ] Editable title — save on blur

#### Version History Panel
- [ ] List versions from `api/versions.listVersions(documentId)`
- [ ] Click version → preview content in a modal
- [ ] "Restore" button → `api/versions.restoreVersion` → reload document
- [ ] "Compare" button → show side-by-side diff modal

#### AI Tools Panel
- [ ] "Get Suggestions" → `api/llm.getSuggestions` → renders list of suggestions
- [ ] "Apply Suggestions" → `api/llm.applySuggestions` → updates editor content
- [ ] "Score Quality" → `api/llm.getQualityScore` → shows score badge + issues/strengths list
- [ ] "Summarize" → `api/llm.getSummary` → shows summary in a card
- [ ] AI Chat panel: message thread + input → streams responses (or polling)
- [ ] Inline prompt bar: appears on text selection → Rewrite / Shorten / Expand actions

#### Export
- [ ] Export button → dropdown: PDF, DOCX
- [ ] PDF: use `jsPDF` client-side
- [ ] DOCX: use `docx` library client-side

**Done when:** Open editor, type content, autosave fires, versions appear in sidebar, AI tools return real data.

---

## Day 11 — Polish, Onboarding & Final QA (April 7)

**Goal:** Onboarding flow, UI consistency pass, responsive layout, end-to-end test of the full app.

### Tasks

#### Onboarding Page (`/onboarding`)
- [ ] Step 1: "What are you creating?" — document type selector (Resume, Cover Letter, etc.)
- [ ] Step 2: Upload existing document (optional) — parses and pre-fills editor
- [ ] Step 3: Confirm → create document → redirect to `/editor/:id`

#### UI Consistency
- [ ] All pages use Instrument Serif for headings, Instrument Sans for body
- [ ] DaisyUI `pastel` theme applied everywhere — no hardcoded colors
- [ ] Accent color `#f96015` applied to primary buttons and headings
- [ ] Responsive: dashboard and landing work on mobile

#### Final QA
- [ ] Full user journey: Sign up → Onboarding → Editor → AI tools → Version restore → Export → Sign out
- [ ] Sign in with existing account → dashboard loads correct documents
- [ ] Token refresh works — stay logged in across page reloads
- [ ] 401 on expired token → redirect to sign in
- [ ] All API errors show user-facing toast messages (not raw errors)
- [ ] `npm run build` (client) — zero errors
- [ ] `npm run build` (server) — zero errors

**Done when:** Complete user journey works start to finish. Both builds pass clean.

---

## Summary

| Day | Side | Focus |
|-----|------|-------|
| 1 | Backend | Foundation — TypeScript, DB, Redis, health route |
| 2 | Backend | Auth — register, login, JWT, sessions |
| 3 | Backend | Documents — CRUD + S3 uploads |
| 4 | Backend | Versions — auto-versioning, restore, diff |
| 5 | Backend | LLM — AI endpoints + interaction logging |
| 6 | Backend | OAuth — Google + GitHub |
| 7 | Backend | Hardening — validation, error handling, smoke tests |
| 8 | Frontend | Setup — Vite + React, DaisyUI, fonts, API client, routing |
| 9 | Frontend | Pages — Landing, Sign In, Sign Up, Dashboard |
| 10 | Frontend | Editor — autosave, versions, AI tools, export |
| 11 | Frontend | Onboarding, UI polish, full end-to-end QA |
