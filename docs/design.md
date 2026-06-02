# Polish — Software Design Document

**Project:** Polish — AI-Powered Resume Editor
**Contributor:** Arnav Verma
**Date:** April 2026

---

## Revision History

| Revision | Revision Date | Summary of Changes | Author(s) |
|---|---|---|---|
| 1 | 10/05/2025 | Added System & Architecture Design. Created overall architecture overview, UML diagram, and design summary showing how frontend, backend, and Azure services interact. | Walid Esmael |
| 2 | 10/06/2025 | Designed ER diagram, explained data flow, and ensured database structure consistency. | Mohamed Babiker |
| 3 | 10/07/2025 | Designed wireframes for login, dashboard, editor, and template library with short captions and explanations. | Matthew Norman, Walid Esmael |
| 4 | 10/07/2025 | Final Document & Formatting. Compiled and formatted the final design document, merged all diagrams, and wrote rationale and explanations for design choices. | Arnav Verma |
| 6 | 10/16/2025 | Updated the Front End Class Diagram. | Mohamed Babiker |
| 7 | 10/17/2025 | Updated the Class Diagrams. Updated ER Diagrams. Updated Information Architecture Diagram. | Arnav Verma |
| 8 | 10/31/2025 | Added Sections 6–10. Full OpenAPI 3.1.0 integration. Cosmos DB schema and change feed. Auth0 replacement. SignalR and SSE streaming. Sequence diagrams. Deployment topology. API versioning strategy. | Arnav Verma |
| 9 | 03/04/2026 | Sprint 5: Database migration, CI/CD achievements, architecture simplification. | Mohamed Babiker, Matthew Norman, Walid Esmael |
| 10 | 03/04/2026 | Sprint 6: Free AI model integration design, multi-project data model, resume import pipeline, AI tailoring engine. | Mohamed Babiker |
| 11 | 04/02/2026 | Architecture overhaul: removed Azure and Cosmos DB references throughout. Updated system architecture to reflect Express.js backend, PostgreSQL via Prisma ORM, and Redis. Replaced Auth0 with custom JWT authentication design. | Arnav Verma |
| 12 | 04/04/2026 | Rewrote Section 4 (ERD) to reflect final Prisma schema. Added inline field-level annotations (constraints, defaults, cascade rules) for all five tables: users, sessions, documents, versions, ai_interactions. | Arnav Verma |
| 13 | 04/07/2026 | Added Section 5 — Class Diagrams. Split into four sub-diagrams: Data Model Classes (all Prisma-derived types and TypeScript interfaces), Backend Service Layer, Backend Controller Layer, and Frontend Component Classes. | Arnav Verma |
| 14 | 04/09/2026 | Added Section 6 — Sequence Diagrams. Five diagrams covering: user registration and login, token refresh flow, document creation with file upload, AI chat interaction, and version restore flow. | Arnav Verma |
| 15 | 04/12/2026 | Added Section 7 — Activity Diagrams. Four diagrams covering: user authentication, document editing and autosave, AI suggestion application and undo, and document export across all four formats. | Arnav Verma |
| 16 | 04/14/2026 | Added Section 8 — State Diagram for the editor session lifecycle. Covers all states from Loading through Editing, Saving, ChatOpen, PendingChanges, Restoring, and Exporting. | Arnav Verma |
| 17 | 04/16/2026 | Added Section 9 — Deployment Architecture Diagram. Shows all four Railway services (frontend Docker container, backend nixpacks container, PostgreSQL, Redis), GitHub Actions CI trigger, S3 object storage, and Google Gemini API. | Arnav Verma |
| 18 | 04/18/2026 | Added Section 10 — Data Flow Diagram. End-to-end data movement from user input through the frontend, REST API, middleware, service layer, and out to PostgreSQL, Redis, S3, and Gemini. | Arnav Verma |
| 19 | 04/21/2026 | Updated Section 3 — Component Architecture Diagram. Refined subgraph layout to clearly separate Routes, Middleware, Controllers, and Services layers within the backend. Added explicit edges for Multer and rate limiter middleware. | Arnav Verma |
| 20 | 04/25/2026 | General document review and consistency pass. Updated section numbering after class diagram section was inserted. Removed all remaining references to Azure OpenAI, Cosmos DB, SignalR, and Auth0. Replaced with Gemini, PostgreSQL, and custom JWT throughout. | Arnav Verma |

---

## Table of Contents

1. Introduction
2. System Architecture Overview
3. Component Architecture Diagram
4. Database Entity-Relationship Diagram (ERD)
5. Class Diagrams
   - 5.1 Data Model Classes
   - 5.2 Backend Service Layer Classes
   - 5.3 Backend Controller Layer Classes
   - 5.4 Frontend Component Classes
6. Sequence Diagrams
   - 6.1 User Registration and Login
   - 6.2 Token Refresh Flow
   - 6.3 Document Creation with File Upload
   - 6.4 AI Chat Interaction
   - 6.5 Version Restore Flow
