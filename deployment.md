# Polish — Deployment Guide (Cloudflare)

> **Do not deploy yet.** This is a setup and reference guide to follow once the TypeScript rewrite (plan.md) is complete. Read this first so infrastructure decisions don't conflict with the code you're writing.

---

## Architecture overview

```
Users
  │
  ▼
Cloudflare DNS + CDN + DDoS protection
  │
  ├── polish.com ──────────────► Cloudflare Pages (Next.js frontend)
  │                                     │
  │                                     │ NEXT_PUBLIC_API_URL
  │                                     ▼
  └── api.polish.com ──────────► Cloudflare Tunnel ──► VPS (Fastify API)
                                                          │
                                         ┌────────────────┼────────────────┐
                                         ▼                ▼                ▼
                                   Neon (Postgres)   Upstash (Redis)  Cloudflare R2
                                   managed, serverless  managed, serverless  (file storage)
```

**Why this shape:**
- Fastify/Express cannot run natively on Cloudflare Workers (V8 isolate, no Node.js APIs). Rather than rewrite the backend again, run it on a cheap VPS and route it through Cloudflare Tunnel — you still get DDoS protection, SSL, and Cloudflare's network without touching your API code.
- Cloudflare Pages handles Next.js natively — no Docker, no server to manage.
- Cloudflare R2 is S3-compatible (same `@aws-sdk/client-s3` SDK, just change the endpoint). Zero egress fees.
- Neon and Upstash are both serverless/managed — no Postgres or Redis servers to maintain.

---

## Accounts to create (all have free tiers)

| Service | What for | URL |
|---------|----------|-----|
| Cloudflare | Pages, Tunnel, R2, DNS | cloudflare.com |
| Neon | PostgreSQL | neon.tech |
| Upstash | Redis | upstash.com |
| Hetzner or DigitalOcean | VPS for Fastify API | hetzner.com / digitalocean.com |
| GitHub | Source + CI/CD | github.com |

---

## Step 1 — Add your domain to Cloudflare

1. Log into Cloudflare → **Add a site** → enter your domain
2. Choose the **Free plan**
3. Cloudflare scans existing DNS records — review and confirm
4. Update your domain registrar's nameservers to the two Cloudflare nameservers it gives you
5. Wait for propagation (usually under 30 minutes)

You now have Cloudflare managing DNS for your domain. Every record you add will be proxied through Cloudflare's network.

---

## Step 2 — Cloudflare R2 (file storage)

R2 is S3-compatible. Your `storage.ts` utility from plan.md works with R2 by just changing the endpoint — no code changes beyond the env vars.

### Create the bucket

1. Cloudflare dashboard → **R2** → **Create bucket**
2. Name: `polish-documents` (or whatever you want)
3. Location: auto (Cloudflare picks the closest region)

### Create an API token for R2

1. Cloudflare dashboard → **R2** → **Manage R2 API tokens** → **Create API token**
2. Permissions: **Object Read & Write**
3. Scope: the `polish-documents` bucket only
4. Copy the **Access Key ID** and **Secret Access Key** — you will not see them again

### Get your R2 endpoint

Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Find your Account ID in the Cloudflare dashboard URL or right sidebar.

### Public access for files (optional)

If document files should be publicly readable (e.g. resume PDFs):
1. R2 bucket → **Settings** → **Public access** → **Allow access**
2. You get a public URL: `https://pub-<hash>.r2.dev/<key>`
3. Or connect a custom domain: `files.polish.com`

### Env vars this produces

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<from token>
S3_SECRET_ACCESS_KEY=<from token>
S3_BUCKET=polish-documents
S3_PUBLIC_URL=https://pub-<hash>.r2.dev   # or your custom domain
```

Your `storage.ts` must set `forcePathStyle: false` for R2 (unlike MinIO which needs `true`). R2 uses virtual-hosted-style URLs.

---

## Step 3 — Neon PostgreSQL

### Create a project

1. Sign up at neon.tech → **Create project**
2. Name: `polish`
3. Region: pick the one closest to your VPS (e.g. `eu-central-1` for Hetzner Frankfurt)
4. PostgreSQL version: 16

### Get the connection string

Neon dashboard → your project → **Connection Details**

Copy the **pooled connection string** (uses PgBouncer, better for serverless/short-lived connections):
```
postgres://polish:<password>@<host>.neon.tech/<dbname>?sslmode=require
```

### Run the schema

From your local machine with `psql` installed:
```bash
psql $DATABASE_URL -f path/to/schema.sql
```

Or paste the `CREATE TABLE` statements from `features.md` directly into the Neon SQL editor in the dashboard.

### Neon-specific notes

- Neon scales to zero when idle — first query after idle takes ~1 second to wake up. This is fine for an API that has real traffic; for a demo/staging environment it is noticeable.
- Use the **pooled** connection string (`-pooler` in the hostname) for the API server. This goes through PgBouncer and handles connection limits.
- Use the **direct** connection string (no `-pooler`) only for running migrations.

### Env var

```
DATABASE_URL=postgres://polish:<password>@<host>-pooler.neon.tech/<dbname>?sslmode=require
```

---

## Step 4 — Upstash Redis

### Create a database

1. Sign up at upstash.com → **Create database**
2. Name: `polish-redis`
3. Region: same as your VPS
4. Type: **Regional** (not global — cheaper, lower latency for a single-region app)

### Get the connection string

Upstash dashboard → your database → **Details**

Copy the `REDIS_URL` (format: `rediss://default:<password>@<host>.upstash.io:<port>`).

