# Installation Guide

## Prerequisites

- **Node.js** 20 or later
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL** database (local or hosted — [Supabase](https://supabase.com) recommended)

---

## 1. Clone and Install

```bash
git clone <repository-url>
cd lm2-ICIM-2026
pnpm install
```

---

## 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string (required)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT secret for session signing (required in production)
JWT_SECRET="replace-with-a-long-random-string"

# Application environment
NODE_ENV="development"
```

**Using Supabase?** Use the **connection pooler** URL (port 6543) for `DATABASE_URL` to support serverless/edge deployments.

> The app falls back to a hardcoded dev secret if `JWT_SECRET` is unset — **always set this in production**.

---

## 3. Set Up the Database

Generate the Prisma client and apply all migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development you can also use:

```bash
npx prisma migrate dev
```

---

## 4. Seed Initial Data

```bash
npx prisma db seed
```

This creates the following default accounts:

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Admin   | `admin@tsr.edu`     | `Admin1234!` |
| Teacher | `teacher@tsr.edu`   | `Teacher1234!` |

It also seeds scenario contexts, sample schools, and class sections.

---

## 5. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Production Build

```bash
pnpm build
pnpm start
```

`pnpm build` automatically runs `prisma generate` before building.

---

## Common Commands

```bash
pnpm dev                                        # start dev server
pnpm build                                      # production build
pnpm lint                                       # run ESLint

npx prisma migrate dev --name <migration-name>  # create + apply a new migration
npx prisma migrate deploy                       # apply pending migrations (production)
npx prisma generate                             # regenerate Prisma client
npx prisma db seed                              # re-run the seed script
npx prisma studio                               # open the database GUI browser
```

---

## Troubleshooting

**Prisma client not found**
Run `npx prisma generate`. The client is output to `src/lib/generated/prisma/` (not `node_modules`).

**Migration errors on a fresh database**
Use `npx prisma migrate deploy` instead of `migrate dev` if you already have migration files.

**`JWT_SECRET` warning in logs**
Set `JWT_SECRET` in your `.env`. The fallback value is intentionally insecure and only suitable for local development.