7. Activity Diagrams
   - 7.1 User Authentication Activity
   - 7.2 Document Editing and Autosave Activity
   - 7.3 AI Suggestion Application Activity
   - 7.4 Document Export Activity
8. State Diagram — Editor Session
9. Deployment Architecture Diagram
10. Data Flow Diagram

---

## 1. Introduction

This document describes the detailed software design of Polish, an AI-powered resume editing web application. Polish allows users to upload an existing resume, edit it inline, receive real-time AI suggestions powered by Google Gemini 2.5 Flash, track a full version history, and export the finished document in PDF, DOCX, RTF, or LaTeX format.

The system is composed of two independently deployed services — a Next.js 14 frontend and an Express.js backend API — backed by a PostgreSQL database and a Redis cache, all hosted on Railway. This document covers the architecture, data models, interaction flows, and component design of the complete system.

---

## 2. System Architecture Overview

Polish follows a **clean three-tier architecture**: a client tier (Next.js frontend), an application tier (Express.js REST API), and a data tier (PostgreSQL + Redis + S3-compatible object storage). The frontend and backend are deployed as separate Railway services and communicate exclusively over HTTPS. No server-side rendering of application data occurs — the frontend fetches all data from the backend API at runtime using the browser's `fetch` API.

The backend is organised into three layers:

- **Routes** — define URL patterns and apply middleware (authentication, rate limiting, file parsing)
- **Controllers** — handle HTTP concerns: parse request bodies, validate with Zod, call services, send responses
- **Services** — contain all business logic and interact with Prisma (database), the Google AI SDK (Gemini), and the AWS SDK (S3 storage)

This layering ensures controllers contain no business rules and services contain no HTTP-specific code, making both independently testable.

---

## 3. Component Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client — Browser"]
        LP[Landing Page\napp/page.tsx]
        DB[Dashboard\napp/dashboard/page.tsx]
        ED[Editor\napp/editor/page.tsx]
        RR[ResumeRenderer\ncomponents/resume-renderer.tsx]
        AC[AIChat\ncomponents/ai-chat.tsx]
        EX[ExportDialog\ncomponents/export-dialog.tsx]
        VH[VersionHistory\ncomponents/version-history.tsx]
        TRP[TokenRefreshProvider\ncomponents/token-refresh-provider.tsx]
        US[user-storage.ts\nLocalStorage abstraction]

        ED --> RR
        ED --> AC
        ED --> EX
        ED --> VH
        LP --> DB
        TRP --> US
    end

    subgraph Backend["Backend — Express.js API"]
        direction TB
        subgraph Routes
            AR[/api/auth]
            DR[/api/docs]
            VR[/api/versions]
            LR[/api/llm]
        end
        subgraph Middleware
            RA[requireAuth]
            RL[rateLimiter]
            EH[errorHandler]
            MU[multer]
        end
        subgraph Controllers
            AC2[auth.controller]
            DC[document.controller]
            VC[version.controller]
            LC[llm.controller]
        end
        subgraph Services
            AS[user.service]
            SS[session.service]
            DS[document.service]
            VS[version.service]
            LS[llm.service]
        end

        AR --> RA & RL
        DR --> RA & MU
        VR --> RA
        LR --> RA

        AR --> AC2
        DR --> DC
        VR --> VC
        LR --> LC

        AC2 --> AS & SS
        DC --> DS
        VC --> VS
        LC --> LS & DS
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL\nvia Prisma ORM)]
        RD[(Redis\nvia ioredis)]
        S3[(S3-compatible\nObject Storage)]
    end

    subgraph External["External APIs"]
        GM[Google Gemini\n2.5 Flash]
    end

    Client -- HTTPS REST --> Backend
    Services -- Prisma Client --> PG
    SS -- ioredis --> RD
    DS -- AWS SDK v3 --> S3
    LS -- @google/generative-ai --> GM
