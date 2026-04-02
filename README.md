# Polish — AI-Powered Resume Editor

Polish is a full-stack web application that uses AI to help users write, edit, and improve their resumes. Upload an existing resume or start from scratch, get real-time AI suggestions powered by Gemini, track version history, and export when ready.

## Tech Stack

**Frontend**
- Next.js 14 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui

**Backend**
- Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis
- Gemini 2.5 Flash for AI suggestions, scoring, and summarization
- JWT authentication (access + refresh tokens)

**Infrastructure**
- Docker (both services)
- Railway (frontend + backend + PostgreSQL + Redis)
- GitHub Actions CI (type-check on every push)

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/UNTs-Best/polish.git
   cd polish
   ```

2. Start local infrastructure
   ```bash
   docker compose up -d
   ```

3. Copy and fill in environment variables
   ```bash
   cp .env.example .env
   ```

   Required values:
   ```
   DATABASE_URL=postgresql://polish:polish_secret@localhost:5432/polish_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=<random 64-char string>
   JWT_REFRESH_SECRET=<random 64-char string>
   GOOGLE_AI_API_KEY=<your Gemini API key>
   PORT=3001
   ```

4. Run database migrations
   ```bash
   cd server && npx prisma migrate dev
   ```

5. Start the backend
   ```bash
   cd server && npm run dev
   ```

6. Start the frontend (in a separate terminal)
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deployed on Railway with four services: frontend, backend, PostgreSQL, and Redis.

### Backend environment variables
```
DATABASE_URL        # from Railway Postgres plugin
REDIS_URL           # from Railway Redis plugin
JWT_SECRET
JWT_REFRESH_SECRET
GOOGLE_AI_API_KEY
NODE_ENV=production
CLIENT_URL          # frontend Railway URL
```

### Frontend environment variables
```
NEXT_PUBLIC_API_URL  # backend Railway URL
NODE_ENV=production
```

## Branch Strategy

- `feature/*` → `dev` (staging)
- `dev` → `main` (production)

## License

MIT
