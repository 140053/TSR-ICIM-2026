# Entity-Relationship Diagram
## Think–Solve–Reflect (TSR) System
### Chapter 3 — Database Design

> **How to render this diagram:**
> - **VS Code:** Install the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension, then open Preview (`Ctrl+Shift+V`).
> - **Online:** Paste the diagram block at [https://mermaid.live](https://mermaid.live) — export as PNG or SVG.
> - **CLI export:** `npx @mermaid-js/mermaid-cli -i docs/ERD.md -o docs/ERD.png`

---

## Full Entity-Relationship Diagram

```mermaid
erDiagram

    %% ── USER DOMAIN ──────────────────────────────────────────
    User {
        Int     id          PK
        String  name
        String  email       UK
        String  password    "bcrypt hashed"
        Role    role        "STUDENT | TEACHER | ADMIN"
        DateTime createdAt
        DateTime updatedAt
    }

    StudentProfile {
        Int        id        PK
        Int        userId    FK
        AvatarType avatar
        String     avatarEmoji
        Difficulty difficulty  "APPRENTICE | ADVENTURER | CHAMPION"
        Int        sectionId FK  "nullable"
        Int        schoolId  FK  "nullable"
        Int        xp
        Int        level
        Int        streak
        Boolean    setupDone
        DateTime   createdAt
    }

    UserSession {
        Int      id        PK
        Int      userId    FK
        String   token     UK
        DateTime expiresAt
        DateTime createdAt
    }

    TeacherInviteCode {
        Int      id          PK
        String   code        UK
        String   label       "nullable"
        Int      createdById FK
        Int      usedById    FK  "nullable"
        DateTime expiresAt   "nullable"
        Boolean  isActive
        DateTime createdAt
    }

    %% ── SCHOOL DOMAIN ────────────────────────────────────────
    School {
        Int     id       PK
        String  name
        String  address  "nullable"
        Boolean isActive
        DateTime createdAt
    }

    Section {
        Int     id         PK
        String  name
        String  emoji
        String  gradeLevel
        Int     teacherId  FK  "nullable"
        Int     schoolId   FK  "nullable"
        String  schoolYear "nullable"
        Boolean isActive
        DateTime createdAt
    }

    %% ── MODULE DOMAIN ────────────────────────────────────────
    ScenarioContext {
        Int     id          PK
        String  key         UK
        String  label
        String  description "nullable"
        String  icon
        String  color
        Boolean isActive
        Int     sortOrder
        DateTime createdAt
    }

    Module {
        Int          id           PK
        String       title
        String       context      "FK→ScenarioContext.key (soft)"
        String       scenario     "anchor problem text"
        ModuleStatus status       "DRAFT | ACTIVE | ARCHIVED"
        Boolean      isLocked
        Int          unlockAfter  "nullable"
        String       gradeLevel
        Int          timeEstimate "nullable, minutes"
        DateTime     createdAt
    }

    Stage {
        Int        id          PK
        Int        moduleId    FK
        Int        stageNumber "1–12"
        StagePhase phase       "UNDERSTANDING | ANALYSIS | SOLUTION | REFLECTION"
        String     title
        String     instruction
        StageType  type
        String     hint        "nullable"
        Json       options     "nullable"
        String     correctAnswer "nullable"
        Int        maxScore
        DateTime   createdAt
    }

    ModuleAssignment {
        Int      id        PK
        Int      moduleId  FK
        Int      sectionId FK
        DateTime assignedAt
        DateTime dueDate   "nullable"
    }

    %% ── PROGRESS DOMAIN ──────────────────────────────────────
    ModuleProgress {
        Int            id           PK
        Int            userId       FK
        Int            moduleId     FK
        Difficulty     difficulty
        ProgressStatus status       "NOT_STARTED | IN_PROGRESS | COMPLETED"
        Int            currentStage
        Int            totalScore   "nullable"
        Float          percentScore "nullable"
        DateTime       startedAt
        DateTime       completedAt  "nullable"
        DateTime       lastActiveAt "nullable"
    }

    StageResponse {
        Int      id          PK
        Int      userId      FK
        Int      stageId     FK
        Int      moduleId
        String   answer      "JSON string"
        Boolean  isCorrect   "nullable — null = pending grade"
        Int      score       "nullable"
        Int      timeSpent   "nullable, seconds"
        Int      hintsUsed
        String   teacherNote "nullable"
        DateTime gradedAt    "nullable"
        DateTime createdAt
    }

    DiagnosticReport {
        Int            id                 PK
        Int            userId             FK
        Int            moduleId
        Float          understandingScore "nullable, 0–100"
        Float          analysisScore      "nullable, 0–100"
        Float          solutionScore      "nullable, 0–100"
        Float          reflectionScore    "nullable, 0–100"
        Float          overallScore       "nullable"
        DiagnosticLevel understandingLevel "nullable"
        DiagnosticLevel analysisLevel      "nullable"
        DiagnosticLevel solutionLevel      "nullable"
        DiagnosticLevel reflectionLevel    "nullable"
        Json           weakStages         "nullable"
        Json           strongStages       "nullable"
        Boolean        needsIntervention
        String         interventionNote   "nullable"
        DateTime       generatedAt
    }

    %% ── TEST DOMAIN ──────────────────────────────────────────
    TestSet {
        Int      id          PK
        Int      moduleId    FK  "nullable"
        TestType type        "PRE_TEST | POST_TEST"
        String   title
        String   description "nullable"
        Int      timeLimit   "nullable, seconds"
        Boolean  isActive
        DateTime createdAt
    }

    TestSetAssignment {
        Int      id        PK
        Int      testSetId FK
        Int      sectionId FK
        DateTime assignedAt
    }

    TestQuestion {
        Int    id           PK
        Int    testSetId    FK
        Int    questionNum  "1–20, unique per test"
        String context      "real-world scenario label"
        String questionText
        String answer       "correct answer"
        String answerType   "number | text | time | multiple_choice"
        String choices      "nullable, JSON array"
        String difficulty   "easy | average | difficult"
        Int    points
    }

    TestResult {
        Int      id           PK
        Int      userId       FK
        Int      testSetId    FK
        TestType type
        Int      score
        Int      totalItems
        Float    percentScore
        Int      timeSpent    "nullable, seconds"
        DateTime submittedAt
    }

    TestResponse {
        Int     id            PK
        Int     testResultId  FK
        Int     questionId    FK
        String  studentAnswer
        Boolean isCorrect
        DateTime createdAt
    }

    %% ── RELATIONSHIPS ────────────────────────────────────────

    User            ||--o|  StudentProfile      : "has profile"
    User            ||--o{  UserSession         : "has sessions"
    User            ||--o{  ModuleProgress      : "tracks progress"
    User            ||--o{  StageResponse       : "submits"
    User            ||--o{  DiagnosticReport    : "receives"
    User            ||--o{  TestResult          : "takes test"
    User            ||--o{  TeacherInviteCode   : "created by"
    User            |o--o{  TeacherInviteCode   : "used by"
    User            ||--o{  Section             : "teaches"

    School          ||--o{  Section             : "contains"
    School          ||--o{  StudentProfile      : "enrolls"

    Section         }o--||  School              : "belongs to"
    Section         }o--o|  User                : "taught by"
    Section         ||--o{  StudentProfile      : "has students"
    Section         ||--o{  ModuleAssignment    : "assigned modules"
    Section         ||--o{  TestSetAssignment   : "assigned tests"

    StudentProfile  }|--||  User                : "belongs to"
    StudentProfile  }o--o|  Section             : "enrolled in"
    StudentProfile  }o--o|  School              : "enrolled in"

    Module          ||--|{  Stage               : "has stages"
    Module          ||--o{  ModuleProgress      : "tracked by"
    Module          ||--o{  ModuleAssignment    : "assigned via"
    Module          ||--o{  TestSet             : "linked tests"

    ModuleAssignment }o--|| Module              : "module"
    ModuleAssignment }o--|| Section             : "section"

    Stage           }|--||  Module              : "belongs to"
    Stage           ||--o{  StageResponse       : "answered by"

    ModuleProgress  }o--||  User                : "of user"
    ModuleProgress  }o--||  Module              : "of module"

    StageResponse   }o--||  User                : "by user"
    StageResponse   }o--||  Stage               : "for stage"

    DiagnosticReport }o--|| User                : "for user"

    TestSet         }o--o|  Module              : "linked to"
    TestSet         ||--|{  TestQuestion        : "has questions"
    TestSet         ||--o{  TestResult          : "results"
    TestSet         ||--o{  TestSetAssignment   : "assigned via"

    TestSetAssignment }o--|| TestSet            : "test"
    TestSetAssignment }o--|| Section            : "section"

    TestQuestion    }|--||  TestSet             : "belongs to"
    TestQuestion    ||--o{  TestResponse        : "answered by"

    TestResult      }o--||  User                : "by user"
    TestResult      }o--||  TestSet             : "for test"
    TestResult      ||--|{  TestResponse        : "contains"

    TestResponse    }|--||  TestResult          : "part of"
    TestResponse    }|--||  TestQuestion        : "for question"
```

---

## Simplified Conceptual Diagram

The diagram below groups the 18 models into five functional domains for a high-level thesis overview.

```mermaid
flowchart TD
    subgraph AUTH["👤 User & Auth Domain"]
        U(User)
        SP(StudentProfile)
        US(UserSession)
        TIC(TeacherInviteCode)
        U --- SP
        U --- US
        U --- TIC
    end

    subgraph ORG["🏫 Organisational Domain"]
        SCH(School)
        SEC(Section)
        SCH --- SEC
    end

    subgraph MOD["📦 Module Domain"]
        SC(ScenarioContext)
        M(Module)
        ST(Stage)
        MA(ModuleAssignment)
        M --- ST
        M --- MA
        SC -. "key ref" .-> M
    end

    subgraph PROG["📊 Progress & Diagnostic Domain"]
        MP(ModuleProgress)
        SR(StageResponse)
        DR(DiagnosticReport)
    end

    subgraph TEST["📝 Pre/Post Test Domain"]
        TS(TestSet)
        TQ(TestQuestion)
        TR(TestResult)
        TResp(TestResponse)
        TSA(TestSetAssignment)
        TS --- TQ
        TS --- TR
        TS --- TSA
        TR --- TResp
        TQ --- TResp
    end

    U -->|"tracks"| MP
    U -->|"submits"| SR
    U -->|"receives"| DR
    U -->|"takes"| TR
    U -->|"teaches"| SEC

    SP -->|"enrolled in"| SEC
    SEC -->|"assigned"| MA
    SEC -->|"assigned"| TSA

    M -->|"progress"| MP
    ST -->|"response"| SR
    MP -->|"triggers"| DR

    M -.->|"linked"| TS
```

---

## Entity Descriptions

### User Domain

| Model | Table | Description |
|-------|-------|-------------|
| **User** | `users` | Base account for all roles (STUDENT, TEACHER, ADMIN). Stores hashed credentials and role. |
| **StudentProfile** | `student_profiles` | Extended profile for students only. Set during the onboarding wizard. Holds avatar, difficulty level, XP, level, and section enrollment. One-to-one with User. |
| **UserSession** | `user_sessions` | Tracks active JWT sessions. Used for server-side revocation. Token is stored as a unique VarChar(512). |
| **TeacherInviteCode** | `teacher_invite_codes` | One-time codes that gate teacher registration. Consumed on use (`usedById` set, `isActive` cleared). |

### Organisational Domain

| Model | Table | Description |
|-------|-------|-------------|
| **School** | `schools` | Physical school entity. Sections and student profiles are grouped under a school. |
| **Section** | `sections` | A class section (e.g., "Grade 6 – Narra"). Belongs to a school and has one teacher. Students enroll in a section. Modules and test sets are assigned to sections. |

### Module Domain

| Model | Table | Description |
|-------|-------|-------------|
| **ScenarioContext** | `scenario_contexts` | Lookup table for real-world problem contexts (e.g., "Barangay Feeding Program"). Referenced by `Module.context` as a soft key (no FK). |
| **Module** | `modules` | A problem-solving module containing 12 stages. Has a status (DRAFT/ACTIVE/ARCHIVED) and optional lock mechanism. |
| **Stage** | `stages` | One of 12 ordered stages in a module. Belongs to a StagePhase (Understanding/Analysis/Solution/Reflection). Stores question, type-specific options JSON, and correct answer. Unique on (moduleId, stageNumber). |
| **ModuleAssignment** | `module_assignments` | Junction table linking a Module to a Section with an optional due date. Unique on (moduleId, sectionId). |

### Progress & Diagnostic Domain

| Model | Table | Description |
|-------|-------|-------------|
| **ModuleProgress** | `module_progress` | Tracks a student's progress through one module: current stage, total score, percent score, and timestamps. Unique on (userId, moduleId). |
| **StageResponse** | `stage_responses` | Stores a student's answer for one stage. Auto-scored stages populate `score` immediately; open-ended stages wait for teacher grading. Unique on (userId, stageId). |
| **DiagnosticReport** | `diagnostic_reports` | Generated after Stage 12. Groups stage scores into 4 cluster percentages (Understanding, Analysis, Solution, Reflection) with proficiency levels and intervention flags. Unique on (userId, moduleId). |

### Pre/Post Test Domain

| Model | Table | Description |
|-------|-------|-------------|
| **TestSet** | `test_sets` | A timed or untimed set of questions (PRE_TEST or POST_TEST). Optionally linked to a Module. |
| **TestSetAssignment** | `test_set_assignments` | Junction table linking a TestSet to a Section. Students access tests through this assignment. Unique on (testSetId, sectionId). |
| **TestQuestion** | `test_questions` | An individual question within a TestSet. Supports multiple answer types (number, text, time, multiple choice). Unique on (testSetId, questionNum). |
| **TestResult** | `test_results` | A student's completed submission for one TestSet. Records score, total items, and percent score. Unique on (userId, testSetId) — one attempt enforced. |
| **TestResponse** | `test_responses` | Individual answer for one question within a TestResult. Stores the student's answer and whether it was correct. |

---

## Enumerations

| Enum | Values | Used In |
|------|--------|---------|
| `Role` | STUDENT, TEACHER, ADMIN | User |
| `Difficulty` | APPRENTICE, ADVENTURER, CHAMPION | StudentProfile, ModuleProgress |
| `AvatarType` | WIZARD, ELF, HERO, CHAMPION, EXPLORER, FOX, DRAGON, LION, EAGLE, WOLF | StudentProfile |
| `StageType` | MULTIPLE_CHOICE, RANKING, OPEN_ENDED, TABLE_INPUT, CHECKLIST, COMPUTATION, MULTI_PLAN, BUDGET_CHECK, SELECT_JUSTIFY, REFLECTION_SLIDER | Stage |
| `StagePhase` | UNDERSTANDING (Stages 1–3), ANALYSIS (Stages 4–7), SOLUTION (Stages 8–10), REFLECTION (Stages 11–12) | Stage |
| `ModuleStatus` | DRAFT, ACTIVE, ARCHIVED | Module |
| `ProgressStatus` | NOT_STARTED, IN_PROGRESS, COMPLETED | ModuleProgress |
| `DiagnosticLevel` | PROFICIENT (≥80%), DEVELOPING (60–79%), STRUGGLING (<60%) | DiagnosticReport |
| `TestType` | PRE_TEST, POST_TEST | TestSet, TestResult |

---

## Database Table Summary

| Table | Model | Rows represent |
|-------|-------|----------------|
| `users` | User | All system accounts |
| `student_profiles` | StudentProfile | Game setup data per student |
| `user_sessions` | UserSession | Active JWT sessions |
| `teacher_invite_codes` | TeacherInviteCode | One-time teacher registration codes |
| `schools` | School | Physical schools |
| `sections` | Section | Class sections within schools |
| `scenario_contexts` | ScenarioContext | Real-world problem context definitions |
| `modules` | Module | Problem-solving modules |
| `stages` | Stage | Individual stages (1–12) per module |
| `module_assignments` | ModuleAssignment | Module ↔ Section assignments |
| `module_progress` | ModuleProgress | Per-student per-module progress |
| `stage_responses` | StageResponse | Per-student per-stage answers |
| `diagnostic_reports` | DiagnosticReport | Post-completion diagnostic results |
| `test_sets` | TestSet | Pre-test and post-test sets |
| `test_set_assignments` | TestSetAssignment | TestSet ↔ Section assignments |
| `test_questions` | TestQuestion | Individual test questions |
| `test_results` | TestResult | Per-student test submissions |
| `test_responses` | TestResponse | Per-question answers in a submission |