```

---

## 4. Database Entity-Relationship Diagram (ERD)

The database consists of five tables managed by Prisma ORM on PostgreSQL 16. All primary keys are UUIDs generated by PostgreSQL's `gen_random_uuid()` function. Cascade delete rules ensure that removing a user removes all their sessions, documents, versions, and AI interaction logs automatically.

```mermaid
erDiagram
    users {
        uuid id PK "gen_random_uuid()"
        string email UK "NOT NULL — unique login identifier"
        string hashed_pw "nullable — null for OAuth accounts"
        string first_name "NOT NULL"
        string last_name "DEFAULT empty string"
        string oauth_provider "nullable — e.g. google"
        timestamp created_at "DEFAULT now()"
        timestamp updated_at "auto-updated"
    }

    sessions {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "NOT NULL — CASCADE DELETE"
        string token UK "nullable — access token copy"
        string refresh_token UK "nullable — used for /refresh"
        string user_agent "nullable — browser fingerprint"
        string ip_address "nullable — request IP"
        boolean is_active "DEFAULT true"
        timestamp created_at "DEFAULT now()"
        timestamp expires_at "NOT NULL — 7 days from creation"
    }

    documents {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "NOT NULL — CASCADE DELETE"
        string title "NOT NULL"
        text content "DEFAULT empty string"
        string document_type "nullable — e.g. resume"
        string file_name "nullable — original upload filename"
        string file_url "nullable — S3 object key"
        int file_size "nullable — bytes"
        string mime_type "nullable — e.g. application/pdf"
        timestamp created_at "DEFAULT now()"
        timestamp updated_at "auto-updated"
    }

    versions {
        uuid id PK "gen_random_uuid()"
        uuid document_id FK "NOT NULL — CASCADE DELETE"
        uuid created_by FK "nullable — SET NULL on user delete"
        int version_number "NOT NULL — auto-incremented per document"
        text content "DEFAULT empty string — full snapshot"
        string change_summary "nullable — human-readable label"
        timestamp created_at "DEFAULT now()"
    }

    ai_interactions {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "NOT NULL — CASCADE DELETE"
        uuid document_id FK "nullable — SET NULL on document delete"
        text prompt "nullable — truncated to 2000 chars"
        text response "nullable — truncated to 5000 chars"
        string model "nullable — e.g. gemini-2.5-flash"
        int prompt_tokens "nullable"
        int completion_tokens "nullable"
        int total_tokens "nullable"
        decimal cost "nullable — 10 digits 6 decimal places"
        json meta "nullable — arbitrary metadata"
        string interaction_type "DEFAULT chat — chat/suggestion/quality/summary"
        timestamp created_at "DEFAULT now()"
        timestamp updated_at "auto-updated"
    }

    users ||--o{ sessions : "has (CASCADE DELETE)"
    users ||--o{ documents : "owns (CASCADE DELETE)"
    users ||--o{ versions : "authors (SET NULL)"
    users ||--o{ ai_interactions : "generates (CASCADE DELETE)"
    documents ||--o{ versions : "has (CASCADE DELETE)"
    documents ||--o{ ai_interactions : "referenced in (SET NULL)"
```

---

## 5. Class Diagrams

### 5.1 Data Model Classes

These classes represent the TypeScript types derived from the Prisma schema. They are the shape of objects flowing between the service and database layers throughout the application.

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String? hashedPw
        +String firstName
        +String lastName
        +String? oauthProvider
        +Date createdAt
        +Date updatedAt
        +Session[] sessions
        +Document[] documents
        +Version[] versions
        +AiInteraction[] aiInteractions
    }

    class Session {
        +String id
        +String userId
        +String? token
        +String? refreshToken
        +String? userAgent
        +String? ipAddress
        +Boolean isActive
        +Date createdAt
        +Date expiresAt
        +User user
    }

    class Document {
        +String id
        +String userId
        +String title
        +String content
        +String? documentType
        +String? fileName
        +String? fileUrl
        +Number? fileSize
        +String? mimeType
        +Date createdAt
        +Date updatedAt
        +User user
        +Version[] versions
        +AiInteraction[] aiInteractions
    }

    class Version {
        +String id
        +String documentId
        +String? createdBy
        +Number versionNumber
        +String content
        +String? changeSummary
        +Date createdAt
        +Document document
        +User? author
    }

    class AiInteraction {
        +String id
        +String userId
        +String? documentId
        +String? prompt
        +String? response
        +String? model
        +Number? promptTokens
        +Number? completionTokens
        +Number? totalTokens
        +Decimal? cost
        +Object? meta
        +String interactionType
        +Date createdAt
        +Date updatedAt
        +User user
        +Document? document
    }

    class TokenPayload {
        +String userId
        +String email
    }

    class Tokens {
        +String accessToken
        +String refreshToken
    }

    class Suggestion {
        +String type
        +String original
        +String suggestion
        +String explanation
    }

    class QualityScore {
        +Number score
        +String[] issues
        +String[] strengths
    }

    class ChatResponse {
        +String message
        +SuggestedChanges? suggestedChanges
    }

    class SuggestedChanges {
        +String type
        +String description
        +Change[] changes
    }

    class Change {
        +String section
        +String original
        +String updated
    }

    class DiffResult {
        +Version version1
        +Version version2
        +DiffLine[] diff
    }

    class DiffLine {
        +Number line
        +String type
        +String content
    }

    class PaginatedResult {
        +Version[] versions
        +Number total
        +Number page
        +Number limit
        +Number pages
    }

    User "1" --> "0..*" Session : has
    User "1" --> "0..*" Document : owns
    User "1" --> "0..*" Version : authors
    User "1" --> "0..*" AiInteraction : generates
    Document "1" --> "0..*" Version : contains
    Document "1" --> "0..*" AiInteraction : referenced in
    ChatResponse --> SuggestedChanges
    SuggestedChanges --> Change
    DiffResult --> Version
    DiffResult --> DiffLine
    PaginatedResult --> Version
```

---

### 5.2 Backend Service Layer Classes

The service layer contains all business logic. Each service module is a collection of exported functions (not a class in the OOP sense) but is represented here as a class for clarity. Services call Prisma, the Google AI SDK, the AWS SDK, and utility functions — never each other's HTTP handlers.

```mermaid
classDiagram
    class UserService {
        -PrismaClient prisma
        +createUser(email String, password String, firstName String, lastName String) User
        +findUserByEmail(email String) User|null
        +findUserById(id String) User|null
        +updateUser(id String, data Partial~User~) User
        +changePassword(id String, oldPassword String, newPassword String) void
        +verifyPassword(plain String, hash String) boolean
    }

    class SessionService {
        -PrismaClient prisma
        +createSession(userId String, email String, userAgent String?, ip String?) Tokens
        +findSessionByRefreshToken(token String) Session|null
        +invalidateSession(refreshToken String) void
        +invalidateAllSessions(userId String) void
    }

    class DocumentService {
        -PrismaClient prisma
        -VersionService versionService
        -StorageUtils storage
        +getUserDocuments(userId String) Document[]
        +getDocumentById(id String, userId String) Document
        +createDocument(userId String, data Object, file? File) Document
        +updateDocument(id String, userId String, data Object) Document
        +deleteDocument(id String, userId String) void
    }

    class VersionService {
        -PrismaClient prisma
        +createVersion(documentId String, content String, userId String, summary? String) Version
        +getVersionsByDocument(documentId String) Version[]
        +getPaginatedHistory(documentId String, page Number, limit Number) PaginatedResult
        +getVersionById(versionId String) Version
        +restoreVersion(documentId String, versionId String, userId String) Version
        +compareVersions(versionId1 String, versionId2 String) DiffResult
    }

    class LLMService {
        -String MODEL
        -GoogleGenerativeAI client
        -PrismaClient prisma
        -generate(prompt String, apiKey? String) Object
        +generateSuggestions(content String, documentType String, apiKey? String) Suggestion[]
        +applySuggestions(content String, suggestions Suggestion[]) String
        +summarizeDocument(content String, apiKey? String) String
        +scoreDocumentQuality(content String, documentType String, apiKey? String) QualityScore
        +chatWithDocument(message String, content String, selectedText? String, apiKey? String) ChatResponse
        +logInteraction(userId String, documentId String?, prompt String, response String, tokens Number, type String) void
    }

    class JWTUtils {
        -String JWT_SECRET
        -String JWT_REFRESH_SECRET
        -String JWT_EXPIRES_IN
        -String JWT_REFRESH_EXPIRES_IN
        +signAccessToken(payload TokenPayload) String
        +signRefreshToken(payload TokenPayload) String
        +verifyToken(token String, type String) TokenPayload
    }

    class StorageUtils {
        -S3Client s3Client
        -String S3_BUCKET
        +s3Enabled Boolean
        +uploadFile(buffer Buffer, key String, mimeType String) String
        +deleteFile(key String) void
    }

    class AppError {
        +Number statusCode
        +String message
        +String name
        +AppError(statusCode Number, message String)
    }

    class ErrorHandler {
        +errorHandler(err Error, req Request, res Response, next NextFunction) void
    }

    DocumentService --> VersionService : calls createVersion
    DocumentService --> StorageUtils : uploads / deletes files
    DocumentService ..> AppError : throws
    SessionService --> JWTUtils : signs tokens
    LLMService ..> AppError : propagates
    VersionService ..> AppError : throws 404 / 400
    UserService ..> AppError : throws 409 / 401
    ErrorHandler --> AppError : handles
```

---

### 5.3 Backend Controller Layer Classes

Controllers sit between the HTTP layer and the service layer. They parse and validate request inputs using Zod schemas, call the appropriate service functions, and return JSON responses. They contain no business logic.

```mermaid
classDiagram
    class AuthController {
        -ZodSchema registerSchema
        -ZodSchema loginSchema
        +register(req Request, res Response, next NextFunction) void
        +login(req Request, res Response, next NextFunction) void
        +refresh(req Request, res Response, next NextFunction) void
        +me(req AuthRequest, res Response, next NextFunction) void
        +updateProfile(req AuthRequest, res Response, next NextFunction) void
        +updatePassword(req AuthRequest, res Response, next NextFunction) void
        +logout(req AuthRequest, res Response, next NextFunction) void
    }

    class DocumentController {
        +list(req AuthRequest, res Response, next NextFunction) void
        +get(req AuthRequest, res Response, next NextFunction) void
        +create(req AuthRequest, res Response, next NextFunction) void
        +update(req AuthRequest, res Response, next NextFunction) void
        +remove(req AuthRequest, res Response, next NextFunction) void
    }

    class LLMController {
        -getUserApiKey(req AuthRequest) String|undefined
        +suggestions(req AuthRequest, res Response, next NextFunction) void
        +applyAll(req AuthRequest, res Response, next NextFunction) void
        +summary(req AuthRequest, res Response, next NextFunction) void
        +quality(req AuthRequest, res Response, next NextFunction) void
        +chat(req AuthRequest, res Response, next NextFunction) void
        +updateContent(req AuthRequest, res Response, next NextFunction) void
    }

    class VersionController {
        +list(req AuthRequest, res Response, next NextFunction) void
        +history(req AuthRequest, res Response, next NextFunction) void
        +getOne(req AuthRequest, res Response, next NextFunction) void
        +restore(req AuthRequest, res Response, next NextFunction) void
        +compare(req AuthRequest, res Response, next NextFunction) void
    }

    class RequireAuth {
        +requireAuth(req AuthRequest, res Response, next NextFunction) void
    }

    class AuthRequest {
        +user Object
        +user.id String
        +user.email String
        +user.firstName String
        +user.lastName String
    }

    AuthController --> UserService
    AuthController --> SessionService
    AuthController --> JWTUtils
    DocumentController --> DocumentService
    LLMController --> LLMService
    LLMController --> DocumentService
    VersionController --> VersionService
    RequireAuth --> JWTUtils
    RequireAuth --> PrismaClient
    AuthRequest <|-- Request
```

---

### 5.4 Frontend Component Classes

Frontend components are React functional components represented here as classes showing their props interface and key internal state. The arrows show which components render or depend on each other.

```mermaid
classDiagram
    class EditorPage {
        -String documentId
        -DocumentContent documentContent
        -String selectedText
        -String template
        -Boolean showVersionHistory
        -Boolean showInlinePrompt
        -String saveStatus
        -String[] undoStack
        +loadDocument() void
        +handleUpdate(content DocumentContent) void
        +handleMouseUp(e MouseEvent) void
        +handleSuggestionApply(changes SuggestedChanges) void
        +handleUndo() void
        +createVersionSnapshot(summary String) void
        +handleSave() void
    }

    class ResumeRenderer {
        +DocumentContent documentContent
        +String template
        +Function onMouseUp
        +Function isTextHighlighted
        +Function onUpdate
        -Ref containerRef
        -Ref isFocused
        +buildHtml() String
        +parseDom(el HTMLElement) DocumentContent
        +handleBlur() void
    }

    class AIChat {
        +String? selectedText
        +Function onSuggestionApply
        +Function onUndo
        +Function onClearSelection
        +DocumentContent? documentContent
        +String? documentId
        +String? geminiApiKey
        -Message[] messages
        -Boolean isLoading
        -Boolean showTypingDots
        -Set acceptedChanges
        -String currentSelection
        +handleSendMessage(text? String) void
        +handleScoreAction() void
        +handleSummaryAction() void
        +handleAcceptChanges(changes SuggestedChanges, idx Number) void
        +handleUndo() void
        +sendMessage(prompt String, text String) void
    }

    class ExportDialog {
        +Boolean open
        +Function onOpenChange
        +DocumentContent documentContent
        +String template
        +exportPDF() void
        +exportDOCX() void
        +exportRTF() void
        +exportLaTeX() void
    }

    class VersionHistory {
        +String documentId
        +Function onRestore
        -Version[] versions
        -Boolean loading
        +fetchVersions() void
        +handleRestore(versionId String) void
        +handleCompare(v1 String, v2 String) void
    }

    class Dashboard {
        -User user
        -Document[] documents
        -Boolean loading
        -Boolean creating
        -String? deletingId
        -Boolean showProfileMenu
        -Ref profileMenuRef
        +fetchDocuments(token String) void
        +handleNewDocument() void
        +handleDelete(id String, e MouseEvent) void
        +handleSignOut() void
        +formatDate(iso String) String
    }

    class TokenRefreshProvider {
        +ReactNode children
        -useTokenRefresh hook
    }

    class useTokenRefresh {
        -setTimeout timer
        +scheduleRefresh() void
        +refreshTokens() boolean
        +getTokenExpiry(token String) Number|null
    }

    class useAutosave {
        +Number delay
        +Function onSave
        +Boolean enabled
        -Ref timeoutRef
        -Ref isSavingRef
        +debouncedSave() void
        +triggerSave() void
    }

    class UserStorage {
        +getAccessToken() String|null
        +getRefreshToken() String|null
        +setTokens(access String, refresh String) void
        +clearUserData() void
        +getUser() User|null
        +getUserItem(key String) String|null
        +setUserItem(key String, value String) void
    }

    EditorPage --> ResumeRenderer : renders
    EditorPage --> AIChat : renders
    EditorPage --> ExportDialog : renders
    EditorPage --> VersionHistory : renders
    EditorPage --> useAutosave : uses
    AIChat --> UserStorage : getAccessToken
    Dashboard --> UserStorage : getAccessToken / clearUserData
    TokenRefreshProvider --> useTokenRefresh : invokes
    useTokenRefresh --> UserStorage : read/write tokens
```

---

## 6. Sequence Diagrams

### 6.1 User Registration and Login

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant API as Express API
    participant US as user.service
    participant SS as session.service
    participant DB as PostgreSQL

    User->>FE: Submit registration form
    FE->>API: POST /api/auth/register {email, password, firstName}
    API->>API: Zod schema validation
    API->>US: createUser(email, password, firstName)
    US->>DB: findUnique WHERE email
    DB-->>US: null (user not found)
    US->>US: bcrypt.hash(password, 12)
    US->>DB: user.create({email, hashedPw, firstName})
    DB-->>US: User record
    US-->>API: User object
    API->>SS: createSession(userId, email, userAgent, ip)
    SS->>SS: signAccessToken() — 15m expiry
    SS->>SS: signRefreshToken() — 7d expiry
    SS->>DB: session.create({userId, token, refreshToken, expiresAt})
    DB-->>SS: Session record
    SS-->>API: {accessToken, refreshToken}
    API-->>FE: 201 {user, accessToken, refreshToken}
    FE->>FE: localStorage.setItem(polish_access_token)
    FE->>FE: localStorage.setItem(polish_refresh_token)
    FE->>FE: redirect to /dashboard
```

### 6.2 Token Refresh Flow

```mermaid
sequenceDiagram
    participant Hook as useTokenRefresh Hook
    participant LS as localStorage
    participant API as Express API
    participant SS as session.service
    participant DB as PostgreSQL

    Hook->>LS: getAccessToken()
    LS-->>Hook: JWT string
    Hook->>Hook: decode exp from JWT payload (atob)
    Hook->>Hook: delay = exp - Date.now() - 60_000ms
    Hook->>Hook: setTimeout(delay)
    Note over Hook: 60 seconds before expiry...
    Hook->>LS: getRefreshToken()
    LS-->>Hook: refresh JWT string
    Hook->>API: POST /api/auth/refresh {refreshToken}
    API->>API: verifyToken(refreshToken, 'refresh')
    API->>SS: findSessionByRefreshToken(refreshToken)
    SS->>DB: session.findUnique WHERE refresh_token
    DB-->>SS: Session {isActive: true}
    SS-->>API: Session record
    API->>API: signAccessToken({userId, email})
    API-->>Hook: 200 {accessToken}
    Hook->>LS: setTokens(newAccessToken, refreshToken)
    Hook->>Hook: scheduleRefresh() — reschedule next cycle
```

### 6.3 Document Creation with File Upload

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant API as Express API
    participant MU as Multer Middleware
    participant DS as document.service
    participant S3 as S3 Storage
    participant VS as version.service
    participant DB as PostgreSQL

    User->>FE: Drop PDF file onto upload zone
    FE->>API: POST /api/docs (multipart/form-data, file + title)
    API->>MU: parse file (memoryStorage, 10MB limit)
    MU->>MU: validate MIME type (pdf/docx/txt only)
    MU-->>API: req.file buffer
    API->>DS: createDocument(userId, {title}, file)
    DS->>S3: uploadFile(buffer, documents/userId/timestamp-name.pdf, mimeType)
    S3-->>DS: storage key (fileUrl)
    DS->>DB: document.create({userId, title, content, fileUrl, fileName, fileSize, mimeType})
    DB-->>DS: Document record
    DS->>VS: createVersion(docId, content, userId, "Initial version")
    VS->>DB: version.findFirst ORDER BY versionNumber DESC
    DB-->>VS: null
    VS->>DB: version.create({documentId, versionNumber: 1, content})
    DB-->>VS: Version record
    DS-->>API: Document record
    API-->>FE: 201 {document}
    FE->>FE: router.push(/editor?id=docId)
```

### 6.4 AI Chat Interaction

```mermaid
sequenceDiagram
    actor User
    participant ED as Editor Page
    participant AC as AIChat Component
    participant API as Express API
    participant LC as llm.controller
    participant LS as llm.service
    participant DS as document.service
    participant GM as Gemini 2.5 Flash
    participant DB as PostgreSQL

    User->>ED: Highlights text in editor
    ED->>AC: selectedText prop update
    User->>AC: Types message, hits Enter
    AC->>API: POST /api/llm/documents/:id/chat\n{message, selectedText}\nAuthorization: Bearer <token>\nx-gemini-api-key: <optional>
    API->>LC: chat(req, res, next)
    LC->>LC: getUserApiKey(req) — check x-gemini-api-key header
    LC->>DS: getDocumentById(documentId, userId)
    DS->>DB: document.findUnique WHERE id
    DB-->>DS: Document {content}
    DS-->>LC: Document
    LC->>LS: chatWithDocument(message, content, selectedText, apiKey)
    LS->>LS: build prompt with context + <changes> schema instructions
    LS->>GM: generateContent(prompt)
    GM-->>LS: response text
    LS->>LS: extract <changes> block via regex
    LS->>LS: strip <changes> from message text
    LS-->>LC: {message, suggestedChanges}
    LC->>DB: aiInteraction.create({userId, documentId, prompt, response, model, tokens})
    LC-->>API: {message, suggestedChanges}
    API-->>AC: 200 {message, suggestedChanges}
    AC->>AC: append assistant message to messages[]
    AC->>AC: render diff card if suggestedChanges present
    User->>AC: Click Apply
    AC->>ED: onSuggestionApply(changes)
    ED->>ED: apply string replacements to documentContent
    ED->>ED: createVersionSnapshot("Applied AI suggestions")
    ED->>API: PUT /api/docs/:id {content}
```

### 6.5 Version Restore Flow

```mermaid
sequenceDiagram
    actor User
    participant VH as VersionHistory Component
    participant ED as Editor Page
    participant API as Express API
    participant VS as version.service
    participant DB as PostgreSQL

    User->>VH: Click "Restore" on version N
    VH->>API: POST /api/versions/document/:docId/restore/:versionId\nAuthorization: Bearer <token>
    API->>VS: restoreVersion(documentId, versionId, userId)
    VS->>DB: version.findUnique WHERE id = versionId
    DB-->>VS: Version {documentId, content, versionNumber}
    VS->>VS: check version.documentId === documentId
    Note over VS: Throws AppError(400) if mismatch
    VS->>DB: document.update WHERE id = documentId\nSET content = version.content
    DB-->>VS: Updated document
    VS->>DB: version.findFirst ORDER BY versionNumber DESC
    DB-->>VS: Latest version
    VS->>DB: version.create({versionNumber: N+1,\ncontent, changeSummary: "Restored from version N"})
    DB-->>VS: New version record
    VS-->>API: New version record
    API-->>VH: 200 {version}
    VH->>ED: trigger document reload
    ED->>API: GET /api/docs/:id
    API-->>ED: 200 {document} with restored content
    ED->>ED: re-render ResumeRenderer with restored content
```

---

## 7. Activity Diagrams

### 7.1 User Authentication Activity

```mermaid
flowchart TD
    A([User visits page]) --> B{Token in\nlocalStorage?}
    B -- No --> C[Redirect to /signin]
    B -- Yes --> D[Decode JWT exp claim]
    D --> E{Token\nexpired?}
    E -- Yes --> F[POST /api/auth/refresh]
    F --> G{Refresh\nsucceeded?}
    G -- No --> H[clearUserData]
    H --> C
    G -- Yes --> I[Store new accessToken]
    I --> J[Schedule next refresh]
    E -- No --> J
    J --> K[Schedule setTimeout\n60s before expiry]
    K --> L([Access granted — render page])

    C --> M[User submits credentials]
    M --> N[POST /api/auth/login]
    N --> O{Valid\ncredentials?}
    O -- No --> P[Show error message]
    P --> M
    O -- Yes --> Q[Store accessToken + refreshToken]
    Q --> R[Redirect to /dashboard]
```

### 7.2 Document Editing and Autosave Activity

```mermaid
flowchart TD
    A([Open editor with document ID]) --> B[GET /api/docs/:id]
    B --> C[Parse content string\nto DocumentContent object]
    C --> D[Inject HTML into\ncontentEditable div]
    D --> E([User edits text])
    E --> F[isFocused ref = true\nDOM not overwritten]
    F --> G[useAutosave debouncedSave\ntriggered — 3s delay]
    G --> H{3 seconds\nelapsed without\nnew keystrokes?}
    H -- No --> G
    H -- Yes --> I[onBlur fires]
    I --> J[parseDom walks contentEditable\nDOM tree via data-* selectors]
    J --> K[Reconstruct DocumentContent\nfrom DOM]
    K --> L[isFocused ref = false]
    L --> M[PUT /api/docs/:id with\nserialized content]
    M --> N[Backend createVersion\nif content changed]
    N --> O[Update document state]
    O --> D
```

### 7.3 AI Suggestion Application Activity

```mermaid
flowchart TD
    A([User sends chat message]) --> B[POST /api/llm/documents/:id/chat]
    B --> C[Gemini generates response]
    C --> D{Contains\n<changes> block?}
    D -- No --> E[Render plain\nassistant message]
    D -- Yes --> F[Parse JSON inside\n<changes> tags]
    F --> G{JSON\nvalid?}
    G -- No --> E
    G -- Yes --> H[Strip <changes> from message text]
    H --> I[Render message +\ninline diff card]
    I --> J([User reviews changes])
    J --> K{User clicks\nApply or Dismiss?}
    K -- Dismiss --> L[Remove diff card]
    K -- Apply --> M[Iterate changes array]
    M --> N[String replace original\nwith updated in documentContent]
    N --> O{More\nchanges?}
    O -- Yes --> M
    O -- No --> P[PUT /api/docs/:id\nwith updated content]
    P --> Q[createVersionSnapshot\nApplied AI suggestions]
    Q --> R[Show Undo button\nin chat header]
    R --> S([User clicks Undo])
    S --> T[Restore previous\ndocumentContent from state]
    T --> U[PUT /api/docs/:id\nwith previous content]
```

### 7.4 Document Export Activity

```mermaid
flowchart TD
    A([User opens Export Dialog]) --> B[Select export format]
    B --> C{Format?}

    C -- PDF --> D[jsPDF — new jsPDF document]
    D --> E[setFont helvetica]
    E --> F[Iterate document sections\ntrack y position]
    F --> G{y exceeds\npage height?}
    G -- Yes --> H[addPage — reset y]
    H --> F
    G -- No --> I[text at current y]
    I --> J[doc.save resume.pdf]

    C -- DOCX --> K[Build docx Document\nwith Paragraph objects]
    K --> L[Packer.toBlob]
    L --> M[saveAs resume.docx]

    C -- RTF --> N[Build RTF string\nwith Arial font table]
    N --> O[Blob type text/rtf]
    O --> P[Download resume.rtf]

    C -- LaTeX --> Q[Build .tex source\nwith helvet package]
    Q --> R[Blob type text/plain]
    R --> S[Download resume.tex]

    J & M & P & S --> T([File downloaded to browser])
```

---

## 8. State Diagram — Editor Session

```mermaid
stateDiagram-v2
    [*] --> Loading : Navigate to /editor?id=

    Loading --> Unauthenticated : No token in localStorage
    Unauthenticated --> [*] : Redirect to /signin

    Loading --> DocumentLoaded : GET /api/docs/:id success
    Loading --> Error : 404 / 403 / network failure
    Error --> [*] : Redirect to /dashboard

    DocumentLoaded --> Editing : User clicks into editor
    DocumentLoaded --> ViewingHistory : User opens version panel
    DocumentLoaded --> Exporting : User opens export dialog
    DocumentLoaded --> ChatOpen : User types in AI chat

    Editing --> Dirty : Any keystroke
    Dirty --> Saving : Autosave timer fires (3s)
    Saving --> DocumentLoaded : PUT /api/docs/:id success
    Saving --> Dirty : Save failed — retry

    ChatOpen --> AwaitingAI : User submits message
    AwaitingAI --> ChatOpen : Response received, no changes
    AwaitingAI --> PendingChanges : Response with suggestedChanges
    PendingChanges --> Dirty : User applies changes
    PendingChanges --> ChatOpen : User dismisses changes

    ViewingHistory --> DocumentLoaded : User closes panel
    ViewingHistory --> Restoring : User clicks Restore
    Restoring --> DocumentLoaded : POST restore success

    Exporting --> DocumentLoaded : Export complete / dialog closed
```

---

## 9. Deployment Architecture Diagram

```mermaid
graph TB
    subgraph Internet
        BR[Browser\nUser's Device]
    end

    subgraph Railway["Railway — Production Project"]
        subgraph FE_SVC["Frontend Service"]
            FE_CTR[Docker Container\nNode.js 20 Alpine]
            FE_APP[Next.js Standalone\nnode server.js :3000]
            FE_CTR --> FE_APP
        end

        subgraph BE_SVC["Backend Service"]
            BE_CTR[nixpacks Container\nNode.js 20]
            BE_APP[Express.js API\nnode dist/app.js :3001]
            BE_CTR --> BE_APP
        end

        subgraph DB_SVC["PostgreSQL Service"]
            PG[(PostgreSQL 16\nRailway Managed)]
        end

        subgraph RD_SVC["Redis Service"]
            RD[(Redis 7\nRailway Managed)]
        end
    end

    subgraph S3["Object Storage"]
        S3B[(S3-compatible Bucket\nAWS S3 / Cloudflare R2)]
    end

    subgraph GH["GitHub"]
        REPO[Repository\nmain branch]
        CI[GitHub Actions\nCI Pipeline]
        REPO --> CI
        CI -- push triggers --> FE_SVC
        CI -- push triggers --> BE_SVC
    end

    subgraph GAPI["Google AI"]
        GEM[Gemini 2.5 Flash API]
    end

    BR -- HTTPS :443 --> FE_APP
    FE_APP -- HTTPS REST --> BE_APP
    BE_APP -- Prisma ORM\nTCP 5432 --> PG
    BE_APP -- ioredis\nTCP 6379 --> RD
    BE_APP -- AWS SDK v3\nHTTPS --> S3B
    BE_APP -- @google/generative-ai\nHTTPS --> GEM
```

---

## 10. Data Flow Diagram

```mermaid
flowchart LR
    U([User])

    subgraph Frontend
        UI[Next.js UI\nPages + Components]
        LS[localStorage\nTokens + User]
        EX[Export Engine\njsPDF / docx / RTF / LaTeX]
    end

    subgraph Backend
        MW[Middleware\nHelmet · CORS · RateLimit · Auth]
        RT[Routers\nauth · docs · versions · llm]
        CT[Controllers\nZod validation]
        SV[Services\nBusiness logic]
    end

    subgraph Storage
        PG[(PostgreSQL\nUsers · Documents\nVersions · Sessions\nAI Interactions)]
        RD[(Redis\nRate limit state)]
        S3[(S3 Object Storage\nUploaded files)]
    end

    subgraph External
        GM[Google Gemini\n2.5 Flash]
    end

    U -- Inputs / Actions --> UI
    UI -- Read/Write tokens --> LS
    UI -- REST API calls\nBearer token --> MW
    MW -- Validated request --> RT
    RT --> CT
    CT -- Function calls --> SV
    SV -- Prisma queries --> PG
    SV -- Rate limit state --> RD
    SV -- File buffer upload/delete --> S3
    SV -- Prompt + document content --> GM
    GM -- Response text + structured changes --> SV
    SV -- Query results --> CT
    CT -- JSON response --> UI
    UI -- Rendered HTML --> U
    UI -- Export trigger --> EX
    EX -- Generated file download --> U
```
