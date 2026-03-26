# ─── Fastify / Express API ───────────────────────────────────────────────────
#
# Current (JavaScript):  deps → runner   (no compile step)
# After TypeScript rewrite: uncomment the builder stage and update CMD.
#
# The TypeScript rewrite section is commented out below — flip the comments
# once plan.md Phase 2 is complete.

FROM node:22-alpine AS base

# ── Stage 1: install production dependencies ──────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# --omit=dev keeps devDependencies (ts-node-dev, typescript, etc.) out of image
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# TypeScript rewrite — uncomment this stage once plan.md Phase 2 is done
# ─────────────────────────────────────────────────────────────────────────────
# FROM base AS builder
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci
# COPY . .
# RUN npm run build          # tsc → dist/
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 apiuser

# Current JS version
COPY --from=deps  /app/node_modules  ./node_modules
COPY --chown=apiuser:nodejs src       ./src
COPY --chown=apiuser:nodejs package.json ./

# TypeScript rewrite — swap the two COPY blocks above for these:
# COPY --from=deps    /app/node_modules  ./node_modules
# COPY --from=builder --chown=apiuser:nodejs /app/dist ./dist
# COPY --chown=apiuser:nodejs package.json ./

USER apiuser

EXPOSE 5000

# Creates an uploads/ dir at runtime for multer temp files
RUN mkdir -p /tmp/uploads

# Current JS entry point
CMD ["node", "src/server.js"]

# TypeScript rewrite entry point — swap when ready:
# CMD ["node", "dist/server.js"]
