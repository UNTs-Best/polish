# Polish — Requirements Document

---

## Revision History

| Date | Section / Task | Contributor(s) | Details |
|---|---|---|---|
| 09/30/2025 | Project Overview | Mohamed Babiker, Arnav Verma | Wrote complete overview covering product vision, Azure architecture, and user centered design |
| 10/01/2025 | Problem Statement | Mohamed Babiker | Authored full section on AI tool fragmentation and Polish's integrated workflow |
| 10/02/2025 | System Requirements | Arnav Verma, Walid Esmael | Defined cloud stack and platform components |
| 10/04/2025 | User Profile | Matthew Norman | Composed target audience, pain points, and goals |
| 10/06/2025 | Functional Requirements | Arnav Verma | Drafted core features (F1-F10) and user stories (R1-R10), defined NF1-NF6 |
| 10/08/2025 | Sprint 1 Scope | Mohamed Babiker | Outlined sprint goals, deliverables, and highlights |
| 10/09/2025 | Testing Summary | Walid Esmael | Authored testing objectives, approach, environment, risks, and outcomes |
| 10/10/2025 | Challenges | Arnav Verma, Mohamed Babiker | Documented async and UI animation issues |
| 10/12/2025 | Sprint Velocity | Matthew Norman | Compiled sprint metrics and collaboration process |
| 11/16/2025 | JWT Authentication | Arnav Verma | Implemented RS256 JWT validation middleware and route protection |
| 12/01/2025 | LLM Service | Matthew Norman | Built Azure OpenAI interactions including streaming and templates |
| 12/04/2025 | Final Integration | Walid Esmael, Mohamed Babiker | Final proofreading and formatting |
| 01/10/2026 | Claude AI Integration | Arnav Verma, Matthew Norman | Migrated from Azure OpenAI to Claude AI via MCP server |
| 01/11/2026 | Database Migration | Arnav Verma | Completed migration from Cosmos DB to PostgreSQL |
| 01/12/2026 | Multi-format Support | Mohamed Babiker | Added RTF and TXT format support |
| 01/13/2026 | Authentication Overhaul | Arnav Verma | Implemented custom JWT authentication system |
| 01/14/2026 | UI/UX Redesign | Walid Esmael, Mohamed Babiker | Complete landing page redesign with Claude branding |
| 01/15/2026 | Security Enhancements | Arnav Verma | Comprehensive API key protection measures |
| 02/16/2026 | CI/CD Implementation | Arnav Verma | Added automated deployment pipeline with GitHub Actions |
| 02/16/2026 | Custom API Keys (BYOK) | Arnav Verma | Implemented Bring Your Own Key feature for Claude API |
| 03/03/2026 | Sprint 5 Updates | Mohamed Babiker, Matthew Norman, Walid Esmael | Database migration (Matthew Norman). Import/export logic and document parsing (Mohamed Babiker). Auth/security migration to backend (Walid Esmael). Test plan and tracker updated. |
| 03/03/2026 | Sprint 6 Requirements | Arnav Verma | Added F1-F8 feature set (free AI model, upload fix, multi-project support, import, AI tailoring, cover letter, onboarding). Added R1-R11 user stories. Updated non-functional requirements. |
| 03/10/2026 | Project Overview Revision and Updates | Arnav Verma | Updated project description and problem statement to better match the product |
| 03/16/2026 | Updated List of Features | Arnav Verma | Added new features |
| 03/17/2026 | Section 9 Revision | Arnav Verma | Added a well-structured system architecture description. Removed the MCP server section. Changed microservices architecture to clean architecture. |
| 03/18/2026 | Testing | Arnav Verma | Updated the testing plans and overall content for this section |
| 04/02/2026 | AI Branding Update | Arnav Verma | Replaced all Claude/MCP references on the landing page with Gemini. Removed MCP Server marketing copy throughout the frontend. |
| 04/04/2026 | Editor Font Standardisation | Arnav Verma | Enforced Arial font across the editor preview and all export formats (PDF, RTF, LaTeX, DOCX). Updated RTF font table declaration and LaTeX preamble. |
| 04/07/2026 | Railway Deployment | Arnav Verma | Deployed frontend and backend services to Railway. Configured environment variables, provisioned PostgreSQL and Redis add-ons, and ran `prisma migrate deploy` against the production database. |
| 04/09/2026 | Profile Dropdown Bug Fix | Arnav Verma | Fixed sign-out dropdown not closing on outside click across landing page, dashboard, and editor. Replaced Radix UI DropdownMenu with a custom `useRef`-based implementation and `mousedown` click-outside handler. |
| 04/11/2026 | Editor ContentEditable Bug Fix | Arnav Verma | Fixed cursor jumping to the start of the editor on re-render. Introduced a `isFocused` ref that prevents `innerHTML` from being overwritten while the user is actively editing. |
| 04/14/2026 | PDF Export Bug Fix | Arnav Verma | Fixed blank second-page issue where long resumes were silently clipped at the first-page boundary. Added dynamic page-break logic with a `y` position tracker inside the PDF generation loop. |
| 04/16/2026 | Demo Animation Bug Fix | Arnav Verma | Fixed live demo modal animation sequence running out of order due to a stale closure over `demoStep` state. Refactored `runDemoSequence` to accept an explicit `step` parameter instead of reading from React state. |
| 04/18/2026 | Version Restore Security Fix | Arnav Verma | Fixed version restore endpoint not validating that the target version belongs to the document in the URL. Added ownership check in the `restoreVersion` service that throws `AppError(400)` on mismatch. |
| 04/21/2026 | LLM Service Architecture | Arnav Verma | Documented the full LLM service architecture including Gemini 2.5 Flash integration, all five API endpoints, the `<changes>` block parsing protocol, per-user API key support, and AI interaction logging. |
| 04/23/2026 | API Design Documentation | Arnav Verma | Wrote comprehensive API design section covering all four routers (auth, docs, versions, llm), request/response schemas, rate limiting, error normalisation, and Zod validation strategy. |
| 04/24/2026 | Authentication Documentation | Arnav Verma | Documented the dual-token JWT scheme, session persistence model, `requireAuth` middleware flow, refresh token lifecycle, password hashing with bcrypt, and frontend token storage strategy. |
| 04/25/2026 | Backend Architecture Documentation | Arnav Verma | Documented Express three-layer architecture, security middleware stack, Prisma ORM schema, Redis setup, S3 conditional file storage, and graceful SIGTERM shutdown. |
| 04/26/2026 | Frontend Architecture Documentation | Arnav Verma | Documented Next.js App Router structure, token refresh scheduling via `useTokenRefresh`, `contentEditable` + `parseDom` editing model, autosave debouncing, AI chat sidebar design, and client-side export pipeline. |
| 04/28/2026 | Test Plan Documentation | Arnav Verma | Documented complete unit test suite using Vitest. Detailed test cases for JWT utilities, auth middleware, error handler, user/session/document/version/LLM services, mocking strategy, and CI integration. |
| 04/29/2026 | Sprint 7 Deliverables and Test Results | Arnav Verma | Documented Sprint 7 deliverables, five bug fixes, and six test case outcomes (TC-STO-001 through TC-SEC-001) with root cause analysis for failures. |
| 04/30/2026 | CI/CD and Deployment Documentation | Arnav Verma | Wrote detailed CI/CD section covering the three-job GitHub Actions pipeline (lint, build-frontend, build-backend) and full Railway deployment flow for frontend, backend, PostgreSQL, and Redis services. |

