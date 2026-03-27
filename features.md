# Polish — Feature & Component Reference

> Reference document for TypeScript rewrite. Covers every implemented feature, API, data model, and component in the current JavaScript codebase.
> **Database target: plain PostgreSQL — no Supabase, no CosmosDB.** See the [PostgreSQL Migration Guide](#postgresql-migration-guide) at the bottom for every specific change required.

---

## Tech Stack and Tools 

### Backend (Express.js — to be rewritten in TS)
| Layer | Current | Target (TypeScript rewrite) |
|-------|---------|------------------------------|
| Runtime | Node.js ESM | Node.js, TypeScript |
| Database | Supabase (`@supabase/supabase-js`) | Plain PostgreSQL via `pg` (node-postgres) + connection pool |
| Auth | JWT + bcryptjs + OAuth 2.0 | Same — `jsonwebtoken`, `bcryptjs` |
| Storage | Supabase Storage + Azure Blob | S3-compatible (AWS S3 or self-hosted MinIO) via `@aws-sdk/client-s3` |
| Real-time | Socket.io 4.8.1 | Setup present, not fully used |
| LLM | OpenAI API (gpt-4o-mini) | Direct HTTP via node-fetch |
| File Upload | Multer 2.0.2 | Multipart form data |
| Security | Helmet 8.1.0, express-rate-limit 8.2.1, cors 2.8.5 | |
| Logging | Morgan 1.10.1 | |
| Testing | Node built-in test runner + Supertest 7.0.0 + c8 | |

### Frontend (Next.js — keep as-is or migrate)
| Layer | Current |
|-------|---------|
| Framework | Next.js 14.2.25, React 19 |
| UI | Shadcn UI (50+ components via Radix UI) |
| Styling | Tailwind CSS 4.1.9 |
| LLM (client) | `@anthropic-ai/sdk ^0.74.0` (Claude) |
| PDF | jsPDF 4.1.0, pdfjs-dist |
| DOCX | docx 9.6.0 |
| WebSocket | socket.io-client |
| Forms | react-hook-form + @hookform/resolvers |

---

## Database Schema (PostgreSQL)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | STRING UNIQUE | |
| password_hash | STRING nullable | null for OAuth users |
| first_name | STRING | |
| last_name | STRING | |
| display_name | STRING | auto: `first_name + last_name` |
| avatar_url | STRING | |
| auth_provider | STRING | `local`, `google`, `github`, `apple` |
| auth_provider_id | STRING | provider-specific user ID |
| email_verified | BOOLEAN | |
| is_active | BOOLEAN | |
| last_login | TIMESTAMP | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| title | STRING | |
| content | TEXT | document body |
| document_type | STRING | |
| status | STRING | |
| file_name | STRING | storage file name |
| file_url | STRING | public URL |
| file_size | INTEGER | bytes |
| mime_type | STRING | |
| metadata | JSONB | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `versions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| document_id | UUID FK → documents | cascade delete |
| version_number | INTEGER | auto-incremented |
| content | TEXT | full document snapshot |
| change_summary | TEXT | human-readable description |
| created_by | UUID FK → users | |
| created_at | TIMESTAMP | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| token | TEXT | access token |
| refresh_token | TEXT | |
| user_agent | STRING | |
| ip_address | STRING | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| expires_at | TIMESTAMP | 7 days |

### `ai_interactions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| document_id | UUID FK → documents nullable | |
| prompt | TEXT | |
| response | TEXT | |
| model | STRING | LLM model name |
| prompt_tokens | INTEGER | |
| completion_tokens | INTEGER | |
| total_tokens | INTEGER | |
| cost | DECIMAL | |
| meta | JSONB | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register local user (8+ char password, 1 letter + 1 number) |
| POST | `/login` | — | Local login → access + refresh tokens |
| POST | `/refresh` | — | Refresh access token with refresh token |
| GET | `/me` | ✓ | Get current user profile |
| PUT | `/profile` | ✓ | Update firstName, lastName, avatar |
| POST | `/change-password` | ✓ | Change password (blocked for OAuth users) |
| POST | `/logout` | ✓ | Logout current session or all sessions |

Rate limits: 5 req/15 min on register/login; 30 req/15 min on refresh.

### OAuth — `/api/oauth`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers` | List configured OAuth providers |
| GET | `/:provider/url` | Get authorization URL for provider |
| GET | `/:provider/callback` | Handle OAuth callback (GET) |
| POST | `/:provider/callback` | Handle OAuth callback (POST) |
| GET | `/:provider` | Initiate OAuth flow redirect |

Supported providers: `google`, `github`, `apple`. State param used for CSRF protection.

### Documents — `/api/docs`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | List all documents for current user |
| POST | `/` | ✓ | Create/upload document (multipart or JSON) |
| PUT | `/:id` | ✓ | Update document title or content (auto-versions) |
| DELETE | `/:id` | ✓ | Delete document and all versions |

### Versions — `/api/versions`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/document/:documentId` | ✓ | List all versions |
| GET | `/document/:documentId/history` | ✓ | Version history summary (paginated) |
| GET | `/:versionId` | ✓ | Get content at specific version |
| POST | `/document/:documentId/restore/:versionId` | ✓ | Restore to a version (creates new version) |
| GET | `/compare/:versionId1/:versionId2` | ✓ | Diff two versions |

### LLM — `/api/llm`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/documents/:documentId/suggestions` | ✓ | Generate structured AI suggestions |
| POST | `/documents/:documentId/apply-suggestions` | ✓ | Apply selected suggestions + auto-version |
| GET | `/documents/:documentId/summary` | ✓ | Summarize document content |
| GET | `/documents/:documentId/quality` | ✓ | Quality score (1–10), issues, strengths |
| PUT | `/documents/:documentId/content` | ✓ | Update document content |

### Next.js API Routes — `/app/api`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/documents` | List/create documents (CosmosDB) |
| GET/POST | `/documents/[id]` | Get/update specific document |
| GET/POST | `/documents/[id]/versions` | Version management |
| POST | `/documents/[id]/versions/[versionId]/restore` | Restore version |
| POST | `/chat` | Claude AI chat with MCP tools |
| POST | `/export` | Export document (PDF/DOCX/LaTeX) |
| POST | `/autosave` | Auto-save document content |
| POST | `/claude/verify` | Validate Claude API key |

### Health — `/api/health`
- Basic health/ping endpoint.

---

## Features

### Authentication

**Local Auth**
- Register with email + password (8+ chars, must contain letter and number)
- bcryptjs hashing (12 rounds); password never returned in responses
- JWT access token (15 min) + refresh token (7 days)
- Email format validation

**OAuth 2.0**
- Google: scopes `openid email profile`
- GitHub: scopes `user:email read:user`; requires 2 API calls (user + emails)
- Apple Sign-In: user info decoded from JWT ID token
- Automatic account creation or linking on first login
- State parameter CSRF validation

**Session Management**
- Sessions stored in DB with user-agent + IP
- `x-session-id` request header tracks per-device activity
- Single-device logout or all-devices logout
- Session expiry: 7 days; activity updated on each authenticated request

---

### Document Management

- Full CRUD on documents owned by user
- File upload via multipart (Multer) stored to S3-compatible storage at key `userId/fileName`
- Public URL + presigned URL generation
- Supported MIME types: PDF, DOCX, TXT, MD, JSON, and others
- Metadata tracked: file name, URL, size, MIME type

---

### Version Control

- Version automatically created on every document create or update
- Sequential version numbering
- Each version stores: full content snapshot, change summary, author, timestamp
- Operations: list all versions, get by ID, restore (creates new version), compare/diff two versions
- Cascade delete when parent document is deleted

---

### AI Features (Backend — OpenAI)

**Suggestion Generation**
- Model: `gpt-4o-mini` (temp 0.3)
- Returns structured JSON array of suggestions:
  - `type`: grammar | style | clarity | structure | content
  - `original`: original text
  - `suggested`: replacement text
  - `explanation`: reason for change
- Configurable: action, tone, length, language, custom instructions

**Apply Suggestions**
- Applies selected suggestions to document content
- Sorted to avoid offset conflicts during application
- Creates a new version automatically after applying

**Quality Check**
- Returns: score (1–10), list of issues, list of strengths
- Fallback response on API failure

**Summarization**
- Configurable max length
- Used for document previews

---

### AI Features (Frontend — Claude via Anthropic SDK)

- User provides their own Claude API key via a modal (stored in localStorage)
- API key verified via `/api/claude/verify` before use
- Chat interface with message history + timestamps
- Quick action prompts: "Optimize for ATS", "Proofread", "Make concise"
- MCP tools give Claude context: selected text, full document content
- Undo support for applied AI changes

---

### Export

- **PDF** — jsPDF
- **DOCX** — docx library
- **LaTeX** — `.tex` file generation
- Triggered via `/api/export` Next.js route → download

---

### Auto-save

- Periodic auto-save hook (`use-autosave.ts`) saves content to backend
- Tracks last-saved timestamp
- Each save creates a new document version

---

### Real-time (Socket.io — partial)

- `documentSocket.js` is configured server-side
- Infrastructure ready for real-time collaboration
- Not fully implemented in current UI

---

## Middleware

### `requireAuth` (`auth.middleware.js`)
- Validates `Authorization: Bearer <token>` header
- Verifies JWT signature and expiry
- Sets `req.auth`: `{ id, email, provider, type }`
- Reads `x-session-id` header and updates session activity

### `optionalAuth` (`auth.middleware.js`)
- Same as `requireAuth` but does not fail on missing/invalid token
- Sets `req.auth` if valid, otherwise continues

### `requireAdmin` (`auth.middleware.js`)
- Requires `requireAuth` first
- Checks `req.auth` presence (admin check placeholder)

### Error Handler (`error.middleware.js`)
- Centralized error responses
- Structured JSON error format

### Security Middleware (in `app.js`)
- `helmet()` — security headers (CSP disabled for API compat)
- `cors()` — configured allowed origins
- `express-rate-limit` — per-IP rate limiting on auth routes
- `morgan` — HTTP request logging

---

## Service Layer

### `UserService`
- `createUser(data)` — local registration
- `getUserByEmail(email)`
- `getUserByProviderId(provider, providerId)`
- `createOAuthUser(provider, providerData)` — create or link
- `updateUser(id, updates)`
- `deleteUser(id)`
- `getAllUsers(limit, offset)`

### `DocumentService`
- `createDocument(data)` → creates doc + version 1 ("Document created")
- `getUserDocuments(ownerId)`
- `getDocumentById(id)`
- `updateDocument(id, updates, updatedBy)` → detects changes, creates version
- `deleteDocument(id)` → cascades to versions

### `VersionService`
- `createVersion(documentId, versionData)`
- `getDocumentVersions(documentId)`
- `getLatestVersion(documentId)`
- `getVersionById(versionId)`
- `restoreVersion(documentId, versionId, restoredBy)` → creates new version
- `compareVersions(v1Id, v2Id)` → diff output
- `getVersionHistory(documentId, limit)`

### `LLMService`
- `generateSuggestions(content, context)` → structured JSON suggestions
- `applySuggestions(content, suggestions)` → modified content string
- `summarizeContent(content, maxLength)`
- `checkContent(content)` → `{ score, issues, strengths }`
- `isConfigured()` → boolean (checks `OPENAI_API_KEY`)

### `OAuthService`
- `getAuthUrl(provider, state)`
- `exchangeCodeForToken(provider, code)`
- `getUserInfo(provider, accessToken)`
- `handleCallback(provider, code, userAgent, ipAddress)` → user + tokens
- `getAvailableProviders()`
- `isProviderConfigured(provider)`
- `validateState(state, expectedState)`

### `SessionService`
- `generateAccessToken(user)` — 15 min JWT
- `generateRefreshToken(user)` — 7 day JWT + tokenId
- `verifyAccessToken(token)`
- `verifyRefreshToken(token)`
- `loginUser(user, userAgent, ipAddress)` → session + both tokens
- `refreshAccessToken(refreshToken)` → new access token
- `logoutUser(userId, sessionId)`
- `getUserSessions(userId)`
- `deactivateSession(sessionId)`
- `deactivateAllUserSessions(userId)`
- `updateSessionActivity(sessionId)`

### `AIInteractionService`
- Logs all LLM calls: prompt, response, model, token counts, cost

---

## Frontend Components

### Pages
| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Landing page |
| `/editor` | `app/editor/page.tsx` | Main editor |
| `/dashboard` | `app/dashboard/page.tsx` | User document list |
| `/signin` | `app/signin/page.tsx` | Sign in |
| `/signup` | `app/signup/page.tsx` | Sign up |
| `/onboarding` | `app/onboarding/page.tsx` | Onboarding flow |

### Key Components
| Component | File | Purpose |
|-----------|------|---------|
| AI Chat | `components/ai-chat.tsx` | Claude chat UI, quick actions, undo |
| Claude Connect | `components/claude-connect.tsx` | API key modal, verification, status |
| Editor Sidebar | `components/editor-sidebar.tsx` | Doc navigation, version history, export, upload |
| Resume Renderer | `components/resume-renderer.tsx` | Live preview, print-friendly |
| Version History | `components/version-history.tsx` | Timeline, restore, compare UI |
| Export Dialog | `components/export-dialog.tsx` | Format selection + download |
| File Upload | `components/file-upload.tsx` | Drag-and-drop, validation, progress |

### Custom Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useAutosave` | `hooks/use-autosave.ts` | Periodic save with timestamp |
| `useToast` | `hooks/use-toast.ts` | Toast notifications |
| `useMobile` | `hooks/use-mobile.ts` | Responsive breakpoint detection |

### UI Component Library (Shadcn + Radix)
Dialog, Popover, DropdownMenu, ContextMenu, Sheet, Sidebar, Tabs, Accordion, Collapsible, Toast, Alert, AlertDialog, Select, RadioGroup, Checkbox, Switch, Toggle, Pagination, Breadcrumb, NavigationMenu, Table, ScrollArea, Slider, Progress, InputOTP, Badge, Avatar, Separator, Card, Button, Input, Textarea, Label — and more.

---

## Frontend State & Storage

| Key | Storage | Value |
|-----|---------|-------|
| `polish_user` | localStorage | User profile object |
| `polishEditor_document` | localStorage | Current document state |
| `polish_onboarding_{userId}` | localStorage | Onboarding completion flag |
| Claude API key | localStorage / state | User-provided Anthropic key |
| JWT access token | request header | `Authorization: Bearer ...` |
| Session ID | request header | `x-session-id` |

---

## Environment Variables

### Server
```
PORT                        # default 5000
NODE_ENV

# PostgreSQL (plain connection string — no Supabase)
DATABASE_URL                # postgres://user:password@host:5432/dbname
# or individual vars (pg respects both)
PGHOST
PGPORT
PGUSER
PGPASSWORD
PGDATABASE
DATABASE_POOL_MAX           # default: 10

# S3-compatible file storage (replaces Supabase Storage)
S3_ENDPOINT                 # omit for AWS; set for MinIO, e.g. http://localhost:9000
S3_REGION                   # e.g. us-east-1
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_BUCKET                   # default: documents
S3_PUBLIC_URL               # base URL for public file access

# JWT
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN       # default: 15m
JWT_REFRESH_EXPIRES_IN      # default: 7d

# OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_REDIRECT_URI

APPLE_CLIENT_ID
APPLE_CLIENT_SECRET
APPLE_REDIRECT_URI

# LLM
OPENAI_API_KEY
LLM_MODEL                   # default: gpt-4o-mini
```

### Frontend
```
NEXT_PUBLIC_API_URL         # default: http://localhost:5000
```
Note: remove all `NEXT_PUBLIC_SUPABASE_*` variables — the frontend no longer talks to Supabase directly.

---

## Test Files (Server)

| File | Covers |
|------|--------|
| `test/api.integration.test.js` | Full API integration |
| `test/app.routes.test.js` | Route handler tests |
| `test/auth.test.js` | Auth flows |
| `test/document.service.test.js` | Document CRUD + versioning |
| `test/llm.service.test.js` | LLM integration |
| `test/version.service.test.js` | Version operations |

Run: `npm test` · `npm run test:watch` · `npm run test:coverage`

---

## Feature Status Summary

| Feature | Status |
|---------|--------|
| Local auth (register/login/refresh/logout) | ✓ |
| OAuth (Google / GitHub / Apple) | ✓ |
| Multi-device session management | ✓ |
| Document CRUD | ✓ |
| File upload to S3-compatible storage | ✓ |
| Auto-versioning on every save | ✓ |
| Version restore | ✓ |
| Version compare/diff | ✓ |
| AI suggestions (OpenAI) | ✓ |
| Apply suggestions + auto-version | ✓ |
| Quality check (score + issues) | ✓ |
| Document summarization | ✓ |
| Claude chat UI (client-side Anthropic SDK) | ✓ |
| Export PDF / DOCX / LaTeX | ✓ |
| Auto-save hook | ✓ |
| Rate limiting | ✓ |
| Security headers (Helmet) | ✓ |
| AI interaction logging | ✓ |
| Real-time collaboration (Socket.io) | partial — infra ready, UI not wired |

---

## PostgreSQL Migration Guide

Everything below is what you must change, create, or delete to move from Supabase to plain PostgreSQL with S3-compatible file storage.

---

### 1. Packages

**Remove:**
```
@supabase/supabase-js
@azure/cosmos             (CosmosDB used in Next.js API routes — replace with pg too)
@azure/storage-blob       (if you're also dropping Azure Blob)
```

**Add:**
```
pg                        # node-postgres
@types/pg                 # TypeScript types
@aws-sdk/client-s3        # S3-compatible storage (works with MinIO)
@aws-sdk/s3-request-presigner  # presigned URLs
```

---

### 2. Delete entirely

| File | Reason |
|------|--------|
| `src/config/supabase.js` | Replaced by `src/config/db.ts` |
| `src/utils/supabaseStorage.js` | Replaced by `src/utils/storage.ts` |
| `src/middleware/auth0.middleware.js` | Already deleted per git status |

---

### 3. New file: `src/config/db.ts`

Replaces `src/config/supabase.js`. Exports a single `pg.Pool` instance.

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export default pool;

// Use instead of getSupabaseAdmin() everywhere:
// import pool from '../config/db.js';
// const { rows } = await pool.query('SELECT ...', [params]);
```

Replace `connectSupabase()` in `app.js` with:

```typescript
await pool.query('SELECT 1'); // verify connection on startup
```

---

### 4. New file: `src/utils/storage.ts`

Replaces `src/utils/supabaseStorage.js`. Uses `@aws-sdk/client-s3`.

**Functions to implement (same interface as before):**

```typescript
uploadFile(filePath: string, originalName: string, userId: string)
  → Promise<{ path: string; url: string; fileName: string }>

deleteFile(storagePath: string) → Promise<void>

getPresignedUrl(storagePath: string, expiresIn?: number) → Promise<string>
```

**Env vars used:** `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL`

For MinIO set `S3_ENDPOINT=http://localhost:9000` and `forcePathStyle: true` in the S3 client config. For AWS S3 omit `S3_ENDPOINT`.

Public URL pattern: `${S3_PUBLIC_URL}/${userId}/${fileName}` (same path structure as before: `userId/fileName`).

---

### 5. SQL schema — run once on your Postgres instance

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT,                    -- null for OAuth users
  first_name       TEXT,
  last_name        TEXT,
  display_name     TEXT,
  avatar_url       TEXT,
  auth_provider    TEXT NOT NULL DEFAULT 'local',
  auth_provider_id TEXT,
  email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  document_type TEXT,
  status        TEXT,
  file_name     TEXT,
  file_url      TEXT,
  file_size     INTEGER,
  mime_type     TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        TEXT NOT NULL DEFAULT '',
  change_summary TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token         TEXT,
  refresh_token TEXT,
  user_agent    TEXT,
  ip_address    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE ai_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id      UUID REFERENCES documents(id) ON DELETE SET NULL,
  prompt           TEXT,
  response         TEXT,
  model            TEXT,
  prompt_tokens    INTEGER,
  completion_tokens INTEGER,
  total_tokens     INTEGER,
  cost             NUMERIC(10, 6),
  meta             JSONB,
  interaction_type TEXT NOT NULL DEFAULT 'chat',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_document_id ON ai_interactions(document_id);
```

> Note: `ai_interactions` in the current code uses `tokens_used` + `interaction_type` columns (not the full `prompt_tokens/completion_tokens/cost` split in the old Supabase model). The schema above includes both. Match whichever you decide to keep in the rewrite.

---

### 6. Service-by-service query translation

All Supabase SDK calls translate to parameterized `pool.query()` calls. Pattern reference:

| Supabase | PostgreSQL (`pool.query`) |
|----------|--------------------------|
| `.from('t').select('*').eq('col', v).single()` | `SELECT * FROM t WHERE col = $1 LIMIT 1` → `rows[0] \|\| null` |
| `.from('t').select('*').eq('col', v)` | `SELECT * FROM t WHERE col = $1` → `rows` |
| `.from('t').select('*').eq('col', v).order('created_at', {ascending:false})` | `SELECT * FROM t WHERE col = $1 ORDER BY created_at DESC` |
| `.from('t').select('*').range(offset, offset+limit-1)` | `SELECT * FROM t LIMIT $1 OFFSET $2` |
| `.from('t').insert(obj).select().single()` | `INSERT INTO t (...) VALUES (...) RETURNING *` → `rows[0]` |
| `.from('t').update(obj).eq('id', id).select().single()` | `UPDATE t SET col=$1 WHERE id=$2 RETURNING *` → `rows[0]` |
| `.from('t').delete().eq('id', id)` | `DELETE FROM t WHERE id = $1` |
| Error code `PGRST116` (no rows) | Check `rows.length === 0` — `pg` does not throw on empty results |

#### `UserService` — key queries

```typescript
// getUserByEmail
SELECT * FROM users WHERE email = $1 LIMIT 1

// getUserByProviderId
SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2 LIMIT 1

// getUserById
SELECT * FROM users WHERE id = $1 LIMIT 1

// createUser
INSERT INTO users (id, email, password_hash, first_name, last_name, display_name,
  avatar_url, auth_provider, auth_provider_id, email_verified, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *

// updateUser
UPDATE users SET first_name=$1, last_name=$2, display_name=$3, avatar_url=$4,
  updated_at=NOW() WHERE id=$5 RETURNING *

// deleteUser
DELETE FROM users WHERE id = $1

// getAllUsers
SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2
```

#### `DocumentService` — key queries

```typescript
// getUserDocuments
SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC

// getDocumentById
SELECT * FROM documents WHERE id = $1 LIMIT 1

// createDocument  (then call versionService.createVersion separately)
INSERT INTO documents (id, user_id, title, content, file_name, file_url,
  file_size, mime_type, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *

// updateDocument
UPDATE documents SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 RETURNING *

// deleteDocument  (versions cascade via FK; call deleteDocumentVersions first if no CASCADE)
DELETE FROM documents WHERE id = $1
```

#### `VersionService` — key queries

```typescript
// getLatestVersion
SELECT * FROM versions WHERE document_id = $1 ORDER BY version_number DESC LIMIT 1

// createVersion
INSERT INTO versions (id, document_id, version_number, content, change_summary,
  created_by, created_at)
VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *

// getDocumentVersions
SELECT * FROM versions WHERE document_id = $1 ORDER BY version_number DESC

// getVersionById
SELECT * FROM versions WHERE id = $1 LIMIT 1

// deleteDocumentVersions
DELETE FROM versions WHERE document_id = $1
```

#### `SessionService` — key queries

```typescript
// createSession
INSERT INTO sessions (id, user_id, token, refresh_token, user_agent,
  ip_address, is_active, created_at, expires_at)
VALUES ($1,$2,$3,$4,$5,$6,TRUE,NOW(),$7) RETURNING *

// getUserSessions
SELECT * FROM sessions WHERE user_id = $1 AND is_active = TRUE
  ORDER BY created_at DESC

// updateSessionActivity (check expiry then return session)
SELECT * FROM sessions WHERE id = $1 AND is_active = TRUE LIMIT 1
UPDATE sessions SET is_active = FALSE WHERE id = $1  -- if expired

// deactivateSession
UPDATE sessions SET is_active = FALSE WHERE id = $1

// deactivateAllUserSessions
UPDATE sessions SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE

// refreshAccessToken — find session by refresh token
SELECT * FROM sessions WHERE refresh_token = $1 AND is_active = TRUE LIMIT 1
SELECT * FROM users WHERE id = $1 LIMIT 1
UPDATE sessions SET token = $1 WHERE id = $2

// loginUser — update last_login
UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1
```

#### `AIInteractionService` — key queries

```typescript
// logInteraction
INSERT INTO ai_interactions (id, user_id, document_id, prompt, response, model,
  tokens_used, interaction_type, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *

// getUserInteractions
SELECT * FROM ai_interactions WHERE user_id = $1
  ORDER BY created_at DESC LIMIT $2

// getDocumentInteractions
SELECT * FROM ai_interactions WHERE document_id = $1
  ORDER BY created_at DESC LIMIT $2
```

---

### 7. `src/config/db.ts` — connection startup (replaces `connectSupabase`)

In `app.ts`:

```typescript
import pool from './config/db.js';

// On startup:
try {
  await pool.query('SELECT 1');
  console.log('✅ PostgreSQL connected');
} catch (err) {
  console.error('❌ PostgreSQL connection failed:', err);
  process.exit(1);
}
```

---

### 8. Next.js frontend API routes (`/app/api/documents`)

The current frontend routes hit **CosmosDB** directly (different from the Express backend). In the rewrite, point these at the Express API instead of maintaining a second DB connection. Remove all CosmosDB SDK usage from the frontend; every data operation should go through `NEXT_PUBLIC_API_URL`.

---

### 9. Files affected — complete list

| File | Action |
|------|--------|
| `src/config/supabase.js` | **Delete** — replace with `src/config/db.ts` |
| `src/utils/supabaseStorage.js` | **Delete** — replace with `src/utils/storage.ts` |
| `src/services/user.service.js` | **Rewrite** — swap all Supabase calls for `pool.query()` |
| `src/services/document.service.js` | **Rewrite** |
| `src/services/version.service.js` | **Rewrite** |
| `src/services/session.service.js` | **Rewrite** |
| `src/services/aiInteraction.service.js` | **Rewrite** |
| `src/controllers/document.controller.js` | **Update** — swap `uploadFileToSupabase` → `uploadFile` from new storage util |
| `src/routes/upload.routes.js` | **Update** — same storage util swap |
| `src/app.js` | **Update** — replace `connectSupabase()` with `pool.query('SELECT 1')` |
| `app/api/documents/` (Next.js) | **Rewrite** — remove CosmosDB, call Express API instead |

---

### 10. What does NOT change

- All JWT logic in `SessionService` (no Supabase auth was used — tokens are self-issued)
- All OAuth logic in `OAuthService` (no Supabase auth SDK involved)
- All LLM logic in `LLMService`
- All middleware (`requireAuth`, `optionalAuth`, `requireAdmin`, error handler)
- All routes and controllers (except the storage util import in document controller)
- The model ↔ DB mapping functions (`modelToDb` / `dbToModel`) — keep the same column names
- All frontend components, hooks, and pages (except removing Supabase client imports)
