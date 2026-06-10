# TSR — Think–Solve–Reflect

A Grade 6 Mathematics problem-solving module built as a thesis research project. Students work through a 12-stage engine tied to real-world scenarios; teachers grade open-ended responses and view diagnostic reports.


## Live Demo of WebApplication

Click the link to see the live hosted of this application

[https://tsr-lcm.netlify.app/](https://tsr-lcm.netlify.app/)


## Stack

- **Next.js 16** (App Router)
- **Prisma 7** with `@prisma/adapter-mariadb` (MySQL/MariaDB)
- **Tailwind CSS v4** (config-less, CSS-first)
- **Shadcn/UI** components
- **Custom JWT auth** via `jose`

---

## Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- MySQL or Postgresql server running locally / Cloudbase (Supabase)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd lm-2
pnpm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Required variables in `.env`:

```env
DATABASE_URL=mysql://user:pass@localhost:3306/tsr_db
JWT_SECRET=your-random-secret-string
```

> If `JWT_SECRET` is omitted, the app falls back to a hardcoded dev secret. Never omit it in production.

### 3. Create the database

```bash
mysql -u root -p -e "CREATE DATABASE tsr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Run migrations and generate the Prisma client

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Seed initial data

```bash
npx prisma db seed
```

This seeds admin, teacher, and student accounts along with sample modules and stages.

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default Accounts (after seeding)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@tsr.dev          | admin123   |
| Teacher | teacher@tsr.dev        | teacher123 |
| Student | student@tsr.dev        | student123 |

---

## Common Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm lint         # ESLint

# Prisma
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma migrate deploy              # apply pending migrations
npx prisma generate                    # regenerate client after schema change
npx prisma db seed                     # seed the database
npx prisma studio                      # open GUI database browser
```

---

## Route Overview

| Path | Role | Description |
|------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/register` | Public | Sign up |
| `/onboarding` | Student | Avatar + difficulty setup |
| `/dashboard/student` | Student | Student home + module list |
| `/dashboard/student/modules/[id]/stage/[n]` | Student | 12-stage module engine |
| `/dashboard/student/pre-test` | Student | Take pre-test |
| `/dashboard/teacher` | Teacher | Teacher dashboard |
| `/dashboard/teacher/students` | Teacher | Grade student responses |
| `/dashboard/teacher/reports` | Teacher | Diagnostic reports |
| `/dashboard/teacher/tests` | Teacher | Pre/post test results |
| `/dashboard/teacher/tests/create` | Teacher | Create a test set |
| `/admin` | Admin | User and session management |

---

## Production Deployment

1. Set all environment variables on your server (`DATABASE_URL`, `JWT_SECRET`).
2. Run `npx prisma migrate deploy` to apply any pending migrations.
3. Build and start:

```bash
pnpm build
pnpm start
```