---

## 18. Sprint 7

### Deliverables

| Task | Status | Owner |
|---|---|---|
| Build GitHub Actions Pipeline | Done | Arnav Verma |
| Deploy full project to Railway | Done | Arnav Verma |
| Import and Export Logic | Done | Arnav Verma |
| Enhanced document parsing and export for professional output | Done | Arnav Verma |
| Editor bug fixes | Done | Arnav Verma |
| General debugging | Done | Arnav Verma |
| Reflections Doc | Done | Arnav Verma |
| Test Plan | Done | Arnav Verma |

### Bug Fixes

**BUG-001 — Sign-out dropdown not closing on outside click**
The profile dropdown on the dashboard and landing page did not close when clicking elsewhere on the page. The original implementation used the shadcn/ui `DropdownMenu` component, which relies on Radix UI portals that had event propagation issues in the sticky navbar layout. The fix replaced the shadcn component with a custom `useRef`-based dropdown and a `mousedown` event listener on `document` that checks whether the click target is outside the menu container before setting visibility to false. The fix was applied consistently across the landing page, dashboard, and editor.

**BUG-002 — Editor contentEditable losing cursor position on re-render**
When the user typed in the editor and React re-rendered due to unrelated state changes (e.g. autosave status toggling), the `contentEditable` div was being re-assigned `innerHTML`, which caused the cursor to jump to the beginning of the field. The fix introduced a `isFocused` ref that is set to `true` on the div's `onFocus` event and `false` on `onBlur`. The `useEffect` that syncs external state changes into the DOM now skips the `innerHTML` assignment entirely while `isFocused.current` is `true`, so user-driven edits are never interrupted.

**BUG-003 — AI chat demo animation sequence running out of order**
The live demo modal on the landing page used a recursive `setTimeout` callback that closed over the `demoStep` React state variable. Because the closure captured the value of `demoStep` at the time the function was first defined (always `0`), subsequent animation steps never advanced and the sequence looped on the first message indefinitely. The fix changed the function signature to `runDemoSequence(step: number)` and passed the current step explicitly on each recursive call instead of reading state, eliminating the stale closure.

**BUG-004 — Version restore overwriting wrong document**
The version restore endpoint did not validate that the requested version belonged to the document specified in the URL. A crafted request could restore a version from a different document into the current one. The fix added an ownership check in the `restoreVersion` service function that throws `AppError(400)` if `version.documentId !== documentId` before any write is attempted.

**BUG-005 — Export dialog producing blank PDF for long resumes**
For resumes with more than approximately 55 lines of content, the jsPDF export was silently clipping content that overflowed the first page without creating a second page. The fix added a `y` position tracker to the PDF generation loop that calls `doc.addPage()` and resets `y` to the top margin whenever the remaining vertical space on the current page falls below a minimum threshold.

### Test Results