Note the `rediss://` prefix — this is TLS, which Upstash requires. Make sure your `ioredis` client config accepts TLS:

```typescript
// config/redis.ts
import { Redis } from "ioredis"
const redis = new Redis(process.env.REDIS_URL, { tls: {} })
```

### Env var

```
REDIS_URL=rediss://default:<password>@<host>.upstash.io:<port>
```

---

## Step 5 — VPS setup (Fastify API)

Use the smallest VPS tier — 1 vCPU / 2GB RAM is more than enough for the API.

- **Hetzner CX22**: €3.79/month (Frankfurt or Helsinki)
- **DigitalOcean Basic**: $6/month (any region)

### Initial server setup

SSH in as root, then:

```bash
# Create a non-root user
adduser polish
usermod -aG sudo polish

# Switch to new user
su - polish

# Install Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Install PM2 (process manager — keeps the API alive, restarts on crash)
npm install -g pm2

# Install cloudflared (Cloudflare Tunnel — see Step 6)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### Deploy the API

```bash
# Clone the repo
git clone https://github.com/<you>/polish.git /home/polish/app
cd /home/polish/app/apps/api

# Install dependencies
npm install --production

# Create .env file
nano .env
# paste all env vars (DATABASE_URL, REDIS_URL, S3_*, JWT_*, etc.)

# Run database migrations
npm run db:migrate

