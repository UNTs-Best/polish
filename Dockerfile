# ─── Next.js Frontend ────────────────────────────────────────────────────────
# Multi-stage build producing a minimal standalone image.
# next.config.mjs outputs to .next/standalone when DOCKER_BUILD=true.

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

#  Stage 1: install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Triggers standalone output in next.config.mjs
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time public env vars — override via --build-arg in CI
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 3: runner 
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone build contains everything needed to run — copy the minimum
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
USER nextjs
EXPOSE 3000

# standalone output exposes a node server at server.js
CMD ["node", "server.js"]