| Test Case | Feature | Description | Result |
|---|---|---|---|
| TC-STO-001 | F2 | File upload and storage via Prisma | Fail |
| TC-STO-002 | F2 | File export and download | Pass |
| TC-LOG-003 | F3 | Add new resume with name | Fail |
| TC-LOG-001 | F1 | Automated error logging | Pass |
| TC-DATA-001 | NF3 | Data integrity after database migration | Pass |
| TC-SEC-001 | NF1 | Session security / auth gating | Pass |

#### Test Case Details

**TC-STO-001 — File upload and storage via Prisma (Fail)**
The file upload flow for PDF and DOCX files failed during Sprint 7 testing. The upload request reached the backend and was processed by Multer correctly, but the S3-compatible storage client returned a credentials error due to a misconfigured `AWS_REGION` environment variable in the Railway service. Files were not persisted and the `fileUrl` column was left null on the resulting document record. The credentials configuration was corrected and a re-test is planned for the next sprint.

**TC-STO-002 — File export and download (Pass)**
All four export formats (PDF, DOCX, RTF, LaTeX) were generated correctly from the editor. The client-side export logic in `ExportDialog` produced valid files in each format, downloaded with the correct filename and MIME type. Arial font was confirmed present in the RTF font table and the LaTeX preamble. The PDF page-overflow bug fix (BUG-005) was verified to produce multi-page output for long resumes.

**TC-LOG-003 — Add new resume with name (Fail)**
Creating a new document from the dashboard did not persist a user-entered title. The "New Document" flow submitted the creation request immediately with a hardcoded `"Untitled Resume"` title without presenting a naming prompt to the user. The document was created successfully in the database but the title was incorrect. A title input step is planned for the next sprint.

**TC-LOG-001 — Automated error logging (Pass)**
The AI interaction logging pipeline correctly wrote records to the `AiInteraction` table for all LLM endpoint calls (chat, suggestions, quality, summary). Log records contained the correct `userId`, `documentId`, `interactionType`, and truncated prompt and response fields. The `/api/health` endpoint confirmed database and Redis connections were healthy throughout testing on the Railway deployment.

**TC-DATA-001 — Data integrity after database migration (Pass)**
The Prisma migration applied against the Railway-hosted PostgreSQL instance completed without data loss. All user, document, and version records were verified to be present and intact after `prisma migrate deploy` ran in the production environment. Foreign key constraints, indexes, and default values were confirmed to match the schema definition.

**TC-SEC-001 — Session security / auth gating (Pass)**
Unauthenticated requests to all protected routes (`/api/docs`, `/api/versions`, `/api/llm`) correctly returned `401` responses. Requests with expired access tokens returned `401 Token expired`. The token refresh flow silently renewed the access token 60 seconds before expiry and the session remained active without requiring the user to re-login. Logout correctly invalidated the session and subsequent refresh attempts with the same refresh token were rejected.

---

## API Design

The Polish backend exposes a REST API mounted under the `/api` prefix. All routes are organised into four routers — `authRouter`, `documentRouter`, `versionRouter`, and `llmRouter` — each registered at its own path prefix. Every resource endpoint that operates on user-owned data is protected by the `requireAuth` middleware, which must be passed before the controller logic runs. The API communicates exclusively in JSON, with request bodies validated using Zod schemas inside each controller before any service function is called. Validation errors are normalised into a consistent `{ error, details }` shape by the global error handler.

### Auth Endpoints (`/api/auth`)

A rate limiter (20 requests per 15-minute window) is applied specifically to the `POST /register` and `POST /login` routes to mitigate brute-force attacks. Registration accepts `email`, `password` (minimum 8 characters), `firstName`, and an optional `lastName`, and returns the new user object together with a short-lived access token and a long-lived refresh token. Login accepts `email` and `password` and returns the same shape on success, or a generic `401 Invalid credentials` response on failure — both wrong email and wrong password produce an identical response to avoid user enumeration. The `POST /refresh` endpoint accepts a refresh token in the request body, validates it cryptographically, checks that the corresponding session row exists and is still active in the database, and issues a new access token. `GET /me` and `PUT /profile` are authenticated endpoints for reading and updating the current user's profile. `POST /change-password` accepts the old password for verification before hashing and storing the new one. `POST /logout` accepts an optional `refreshToken` and an optional `all` boolean; passing `all: true` marks every session belonging to the user as inactive in a single `updateMany` call.

### Document Endpoints (`/api/docs`)

All document routes require authentication. `GET /` returns the authenticated user's documents ordered by `updatedAt` descending. `POST /` accepts either a JSON body with `title`, `content`, and `documentType`, or a multipart/form-data request with an optional file attachment handled by Multer (memory storage, 10 MB limit, MIME type restricted to PDF, DOCX, and plain text). If a file is provided, the document service uploads it to S3-compatible storage and stores the resulting key as `fileUrl`. `GET /:id` returns a single document after ownership verification. `PUT /:id` updates editable fields; updating the `content` field also triggers an automatic version snapshot. `DELETE /:id` first attempts to delete the associated file from object storage if a `fileUrl` exists, then deletes the database record regardless of whether the storage deletion succeeded.

### Version Endpoints (`/api/versions`)

