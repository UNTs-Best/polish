# Requirements Document — Sections 10, 11, 13, 16, 17, 18, 20

---

## 10. API Design

The Polish backend exposes a RESTful HTTP API under the `/api/` base path. All authenticated endpoints require a valid JWT access token passed as `Authorization: Bearer <token>`.

### 10.1 API Structure

| Group | Base Path | Description |
|-------|-----------|-------------|
| Auth | `/api/auth` | Registration, login, token refresh, profile |
| OAuth | `/api/oauth` | Third-party provider flows (Google, GitHub, Apple) |
| Documents | `/api/docs` | Document CRUD and file upload |
| Versions | `/api/versions` | Version history, restore, and diff |
| LLM | `/api/llm` | AI suggestions, quality scoring, summarization |
| Health | `/api/health` | Health check and connectivity ping |

### 10.2 Auth Endpoints — `/api/auth`

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| POST | `/register` | — | Create local account (email + password; 8+ chars, 1 letter + 1 number) |
| POST | `/login` | — | Authenticate and receive access + refresh tokens |
| POST | `/refresh` | — | Exchange a valid refresh token for a new access token |
| GET | `/me` | ✓ | Return the authenticated user's profile |
| PUT | `/profile` | ✓ | Update first name, last name, or avatar URL |
| POST | `/change-password` | ✓ | Change password (disabled for OAuth-only accounts) |
| POST | `/logout` | ✓ | Invalidate current session or all sessions |

Rate limits: 5 requests / 15 min on `/register` and `/login`; 30 requests / 15 min on `/refresh`.

### 10.3 OAuth Endpoints — `/api/oauth`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers` | List all configured OAuth providers |
| GET | `/:provider/url` | Return the authorization URL for the given provider |
| GET | `/:provider/callback` | Handle provider callback (GET variant) |
| POST | `/:provider/callback` | Handle provider callback (POST variant) |
| GET | `/:provider` | Initiate the OAuth redirect flow |

Supported providers: `google`, `github`, `apple`. A `state` parameter is used for CSRF protection on every flow.

### 10.4 Document Endpoints — `/api/docs`

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| GET | `/` | ✓ | List all documents owned by the authenticated user |
| POST | `/` | ✓ | Create or upload a document (multipart form or JSON body) |
| PUT | `/:id` | ✓ | Update document title or content (auto-creates a new version) |
| DELETE | `/:id` | ✓ | Delete a document and all associated versions |

### 10.5 Version Endpoints — `/api/versions`

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| GET | `/document/:documentId` | ✓ | List all versions for a document |
| GET | `/document/:documentId/history` | ✓ | Paginated version history summary |
| GET | `/:versionId` | ✓ | Retrieve document content at a specific version |
| POST | `/document/:documentId/restore/:versionId` | ✓ | Restore to a past version (creates a new version) |
| GET | `/compare/:versionId1/:versionId2` | ✓ | Diff two versions |

### 10.6 LLM Endpoints — `/api/llm`

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| POST | `/documents/:documentId/suggestions` | ✓ | Generate structured AI improvement suggestions |
| POST | `/documents/:documentId/apply-suggestions` | ✓ | Apply selected suggestions and auto-version |
| GET | `/documents/:documentId/summary` | ✓ | Summarize document content |
| GET | `/documents/:documentId/quality` | ✓ | Return quality score (1–10), issues, and strengths |
| PUT | `/documents/:documentId/content` | ✓ | Update document content directly |

### 10.7 Response Format

All API responses use JSON. Successful responses include a `data` or resource key; errors return a structured object:

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

### 10.8 API Versioning

The current API is unversioned (no `/v1/` prefix). Versioning will be introduced before any breaking changes are released.

---

## 11. JWT Authentication Architecture

Polish uses a dual-token authentication scheme: a short-lived access token for request authorization and a long-lived refresh token to obtain new access tokens without re-authenticating.

### 11.1 Token Types

| Token | Expiry | Storage | Purpose |
|-------|--------|---------|---------|
| Access Token | 15 minutes | Client memory / Authorization header | Authenticate individual API requests |
| Refresh Token | 7 days | Database (`sessions` table) + client | Issue new access tokens without re-login |

Both tokens are signed JWTs using separate secrets (`JWT_SECRET` and `JWT_REFRESH_SECRET`).

### 11.2 Access Token Structure

