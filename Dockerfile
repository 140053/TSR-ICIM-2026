# ─────────────────────────────────────────────────────────────
# TSR · Think–Solve–Reflect  — Multi-stage Docker build
# ─────────────────────────────────────────────────────────────

# ── Stage 1 · deps ──────────────────────────────────────────
# Install all dependencies needed for the build.
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# ── Stage 2 · builder ───────────────────────────────────────
# Generate Prisma client and produce the Next.js build.
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client into src/lib/generated/prisma/
RUN npx prisma generate

# Provide a dummy DATABASE_URL so `new URL(process.env.DATABASE_URL)` in
# lib/prisma.ts doesn't throw during static analysis. No DB connection is
# made at build time — the real value is injected at runtime via env_file.
ENV DATABASE_URL=mysql://build:build@localhost:3306/build
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build


# ── Stage 3 · runner ────────────────────────────────────────
# Production image — full node_modules + Next.js build output.
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Prisma CLI globally to run `prisma migrate deploy` at startup
RUN npm install -g prisma@7

WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# App source artefacts
COPY --from=builder /app/public           ./public
COPY --from=builder /app/.next            ./.next
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/package.json     ./package.json

# Prisma schema + migrations + config
COPY --from=builder /app/prisma           ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3001

# Run pending migrations then start the app
CMD ["sh", "-c", "prisma migrate deploy && pnpm start"]