`GET /document/:documentId` returns all versions for a document ordered by `versionNumber` descending. `GET /document/:documentId/history` returns a paginated view of the same data with total count and page metadata. `GET /:versionId` returns a single version record. `POST /document/:documentId/restore/:versionId` sets the document's `content` field back to the content of the target version and creates a new version record labelled "Restored from version N" to preserve the restoration event in the audit trail. `GET /compare/:versionId1/:versionId2` performs a line-by-line diff of two version contents and returns an array of diff objects with `type` values of `unchanged`, `removed`, or `added`.

### LLM Endpoints (`/api/llm`)

All LLM routes require authentication and accept an optional `x-gemini-api-key` header that substitutes the server's environment-level Gemini key with a user-supplied one. `GET /documents/:documentId/suggestions` runs a full-document analysis and returns a structured array of suggestions. `POST /documents/:documentId/apply-suggestions` accepts that suggestion array and persists the applied replacements. `GET /documents/:documentId/summary` returns a 2–3 sentence prose summary. `GET /documents/:documentId/quality` returns a quality score, issues list, and strengths list. `POST /documents/:documentId/chat` accepts a `message` and an optional `selectedText` and returns a conversational reply with an optional structured `suggestedChanges` payload for one-click application in the editor.

### Error Handling

The global `errorHandler` middleware normalises all error types into a consistent JSON response shape. `AppError` instances (thrown explicitly by controllers and services) are re-emitted with their `statusCode` and `message` directly. Zod validation errors produce a `400` with a `details` array mapping each invalid field path to its error message. Prisma's `P2025` error code (record not found) is mapped to `404 Resource not found`, and `P2002` (unique constraint violation) is mapped to `409 Resource already exists`. JWT's `TokenExpiredError` and `JsonWebTokenError` are both mapped to `401`. All other errors produce a `500` with a generic message, preventing internal stack traces from leaking to clients.

---

## Testing Plans

### Framework and Configuration

The test suite for the Polish backend is implemented using **Vitest**, a Vite-native test runner that is compatible with the Jest API. Tests are located in `server/tests/unit/` and are organised to mirror the `server/src/` directory structure. The Vitest configuration (`server/vitest.config.ts`) targets Node.js as the environment, sets a 10-second timeout per test, and configures the V8 coverage provider to instrument all files under `server/src/` except `server.ts` (the process entry point). A `setup.ts` file runs before every test file and populates all required environment variables — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `GOOGLE_AI_API_KEY`, and `CLIENT_URL` — so that modules can be imported without a real `.env` file present.

All tests are **unit tests with mocked infrastructure**. Prisma, Redis, the Google Generative AI SDK, bcrypt, and the S3 storage utilities are mocked using `vi.mock()` and `vi.hoisted()` so that no test depends on a live database, cache, external API, or filesystem. This makes the test suite fully runnable in CI without any infrastructure provisioning. Tests run via `npx vitest run` in the GitHub Actions pipeline as part of the `lint-and-typecheck` job.

### JWT Utility Tests (`tests/unit/utils/jwt.test.ts`)

These tests verify the `signAccessToken`, `signRefreshToken`, and `verifyToken` functions in isolation. The suite checks that signed tokens are three-segment JWT strings with the correct `userId` and `email` claims in the payload. The `verifyToken` tests cover the happy path (valid access and refresh tokens verify correctly), cross-type misuse (an access token rejected when verified as a refresh token and vice versa), tamper detection (a token with modified signature bytes throws `JsonWebTokenError`), and expiry (a token signed with `expiresIn: -1` throws `TokenExpiredError`).

### Auth Middleware Tests (`tests/unit/middleware/auth.test.ts`)

The `requireAuth` middleware is tested across five scenarios. Missing `Authorization` header, a non-Bearer scheme (e.g. `Basic`), a malformed JWT string, and an expired token each produce calls to `next()` with an appropriate error. The positive case — a valid access token for a user that the mocked Prisma `findUnique` returns — verifies that `req.user` is populated with `id`, `email`, `firstName`, and `lastName`, and that `next()` is called with no arguments.

### Error Handler Tests (`tests/unit/middleware/error.test.ts`)

The `AppError` class and the `errorHandler` Express middleware are tested independently. `AppError` is verified to be an `Error` subclass with the correct `statusCode` and `name` properties. The handler is tested against all six error categories: `AppError` instances, `ZodError` (which produces field-level `details`), Prisma `P2025`, Prisma `P2002`, `jwt.TokenExpiredError`, `jwt.JsonWebTokenError`, and generic `Error` instances falling through to `500`.

### User Service Tests (`tests/unit/services/user.service.test.ts`)

The `createUser` function is verified to hash the password with bcrypt at cost factor 12 and to call `prisma.user.create` with the hashed value rather than the plain text. It is also verified to throw a `409 AppError` without calling `create` when `findUnique` returns an existing record for the same email. `findUserByEmail` and `findUserById` are verified to pass the correct `where` clause to Prisma and to return `null` when the record does not exist. `updateUser` verifies that only the provided fields are forwarded to `prisma.user.update`. `changePassword` is tested for the success path (old password matches, new password is hashed and stored), the wrong-password path (throws `401`), and the OAuth account path (throws `400` because `hashedPw` is null). `verifyPassword` wraps `bcrypt.compare` and is verified to return `true` or `false` accurately.

### Session Service Tests (`tests/unit/services/session.service.test.ts`)