# Start with PM2
pm2 start dist/app.js --name polish-api
pm2 save                      # persist across reboots
pm2 startup                   # generate systemd startup command, run the printed command
```

### PM2 ecosystem file

Create `apps/api/ecosystem.config.cjs` in the repo:

```javascript
module.exports = {
  apps: [
    {
      name: "polish-api",
      script: "dist/app.js",
      instances: 1,
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
}
```

Deploy with: `pm2 start ecosystem.config.cjs --env production`

### Do NOT open port 5000 publicly

The API should only be reachable through the Cloudflare Tunnel (Step 6). Do not add a firewall rule opening port 5000. Only port 22 (SSH) needs to be open on the VPS firewall.

---

## Step 6 — Cloudflare Tunnel

Cloudflare Tunnel creates an outbound-only connection from your VPS to Cloudflare's network. No inbound ports needed, no public IP exposed.

### Create the tunnel

On the VPS:

```bash
# Authenticate cloudflared with your Cloudflare account
cloudflared tunnel login
# Opens a browser URL — visit it on your local machine and authorize

# Create the tunnel
cloudflared tunnel create polish-api
# This creates a tunnel and saves credentials to ~/.cloudflared/<tunnel-id>.json
```

### Configure the tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/polish/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.polish.com
    service: http://localhost:5000
  - service: http_status:404
```

Replace `<tunnel-id>` with the UUID from the create step.

### Add the DNS record

```bash
cloudflared tunnel route dns polish-api api.polish.com
```

This adds a CNAME record in Cloudflare DNS pointing `api.polish.com` to the tunnel. The record is automatically proxied (orange cloud).

### Run tunnel as a service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

The tunnel now starts automatically on reboot. Test it:

```bash
curl https://api.polish.com/api/health
# should return { "db": "ok", "redis": "ok", "storage": "ok" }
```

---

## Step 7 — Cloudflare Pages (Next.js frontend)

### Connect the repo

1. Cloudflare dashboard → **Pages** → **Create a project** → **Connect to Git**
2. Select your GitHub repo
3. Framework preset: **Next.js**
4. Build command: `cd apps/web && npm run build` (adjust for your monorepo structure)
5. Build output directory: `apps/web/.next`

### Environment variables in Pages

Pages → your project → **Settings** → **Environment variables** → **Add variable**

```
NEXT_PUBLIC_API_URL=https://api.polish.com
NODE_VERSION=22
```

Add these for both **Production** and **Preview** environments (use different values for preview if you have a staging API).

### Custom domain

Pages → your project → **Custom domains** → **Set up a custom domain**

Enter `polish.com` (or `www.polish.com`). Cloudflare automatically creates the DNS record and handles SSL.

### Next.js + Cloudflare Pages notes

Next.js 14 on Cloudflare Pages requires the Edge runtime for some features. Check two things:

**1. `next.config.mjs` output mode**

For Cloudflare Pages, do NOT use `output: 'standalone'`. Remove the `DOCKER_BUILD` conditional entirely:

```javascript
const nextConfig = {
  // no output: 'standalone' here
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}
```

**2. Install `@cloudflare/next-on-pages` if needed**

If your Next.js app uses any route handlers that need Node.js APIs (e.g. `fs`, `crypto`), you may need:

```bash
npm install -D @cloudflare/next-on-pages
```

And update `next.config.mjs`:
```javascript
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev"
if (process.env.NODE_ENV === "development") await setupDevPlatform()
```

For the current app, the only server-side routes are API proxies and the Claude chat route — these use `fetch` which works fine on the edge runtime.

---

## Step 8 — SSL

You get SSL automatically:

- **Pages**: Cloudflare manages the certificate for your custom domain
- **API via Tunnel**: traffic between users and Cloudflare is TLS; traffic between Cloudflare and your VPS inside the tunnel is also encrypted

You do not need to install certificates on the VPS.

Set Cloudflare SSL mode:
Cloudflare dashboard → your domain → **SSL/TLS** → set to **Full (strict)**

---

## Step 9 — CI/CD with GitHub Actions

Update `.github/ci/ci.yaml` to actually do something:

```yaml
name: CI / Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: polish_test
          POSTGRES_USER: polish
          POSTGRES_PASSWORD: polish
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies (API)
        run: cd apps/api && npm ci

      - name: Run migrations
        run: cd apps/api && npm run db:migrate
        env:
          DATABASE_URL: postgres://polish:polish@localhost:5432/polish_test

      - name: Run tests
        run: cd apps/api && npm test
        env:
          DATABASE_URL: postgres://polish:polish@localhost:5432/polish_test
          JWT_SECRET: test-secret-at-least-32-chars-long
          JWT_REFRESH_SECRET: test-refresh-secret-32-chars-long

      - name: Build frontend
        run: cd apps/web && npm ci && npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.polish.com

  deploy-api:
    name: Deploy API
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Build API
        run: cd apps/api && npm ci && npm run build

      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: polish
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/polish/app
            git pull origin main
            cd apps/api
            npm ci --production
            npm run build
            npm run db:migrate
            pm2 reload polish-api
```

### GitHub secrets to add

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_SSH_KEY` | Private SSH key for the `polish` user on the VPS |

Cloudflare Pages deploys automatically on push to `main` — no GitHub Action needed for the frontend once it's connected.

---

## Environment variable reference

### `apps/api/.env` (VPS)

```bash
NODE_ENV=production
PORT=5000

# PostgreSQL (Neon pooled connection string)
DATABASE_URL=postgres://polish:<pw>@<host>-pooler.neon.tech/<db>?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:<pw>@<host>.upstash.io:<port>

# Cloudflare R2 (S3-compatible)
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<r2_key_id>
S3_SECRET_ACCESS_KEY=<r2_secret>
S3_BUCKET=polish-documents
S3_PUBLIC_URL=https://pub-<hash>.r2.dev

# JWT
JWT_SECRET=<minimum 32 random chars>
JWT_REFRESH_SECRET=<minimum 32 random chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.polish.com/api/oauth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=https://api.polish.com/api/oauth/github/callback

APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
APPLE_REDIRECT_URI=https://api.polish.com/api/oauth/apple/callback

# LLM
OPENAI_API_KEY=
LLM_MODEL=gpt-4o-mini
```

### `apps/web/.env.local` (local dev only — Pages uses dashboard env vars)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## DNS records summary

These records are created automatically — listed here for reference:

| Type | Name | Value | Proxied |
|------|------|-------|---------|
| CNAME | `@` or `polish.com` | Cloudflare Pages URL | Yes |
| CNAME | `www` | Cloudflare Pages URL | Yes |
| CNAME | `api` | `<tunnel-id>.cfargotunnel.com` | Yes |

---

## Pre-deployment checklist

Run through this before going live:

- [ ] PostgreSQL schema applied to Neon (all 5 tables exist)
- [ ] `GET https://api.polish.com/api/health` returns `{ db: "ok", redis: "ok", storage: "ok" }`
- [ ] R2 bucket exists, API token has read/write access, test upload works
- [ ] Cloudflare Tunnel is running as a systemd service (`systemctl status cloudflared`)
- [ ] PM2 is running and set to start on reboot (`pm2 status`, `pm2 startup`)
- [ ] Cloudflare Pages build succeeds with zero errors
- [ ] `next.config.mjs` does NOT have `ignoreBuildErrors: true`
- [ ] SSL mode set to **Full (strict)** in Cloudflare dashboard
- [ ] OAuth redirect URIs updated to production URLs in Google/GitHub/Apple developer consoles
- [ ] All GitHub Actions secrets set (`VPS_HOST`, `VPS_SSH_KEY`)
- [ ] JWT secrets are at least 32 random characters (not the default dev values)
- [ ] `.env` is in `.gitignore` and has never been committed

---

## Costs (approximate)

| Service | Tier | Monthly cost |
|---------|------|-------------|
| Cloudflare (DNS, Pages, Tunnel, R2) | Free | $0 |
| R2 storage | First 10 GB free | $0 (likely) |
| Neon PostgreSQL | Free tier (0.5 GB, scale to zero) | $0 |
| Upstash Redis | Free tier (10k commands/day) | $0 |
| Hetzner VPS CX22 | 2 vCPU, 4 GB RAM | ~€4/month |
| **Total** | | **~€4/month** |

Upgrade Neon and Upstash to paid tiers when you exceed the free limits. The VPS can stay at the smallest size for a long time — the API is stateless and lightweight.