```json
{
  "id": "<user UUID>",
  "email": "user@example.com",
  "provider": "local",
  "type": "access",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### 11.3 Token Issuance Flow

1. Client sends credentials to `POST /api/auth/login` (or completes an OAuth callback).
2. Backend validates credentials and calls `SessionService.loginUser()`.
3. `SessionService` generates a signed access token (15 min) and a signed refresh token (7 days).
4. A session record is written to the `sessions` table, storing the refresh token, user-agent, IP address, and expiry.
5. Both tokens are returned to the client.

### 11.4 Token Refresh Flow

1. Client detects an expired access token (HTTP 401 response).
2. Client calls `POST /api/auth/refresh` with the refresh token.
3. Backend looks up the refresh token in `sessions`, verifies it is active and not expired.
4. A new access token is issued and returned; the session record is updated.

### 11.5 Request Authentication

The `requireAuth` middleware:

1. Reads the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature and expiry using `JWT_SECRET`.
3. Attaches `req.auth = { id, email, provider, type }` for downstream handlers.
4. Reads the optional `x-session-id` header and updates session activity in the database.
5. Returns HTTP 401 if the token is missing, malformed, or expired.

### 11.6 Session Management

- Sessions are stored in the PostgreSQL `sessions` table with `user_agent` and `ip_address` for per-device tracking.
- A single-device logout deactivates the session identified by `x-session-id`.
- An all-devices logout deactivates every active session for the user.
- Sessions expire after 7 days; activity timestamp is refreshed on every authenticated request.

### 11.7 Password Security

- Passwords are hashed with `bcryptjs` at 12 rounds before storage.
- Plain-text passwords are never returned in any API response.
- OAuth users have a `null` `password_hash` and cannot use the change-password endpoint.

### 11.8 OAuth Integration

- Google (scopes: `openid email profile`), GitHub (scopes: `user:email read:user`), and Apple Sign-In are supported.
- On first OAuth login, an account is automatically created or linked to an existing email.
- A `state` parameter is validated on every callback to prevent CSRF attacks.
- After a successful OAuth callback, the same access + refresh token pair is issued as for local login.

---

## 13. CI/CD and Deployment

### Key Capabilities

**Automated Build Pipeline**
- Triggered automatically on every code commit
- Build time: < 5 minutes (frontend + backend)
- Artifact storage: Railway auto-deploys on push to main

**Multi-Environment Deployment**
- 2 Environments: Staging (dev branch → Railway), Production (main branch → Railway)
- Auto-deploy: Both environments deploy automatically on push
- CI: Type-check + build runs on every push and pull request

**Automated Testing**
- Unit tests: Not yet implemented
- Integration tests: PostgreSQL + API testing
- E2E tests: Not yet configured
- Security scans: Snyk and CodeQL (configured as of Sprint 6)

**Database Migration**
- Automated migrations: Run before deployment
- Rollback support: Transaction-based with down scripts
- Zero data loss: Validation checks before apply

**Deployment Safety**
- Health checks: Automated post-deployment verification
- Auto-rollback: < 5 minutes on failure
- Blue-green deployment: Planned (not yet implemented)
- Notifications: Planned (not yet configured)

---

### 13.3 Infrastructure as Code (IaC)

**Terraform Configuration**

Note: Terraform/IaC is not currently implemented. Infrastructure is managed via the Railway dashboard.

---

### 13.4 Monitoring and Observability

**Application Insights**

Note: Azure Application Insights is not used. Basic logging is handled via the Railway dashboard.

**Monitoring Alerts (Planned)**

Alerting and monitoring dashboards are planned for a future sprint.

---

### 13.5 Disaster Recovery

**Backup Strategy**
- Database backups: Every 6 hours, 30-day retention
- Point-in-time recovery: Restore to any point in the last 30 days
- Build artifacts: 30-day retention for quick rollback

**Recovery Targets**
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes
- Automated recovery: 6-step runbook (60 minutes total)

---

### 13.6 Performance Metrics

| Metric | Target | Current (Sprint 6) |
|--------|--------|-------------------|
| Pipeline Duration | < 15 min | 12 min ✓ |
| Deployment Frequency | 2–3/day (prod) | 1/day ⚠️ |
| Deployment Success Rate | ≥ 95% | 97% ✓ |
| Mean Time to Recovery (MTTR) | < 15 min | 10 min ✓ |
| Build Failure Rate | < 10% | 8% ✓ |

---

### 13.7 Security in Pipeline

**Automated Security Scans**

CodeQL and Snyk are configured in the GitHub Actions pipeline as of Sprint 6. Scans run on every push and pull request and will block merges on critical findings.

**Secret Management**
- Secrets are managed via Railway environment variables
- No secrets in code: API keys and credentials are never stored in the repository

---

### 13.8 Deployment Workflow

```
Developer commits code
    ↓
GitHub Actions triggered (< 30 seconds)
    ↓
Build & Test (12 minutes)
  • Install dependencies
  • Run linters
  • Type-check (tsc --noEmit)
  • Integration tests
  • Lint checks
  • Build artifacts
    ↓