`createSession` is verified to return a signed access token and a signed refresh token both containing the correct `userId` claim, and to persist the session in the database with a 7-day expiry (the test measures the difference between `expiresAt` and `Date.now()` and allows a 1-second tolerance). `findSessionByRefreshToken` is verified to issue the correct `where` clause and return `null` when no session is found. `invalidateSession` and `invalidateAllSessions` are verified to call `prisma.session.updateMany` with `{ isActive: false }` scoped to the correct refresh token or user ID respectively.

### Document Service Tests (`tests/unit/services/document.service.test.ts`)

`getUserDocuments` verifies the `orderBy: { updatedAt: 'desc' }` clause. `getDocumentById` covers three cases: document found and owned (`200`), document not found (`404 AppError`), and document owned by a different user (`403 AppError`). `createDocument` verifies that an initial version is created whenever `content` is non-empty, that no version is created for empty content, and that file uploads call `uploadFile` with the buffer and MIME type before creating the database record. `updateDocument` verifies that updating `content` triggers `prisma.version.create` and that updating only `title` does not. `deleteDocument` verifies that `deleteFile` is called before `prisma.document.delete` when a `fileUrl` exists, and that the document is still deleted even when `deleteFile` throws (S3 error is swallowed).

### LLM Service Tests (`tests/unit/services/llm.service.test.ts`)

The `GoogleGenerativeAI` constructor and `generateContent` method are mocked via `vi.hoisted`. `generateSuggestions` is tested for: successful JSON parsing of a suggestion array, stripping of markdown code fences before parsing (since Gemini occasionally wraps output in triple-backtick blocks despite prompt instructions), and graceful return of an empty array when the response is not valid JSON. The custom API key path is verified by asserting that `GoogleGenerativeAI` is constructed with the user-supplied key string. `applySuggestions` is tested for the full-replacement path, the empty-suggestions no-op path, and the missing-original-text skip path. `summarizeDocument` verifies that the trimmed plain-text response is returned. `scoreDocumentQuality` tests the success path, the code-fence-stripping path, and the fallback `{ score: 5, issues: ['Could not analyze document'] }` path on parse failure. `chatWithDocument` verifies that prose-only responses come back without `suggestedChanges`, that `<changes>…</changes>` blocks are correctly parsed and stripped from the message text, that malformed JSON inside `<changes>` produces a `message`-only response, and that the `selectedText` parameter is included in the prompt string passed to `generateContent`. `logInteraction` verifies that `prisma.aiInteraction.create` is called with the correct fields, and that prompts longer than 2,000 characters and responses longer than 5,000 characters are truncated before storage.

### Version Service Tests (`tests/unit/services/version.service.test.ts`)

`createVersion` is tested to start at version number 1 when no prior version exists, to increment from the last version's number, and to store an optional `changeSummary`. `getVersionsByDocument` verifies the `orderBy: { versionNumber: 'desc' }` clause. `getPaginatedHistory` verifies that `skip` is calculated as `(page - 1) * limit`, that total count and page count metadata are returned, and that 0 total versions produces `pages: 0`. `getVersionById` covers the found and not-found cases. `restoreVersion` verifies that `prisma.document.update` sets `content` to the target version's content and that a new version record is created with a `changeSummary` matching "Restored from version N"; it also verifies that a `400 AppError` is thrown when the target version belongs to a different document. `compareVersions` is tested across four diff scenarios: identical content (all `unchanged`), one line changed (`removed` + `added`), version 2 longer (extra `added` line), and version 1 longer (extra `removed` line).

---

## Client (Frontend)

### Technology and Structure

The frontend is built with **Next.js 14** using the App Router and is written entirely in TypeScript. The project uses Tailwind CSS v4 for styling and shadcn/ui (Radix UI primitives) for accessible component primitives. The application compiles to Next.js's `standalone` output mode, which packages the server and its immediate `node_modules` dependencies into a self-contained directory that can be run with `node server.js` without a global Next.js installation.

The application has five primary routes: `/` (landing page), `/signin`, `/signup`, `/dashboard`, and `/editor`. The `/onboarding` route handles first-use setup. All route-level components are `"use client"` modules that manage their own data fetching, authentication checks, and local state. There is no server-side data fetching layer (no `getServerSideProps` or Server Components fetching data from the database); the frontend communicates with the Express backend exclusively via `fetch()` calls to `NEXT_PUBLIC_API_URL`.

### Token Management

Authentication state is persisted in `localStorage` using a `polish_` prefix namespace via the `user-storage.ts` utility (`getAccessToken`, `getRefreshToken`, `setTokens`, `clearUserData`). The `useTokenRefresh` hook (`hooks/use-token-refresh.ts`) runs as a side effect inside the `TokenRefreshProvider` wrapper component, which is mounted at the root layout. On mount, it decodes the JWT's `exp` claim from the stored access token using `atob`, calculates how many milliseconds remain before expiry, and schedules a `setTimeout` to fire 60 seconds before that point. When the timer fires, it calls `POST /api/auth/refresh` with the stored refresh token, updates `localStorage` with the new access token, and re-schedules itself. If the refresh call fails (network error or `4xx` response), `clearUserData()` is called, which wipes all `polish_*` keys from `localStorage` and effectively signs the user out. This approach means the access token is silently renewed throughout an active session without any visible interruption.

