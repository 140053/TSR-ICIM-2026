# TSR — Think–Solve–Reflect
### A Web-Based Problem-Solving Module for Grade 6 Mathematics

A Grade 6 Mathematics problem-solving module built as a thesis research project. Students work through a 12-stage engine tied to real-world scenarios; teachers grade open-ended responses and view diagnostic reports.


---

## 1. Overview

**Think–Solve–Reflect (TSR)** is a web-based instructional system developed to address a persistent gap in Grade 6 Mathematics instruction: students can often compute correctly, but struggle to **understand a real-world problem, plan a solution, and reflect on their own reasoning**. TSR operationalizes a structured problem-solving framework as an interactive, scenario-based digital module — turning a pedagogical model into a measurable, usable system.

Rather than presenting math as isolated computation, TSR walks each student through a **12-stage guided engine** built around realistic, everyday scenarios (e.g., budgeting, planning, resource allocation), requiring them to understand the problem, analyze what's known and unknown, evaluate possible solutions, and reflect on their own process — mirroring how the framework is meant to be taught, not just tested.

**Live system:** [https://tsr-lcm.netlify.app/](https://tsr-lcm.netlify.app/)

---

## 2. Research Rationale

| Problem Observed | TSR's Response |
|---|---|
| Students jump to computation without understanding the problem | Stages 1–3 force categorization, prioritization, and explanation *before* any number-crunching |
| Problem-solving is graded only on final answers | Every stage is scored individually, so the *process* is visible, not just the result |
| Teachers lack visibility into *where* a student's reasoning breaks down | Diagnostic reports isolate performance by cognitive phase (Understanding / Analysis / Solution / Reflection), not just an overall score |
| Paper-based problem-solving worksheets don't scale or self-grade | Auto-scored stages reduce teacher workload; open-ended stages are routed to teachers only where human judgment is needed |
| One-size-fits-all difficulty discourages struggling or advanced learners | Students choose a difficulty tier that adjusts hint availability without changing the underlying problem |

---

## 3. The Think–Solve–Reflect Framework, As a System

The 12 stages are grouped into four phases that mirror the framework's cognitive progression:

```
 UNDERSTAND  →  ANALYZE  →  SOLVE  →  REFLECT
 Stages 1-3     Stages 4-7  Stages 8-10  Stages 11-12
```

| Phase | Purpose | Example of what the student does |
|---|---|---|
| **1. Understanding** | Make sense of the scenario | Identify what kind of problem it is, rank what matters most, explain the situation in their own words |
| **2. Analysis** | Break the problem down | Sort what is *given*, *missing*, and *assumed*; check applicable constraints; perform live calculations |
| **3. Solution** | Decide and act | Compare two competing plans, choose one, simulate a trial implementation and check whether it actually works |
| **4. Reflection** | Think about their own thinking | Justify their final choice, then rate and describe their own confidence and understanding |

This is the system's central research contribution: it does not just *ask* students to problem-solve — it **decomposes problem-solving into observable, gradable steps**, so each cognitive phase can be measured independently rather than inferred from a single final score.

---

## 4. Who Uses It

| Role | What they experience |
|---|---|
| **Student** | Sets up a learning avatar and difficulty level, works through assigned modules one scenario at a time, takes a pre-test and post-test, and can view their own diagnostic report and progress/achievements |
| **Teacher** | Assigns modules and test sets to their sections, grades open-ended responses, and reviews class-wide and individual diagnostic reports to identify which students or stages need intervention |
| **Administrator** | Manages schools, sections, user accounts, and the module/scenario content library, and oversees the system as a whole |

---

## 5. From Response to Diagnosis

Every answer a student submits — whether multiple choice, a ranking, a free-text reflection, or a calculation — is recorded individually. The system then aggregates these into a **Diagnostic Report** per student, per module, broken down by phase:

- A **score per phase** (Understanding, Analysis, Solution, Reflection)
- A **performance level** per phase — *Proficient*, *Developing*, or *Struggling*
- **Flagged weak and strong stages**, so a teacher can see precisely *where* a student's understanding holds up and where it doesn't
- An **intervention flag**, surfacing students who may need direct follow-up

This turns what would otherwise be a single test score into a map of *where in the reasoning process* a student needs support — which is the diagnostic value the research is built to demonstrate.

---

## 6. Why a Web Application

Building TSR as a web application — rather than a paper instrument or a standalone offline tool — was a deliberate methodological choice:

- **Consistency**: every student receives the same scenario, in the same sequence, scored the same way — removing administration variance inherent to paper-based tools.
- **Immediacy**: auto-scored stages give instant feedback; teachers see results the moment a student finishes, not after manual tallying.
- **Scalability**: one teacher can monitor an entire section's progress and diagnostics from a single dashboard.
- **Data integrity for research**: every interaction is timestamped and stored, supporting the quantitative analysis the thesis depends on — something a paper-based pilot could not provide at the same fidelity.

---

## 7. Summary

TSR is not a digitized worksheet — it is a structured implementation of a problem-solving pedagogy, built to make each step of student reasoning visible, gradable, and diagnosable. The system's value to this research is twofold: it demonstrates that the Think–Solve–Reflect framework can be operationalized as a usable, scalable web tool, and it generates the granular, phase-level data needed to evaluate its instructional impact on Grade 6 students.


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
cd TSR-ICIM-2026
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