Database Migration (2 minutes)
  • Connect to target PostgreSQL
  • Run migration scripts
  • Validate schema
    ↓
Deploy (5 minutes)
  • Backend → Railway (Docker container)
  • Frontend → Railway (Next.js service)
  • Railway health check
    ↓
Verification (3 minutes)
  • Health checks (GET /health)
  • Database connectivity
  • Gemini AI connectivity
  • Smoke tests
    ↓
Success ✓  → Railway deployment complete
Failure ✗  → Auto-rollback + Alert

Total Time: < 15 minutes (dev/staging), < 30 minutes (production)
```

---

### 13.9 Environment Configuration

| Environment | Branch | DB SKU | App Service | Instances | Auto-Deploy |
|-------------|--------|--------|-------------|-----------|-------------|
| Development | dev | S1 (20 DTU) | Railway Starter | 1 | ✓ Yes |
| QA | N/A (not used) | S1 (20 DTU) | N/A | 1 | No |
| Staging | dev | S2 (50 DTU) | Railway Starter | 2 | ✓ Yes |
| Production | main | S4 (200 DTU) | Railway Starter | 3–10 | ⚠️ Manual approval |

---

### 13.10 Sprint 6 Implementation Status

**Completed (Sprint 6)**
- GitHub Actions CI/CD pipeline (fully functional)
- Two-environment deployment (dev → staging, main → production on Railway)
- Automated database migrations
- Security scanning (Snyk, CodeQL)
- Health checks with auto-rollback
- Test coverage reporting (Codecov)

**Planned (Sprint 7)**
- Slack deployment notifications
- Blue-green deployment for production
- Complete Terraform IaC for all environments
- CDN setup with custom domain
- Performance testing in pipeline
- Canary releases (gradual rollout)
- Advanced monitoring dashboards

---

### 13.11 User Stories

| ID | User Story | Priority | Status |
|----|------------|----------|--------|
| US-CICD-001 | As a developer, I want automated builds so code is compiled without manual intervention | High | ✓ Complete |
| US-CICD-002 | As a QA engineer, I want tests to run automatically before deployment | High | ✓ Complete |
| US-CICD-003 | As a DevOps engineer, I want database migrations to run automatically | High | ✓ Complete |
| US-CICD-004 | As a product manager, I want zero-downtime deployments | High | Sprint 7 (Blue-green) |
| US-CICD-005 | As an operations engineer, I want automatic rollback on deployment failures | High | ✓ Complete |
| US-CICD-006 | As a team lead, I want deployment notifications in Slack | Medium | Planned — Sprint 7 |
| US-CICD-007 | As a security engineer, I want security scans to block vulnerable code | High | ✓ Complete |
| US-CICD-008 | As a developer, I want infrastructure defined as code for reproducibility | Medium | Sprint 7 (Terraform) |

---

## 16. Editor Backend Service

### 16.1 Document Load Pipeline

When the editor opens `/docs/{id}`, the backend performs:
- Permission check ensuring the user is owner or collaborator
- Fetch document metadata and content from PostgreSQL
- Load the latest committed version number
- Return the JSON document content to the client

This ensures the editor is initialized with the canonical state.

### 16.2 Autosave Patching (Last-Writer-Wins)

The endpoint `PATCH /docs/{id}` saves the full document content from the client. The backend handles:
- Validation: patch operations must target valid paths
- Conflict resolution: last-writer-wins
- Validation: ensuring document content is well-formed before saving
- Persistence: saving the updated content to PostgreSQL

These rules ensure document integrity on every save.

### 16.3 Autosave and Version Control

The editor autosaves every 3 seconds. The backend:
- Computes change count
- Increments version number in PostgreSQL
- Writes to the versions table in PostgreSQL
- Returns the updated version metadata to the client

This preserves a reliable timeline of edits and allows users to restore past versions.

### 16.4 Collaboration Features (Planned — Not Implemented)

Real-time collaboration features (cursor tracking, presence, multi-user editing) are planned for a future sprint and are not currently implemented.

### 16.5 Error Recovery and Consistency Guarantees

If a patch fails:
- The client receives a structured error
- The backend replays the last stable state from PostgreSQL
- The client re-syncs with the canonical document

This prevents desynchronization between editor clients.

---

## 17. LLM Service Architecture

The LLM Service is a backend subsystem that centralizes AI operations and connects directly with the editor for real-time machine assistance. It maps to the OpenAPI LLM endpoints.

### 17.1 Unified LLM Interface

The service offers a unified interface for:
- AI suggestions (`POST /api/llm/documents/:id/suggestions`)
- Document improvement (`POST /api/llm/documents/:id/improve`)
- Summaries (`POST /api/llm/documents/:id/summarize`)
- Template retrieval (`GET /api/llm/templates`)

All routes require JWT authentication.

### 17.2 AI Response Pipeline (Non-Streaming)

For AI endpoints, the service:
- Accepts prompt and metadata
- Calls Google Gemini 2.5 Flash via the `@google/generative-ai` SDK
- Returns a complete JSON response to the client

This provides AI-powered writing assistance with full responses.

### 17.3 Safety, Filtering, and Guardrails

Before interacting with the model:
- Inputs pass through content sanitization
- Oversized prompts are chunked or truncated
- Potentially unsafe outputs are filtered
- Token usage is tracked per request

This ensures predictable behavior under all usage conditions.

### 17.4 Cost and Rate Controls

The service enforces:
- 10 LLM calls per minute per user
- Maximum token budget per request
- Automatic rejection for runaway prompts
- Logging of model, tokens consumed, and latency

This guards against accidental or malicious resource consumption.

### 17.5 Document-Aware AI Assistance

When used within the editor, the LLM service may:
- Read the current document content
- Execute scope-aware edits
- Generate structured diffs
- Return them in a format compatible with the Editor backend

This allows the editor to highlight AI-suggested insertions or replacements.

### 17.6 Templates and Starter Generation

The service supports AI-generated resume, cover letter, and multi-section templates by:
- Loading curated prompt templates
- Generating structured outputs
- Caching results to reduce repeated inference

---

## 18. Sprint 6 Deliverables

| Task | Status | Owner |
|------|--------|-------|
| Build GitHub Actions Pipeline | Done | Arnav Verma |
| Setup Terraform Environment | Done | Arnav Verma |
| Import and Export Logic | Done | Mohamed Babiker |
| Enhanced document parsing and export for professional output | Done | Mohamed Babiker |
| Reflections Doc | Done | Mohamed Babiker |
| Debugging | Done | Mohamed Babiker |
| Finish Migration to Supabase | Done | Matthew Norman |
| Test Plan | Done | Matthew Norman |
| Test Tracker | Done | Matthew Norman |
| DOC: Req Doc Sprint 5 | Done | Matthew Norman |
| Auth security migration to backend | Done | Walid Esmail |
| Fix Profile Page | Done | Walid Esmail |

### Sprint 5 Test Results

| Test Case | Feature | Description | Result |
|-----------|---------|-------------|--------|
| TC-STO-001 | F2 | File upload to Supabase Storage | Fail |
| TC-STO-002 | F2 | File export and download | Pass |
| TC-LOG-003 | F3 | Add new resume with name | Fail |
| TC-LOG-001 | F1 | Automated error logging | Pass |
| TC-DATA-001 | NF3 | Data integrity after migration | Pass |
| TC-SEC-001 | NF1 | Session security / auth gating | Pass |

### Sprint 6 Roadmap

| Task | Assigned To | Notes / Definition of Done | Status |
|------|-------------|---------------------------|--------|
| Free AI Model Integration | Mohamed Babiker | Integrate free-tier LLM as default backend; server-side rate limiting; no API key required | Done |
| File Upload Fix (TC-STO-001) | Mohamed Babiker, Walid Esmail | Root cause analysis and fix of Supabase Storage upload bug | In Progress |
| Multi-Project Support | Mohamed Babiker, Matthew Norman | Extend DOCUMENT schema; build project dashboard UI | Done |
| Multi-Resume Management | Mohamed Babiker, Matthew Norman | Duplicate, rename, archive, delete resumes; status tagging | Partial (dashboard done; duplicate/rename/archive not done) |
| Import External Resume | Mohamed Babiker | PDF/DOCX parsing pipeline; store parsed content in Supabase Storage | Done |
| AI Tailoring Engine | Mohamed Babiker | New /llm/tailor endpoint; resume + job description prompt | Not Started |
| Cover Letter Generation | Mohamed Babiker | Cover letter endpoint; integrates with active resume | Not Started |
| Onboarding Flow | Walid Esmail | First-run UX walkthrough; resume creation + AI feature introduction | Done |
| Architecture Audit | Mohamed Babiker, Walid Esmail | Remove legacy CosmosDB artifacts; audit auth/session edge cases | In Progress |
| Test Plan + Tracker | Matthew Norman | Write and execute Sprint 6 test cases; maintain tracker | In Progress |
| Sprint 6 Reflection Doc | Mohamed Babiker | Finalize reflection report | In Progress |
| Req + Design Doc Updates | Mohamed Babiker, Matthew Norman, Walid Esmail | Keep docs current as Sprint 6 features are implemented | In Progress |

---

## 20. References

- OpenAPI Specification: `openapi.yaml` (repository root)
- GitHub Repository: https://github.com/unts-best/polish
- Railway Dashboard: https://railway.app (deployment and environment variables)
- Supabase Dashboard: https://supabase.com (database and storage)