### Editor Page

The editor (`app/editor/page.tsx`) is the most complex page in the application. It manages the full document lifecycle: loading a document by ID from the URL query parameter, parsing the raw content string into a structured `DocumentContent` object, rendering it inside the `ResumeRenderer` component, and persisting changes back to the API. The editor maintains state for the current document content, selected text (for contextual AI suggestions), version history, the active template, and inline prompt visibility.

Content editing is handled by the `ResumeRenderer` component, which renders the document as an HTML string inside a `contentEditable` div. The component uses a `isFocused` ref to distinguish between user-driven edits (where the DOM should not be re-rendered) and external state changes such as AI suggestion application or document loads (where the DOM should be re-written). On `blur`, the `parseDom` function walks the div's DOM tree using `data-*` attribute selectors to reconstruct the `DocumentContent` object from what the user typed, and fires the `onUpdate` callback to sync state up to the editor page. This pattern avoids controlled-component cursor-position conflicts that would occur if React re-rendered the `contentEditable` on every keystroke.

Autosave is implemented via the `useAutosave` hook, which debounces the `onSave` callback by 3 seconds. The save function calls `PUT /api/docs/:id` with the serialised document content. Version snapshots are created at meaningful points — on initial load, when AI suggestions are applied, when the user manually saves, and when the page unmounts — by calling `POST /api/versions/document/:documentId`.

### AI Chat Sidebar

The `AIChat` component renders as a fixed-width panel to the right of the editor. It maintains a local `messages` array of `{ role, content, suggestedChanges }` objects. User messages are appended immediately; a three-dot typing animation is shown while the API request is in flight. When the response arrives, the assistant message is appended and the typing indicator is removed. If the response includes a `suggestedChanges` payload, it is rendered as an inline diff card with **Apply** and **Dismiss** buttons. The **Apply** button invokes a callback that propagates the change set up to the editor page, which iterates each `{ original, updated }` pair and applies them as string replacements to the parsed document content before triggering a version snapshot. An **Undo** button appears in the chat header after any application and calls back into the editor's undo mechanism.

The component exposes an imperative handle (`useImperativeHandle`) with a `sendMessage(prompt, text)` method, allowing the inline prompt pop-over (which appears on text selection in the editor) to fire a contextual message into the chat panel without the two components needing to be co-located in the React tree.

### Dashboard and Navigation

The dashboard (`app/dashboard/page.tsx`) fetches the user's document list from `GET /api/docs` on mount and renders each document as a clickable card. A profile dropdown (custom implementation using `useRef` and a `mousedown` click-outside handler) provides access to the user's email and a Sign Out button. Sign out calls `clearUserData()` and redirects to the landing page. Document deletion is performed inline with an optimistic UI update (the document is removed from local state immediately) after calling `DELETE /api/docs/:id`. Authentication is checked on mount; if no token is present in `localStorage`, the user is redirected to `/signin`.

### Export

The `ExportDialog` component (`components/export-dialog.tsx`) handles client-side document export in four formats. PDF export uses `jsPDF` with Helvetica (the PDF-spec equivalent of Arial). DOCX export uses the `docx` library to build a `Document` object programmatically. RTF export generates a raw RTF string with an Arial font table declaration (`\f0\fswiss\fcharset0 Arial`). LaTeX export generates a `.tex` source file using the `helvet` package with `\renewcommand{\familydefault}{\sfdefault}` to enforce an Arial-equivalent sans-serif font throughout. All four formats are generated entirely in the browser and downloaded via a programmatically created `<a>` element.

---

## Backend

### Architecture

The backend is an **Express.js** application written in TypeScript, compiled to JavaScript via `tsc` and run with `node dist/app.js`. It follows a three-layer architecture: routes define URL patterns and middleware chains; controllers handle HTTP concerns (parsing request bodies, extracting path parameters, and sending responses); services contain all business logic and interact with the database and external APIs. This separation ensures that controllers contain no business rules and services contain no HTTP-specific code.

The application entry point (`app.ts`) applies a consistent middleware stack before any routes are registered: Helmet sets secure HTTP response headers; CORS is configured to allow only the `CLIENT_URL` origin (with a wildcard fallback for development); `express.json()` with a 10 MB limit handles JSON bodies; `compression()` applies gzip to responses; Morgan logs HTTP requests in development; and a global rate limiter caps all routes at 200 requests per 15-minute window, with the auth routes having an additional tighter limiter of 20 requests per window.

### Database Layer (Prisma + PostgreSQL)

All database access goes through the Prisma ORM. The schema defines five models: `User` (id, email, hashedPw, firstName, lastName, oauthProvider), `Session` (id, userId, token, refreshToken, userAgent, ipAddress, isActive, expiresAt), `Document` (id, userId, title, content, documentType, fileName, fileUrl, fileSize, mimeType), `Version` (id, documentId, createdBy, versionNumber, content, changeSummary), and `AiInteraction` (id, userId, documentId, prompt, response, model, totalTokens, interactionType). The Prisma client is instantiated once as a module-level singleton in `config/db.ts` and imported wherever database access is needed. Schema migrations are managed via `prisma migrate dev` (development) and `prisma migrate deploy` (production).

### Redis

A Redis client is initialised in `config/redis.ts` using `ioredis` and connected to the `REDIS_URL` environment variable. The `/api/health` endpoint pings both Postgres and Redis and reports their status. Redis is available in the session and rate-limiting layers, though the primary use in the current implementation is as infrastructure for rate-limit state storage via `express-rate-limit`.

### File Storage

The `utils/storage.ts` module wraps the AWS SDK v3 `S3Client` and exposes `uploadFile(buffer, key, mimeType)` and `deleteFile(key)` functions. If the S3 environment variables (`S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) are absent, `s3Enabled` is `false` and both functions no-op, allowing local development to proceed without object storage. On upload, the file buffer is passed to `PutObjectCommand` and the key is stored in the `Document.fileUrl` column. On delete, the key is passed to `DeleteObjectCommand`; any error is caught and logged but does not prevent the document record from being deleted.

### Graceful Shutdown

The application listens for `SIGTERM` and `SIGINT` signals. On receipt of either, it calls `prisma.$disconnect()` to drain the connection pool and `redis.quit()` to close the Redis connection before calling `process.exit(0)`. This ensures that Railway's zero-downtime swap (which sends `SIGTERM` to the old instance) does not leave open database connections.

---

## Authentication (JWT)

### Token Architecture

Polish uses a **dual-token JWT authentication scheme**. An **access token** is a short-lived JWT (default 15 minutes, configurable via `JWT_EXPIRES_IN`) signed with `JWT_SECRET`. A **refresh token** is a long-lived JWT (default 7 days, configurable via `JWT_REFRESH_EXPIRES_IN`) signed with a separate secret `JWT_REFRESH_SECRET`. The two secrets are distinct so that a refresh token cannot be used in place of an access token and vice versa; the `verifyToken` function selects the correct secret based on its `type` argument, and passing the wrong type throws a `JsonWebTokenError`. Both tokens carry only `{ userId, email }` in their payload — no roles, permissions, or session identifiers are embedded, keeping the token size minimal.

### Session Persistence

Although the access token is stateless and self-validating, the refresh token is backed by a `Session` row in PostgreSQL. When `createSession` is called (at registration or login), it signs both tokens and writes a `Session` record that includes the refresh token, the user's `user-agent` and IP address, an `expiresAt` timestamp 7 days in the future, and an `isActive` boolean defaulting to `true`. This means that even if a refresh token is cryptographically valid, it will be rejected if the corresponding `Session.isActive` is `false` (i.e., the user has logged out). This gives the application server-side session revocation capability — a property that purely stateless JWTs do not provide.

### Token Issuance and Refresh Flow

On login or registration, the server calls `createSession(userId, email, userAgent, ip)`, which returns `{ accessToken, refreshToken }`. The frontend stores both in `localStorage`. When the access token is about to expire (60 seconds before the `exp` claim, as decoded by the `useTokenRefresh` hook), the frontend calls `POST /api/auth/refresh` with the refresh token in the request body. The server decodes the refresh token, looks up the session by `refreshToken` value, checks `isActive`, and if valid, signs and returns a new access token. The refresh token itself is not rotated; the same refresh token is reused until it either expires or is explicitly invalidated.

### Request Authentication

The `requireAuth` middleware reads the `Authorization` header, strips the `Bearer ` prefix, and calls `verifyToken(token, 'access')`. If the token signature is invalid, `jsonwebtoken` throws a `JsonWebTokenError`, which propagates to the global error handler and produces a `401 Invalid token`. If the token is expired, it throws `TokenExpiredError`, producing `401 Token expired`. If the signature is valid, the middleware calls `prisma.user.findUnique({ where: { id: payload.userId } })` to confirm the user still exists in the database. If not found, it throws an `AppError(401, 'User not found')`. On success, it attaches `{ id, email, firstName, lastName }` to `req.user` and calls `next()`. All subsequent controller and service code accesses user identity via `req.user.id` without any further token parsing.

### Logout and Revocation

`POST /api/logout` accepts an optional `refreshToken` to invalidate a single session and an optional `all: true` flag to invalidate every active session for the user. Both paths call `prisma.session.updateMany` with `{ isActive: false }`. After logout, any subsequent attempt to use the invalidated refresh token to obtain a new access token will fail at the `session.isActive` check, even if the refresh token JWT itself is not yet cryptographically expired. The access token that was already issued before logout remains valid until its own expiry (up to 15 minutes), since the server does not maintain an access token denylist. This is an accepted trade-off for stateless access tokens.

### Password Hashing

User passwords are hashed with **bcrypt** at cost factor 12 using the `bcryptjs` library. Plain-text passwords are never stored and are not logged anywhere in the request lifecycle. The `verifyPassword(plain, hash)` utility wraps `bcrypt.compare` and is the only code path that reads the `hashedPw` column. The `changePassword` function first calls `verifyPassword` with the old password before hashing and storing the new one; if the old password is wrong, it throws `AppError(401)` without updating the record.

### Frontend Token Storage

Tokens are stored in `localStorage` under the `polish_access_token` and `polish_refresh_token` keys, managed through the `user-storage.ts` module. This design choice means tokens are accessible to JavaScript on the page (unlike `httpOnly` cookies) but avoids CSRF vulnerabilities since the token is explicitly attached as a `Bearer` header rather than sent automatically by the browser. `clearUserData()` removes all `polish_*` keys atomically, and is called both on explicit sign-out and when the token refresh cycle detects a non-recoverable failure.

---

## Sprint 7 Reflection Report

**Project:** Polish — AI-Powered Resume Editor
**Sprint:** 7
**Contributor:** Arnav Verma
**Period:** April 2026

---

### Overview

Sprint 7 was the most complete and production-focused sprint of the project. The primary goal was to move Polish from a locally-running application to a fully deployed, publicly accessible product, while simultaneously closing out a backlog of editor bugs, standardising the export pipeline, and producing the full technical documentation suite. All deliverables were completed by the end of the sprint.

---

### What Was Accomplished

**Production Deployment on Railway**

The single largest milestone of the sprint was deploying the entire Polish stack to Railway. This involved configuring four separate Railway services — the Next.js frontend (Docker-based), the Express backend (nixpacks), a managed PostgreSQL 16 instance, and a managed Redis 7 instance — and wiring them together through Railway's private networking and environment variable injection. The Next.js standalone build was containerised using a multi-stage Dockerfile that produces a minimal production image. The backend TypeScript source was compiled to JavaScript and deployed via Railway's auto-detected build system. Database migrations were applied to the production PostgreSQL instance using `prisma migrate deploy`. The deployment is now live and accessible from any browser without any local setup.

**GitHub Actions CI/CD Pipeline**

A three-job GitHub Actions pipeline was built and connected to the repository. The pipeline runs on every push and pull request to `main` and `dev`. The first job performs TypeScript type checking across both the frontend and backend, including generating the Prisma client before compiling the backend. The second and third jobs run the Next.js production build and the backend TypeScript compilation respectively, both gated on the type-check job passing. This ensures that broken code cannot reach the main branch undetected.

**Export Pipeline and Font Standardisation**

The document export system was overhauled to enforce Arial as the standard font across all four export formats. The RTF export was updated with a proper font table declaration, the LaTeX export was updated with the `helvet` package, and the PDF export was fixed to handle long resumes that overflow a single page — previously, content beyond approximately 55 lines was silently clipped. All four formats (PDF, DOCX, RTF, LaTeX) were tested and confirmed to produce correctly formatted output.

**Editor Bug Fixes**

Several long-standing editor issues were resolved this sprint. The `contentEditable` resume editor was re-rendering `innerHTML` during active editing sessions, causing the cursor to jump to the start of the document on every state update. This was fixed using a `isFocused` ref that suppresses DOM re-writes while the user is typing. The sign-out dropdown, which only functioned correctly in the editor, was fixed across the landing page and dashboard by replacing the Radix UI `DropdownMenu` component with a custom ref-based implementation. The live demo animation on the landing page was fixed by eliminating a stale closure that caused the sequence to loop on the first step indefinitely. A security gap in the version restore endpoint — which did not verify that the target version belonged to the document being restored — was also patched.

**Technical Documentation**

A complete technical documentation suite was written this sprint, covering: CI/CD and deployment, LLM service architecture, API design, testing plans, the frontend client architecture, the backend architecture, and the JWT authentication system. Each section was written with enough detail to serve as a reference for both a new developer onboarding to the project and an evaluator assessing the system's design decisions.

---

### What Went Well

Deployment went more smoothly than expected. Railway's native support for nixpacks and Docker meant that the existing project structure required minimal changes to deploy — no new configuration files beyond the Dockerfile were needed. The GitHub Actions pipeline was straightforward to build because the type-check and build scripts were already well-defined in `package.json`.

The bug fix work was also productive. Having identified root causes clearly before writing code meant that each fix was small and surgical — none required architectural changes. The `isFocused` ref pattern for the editor, in particular, solved a problem that had been present since the early sprints.

---

### What Did Not Go Well

Two test cases failed during the sprint. File upload to object storage (TC-STO-001) failed due to a misconfigured `AWS_REGION` environment variable in the Railway backend service, meaning uploaded resumes were not persisted. This was an environment configuration issue rather than a code issue, and it was identified and corrected by the end of the sprint, though a formal re-test was not completed within the sprint window. The second failure (TC-LOG-003) exposed a UX gap: new documents are created with a hardcoded "Untitled Resume" title because the dashboard does not prompt the user for a name before submission. This is a minor but visible issue that will be addressed in the next sprint.

---

### Lessons Learned

The most significant technical lesson from this sprint was around the difference between stateless and stateful token validation. Early implementations assumed that verifying a JWT's cryptographic signature was sufficient for authentication. Building out the session persistence layer made it clear that signature validity alone does not support server-side logout or session revocation — the database-backed `isActive` check is what provides that guarantee, at the cost of one extra database read per request.

On the process side, writing documentation as the final sprint activity rather than incrementally made it harder to recall the precise reasoning behind some earlier decisions. Future sprints should aim to document architectural decisions closer to the time they are made.

---

### Looking Ahead

The two open items from this sprint — file upload storage and the document naming flow — are the immediate priorities for the next sprint. Beyond those, the focus will shift to polish (user-facing refinements), such as improving the onboarding experience for first-time users and adding a document search or filter capability to the dashboard as the number of documents per user grows.
