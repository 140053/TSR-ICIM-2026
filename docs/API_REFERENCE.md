# API Reference
## Think–Solve–Reflect (TSR) System
### Appendix — REST API Documentation

> **Base URL:** `https://<host>`  
> **Data format:** All requests and responses use `application/json`.  
> **Authentication:** Session token delivered as an HTTP-only cookie (`tsr_session`) issued on login or register. All protected routes validate this cookie on every request.  
> **Response envelope:** Every endpoint returns `{ "success": boolean, "error"?: string, ...data }`.

---

## Table of Contents

1. [Authentication & Session](#1-authentication--session)
2. [Public Endpoints](#2-public-endpoints)
3. [Student Endpoints](#3-student-endpoints)
4. [Teacher Endpoints](#4-teacher-endpoints)
5. [Admin — Users](#5-admin--users)
6. [Admin — Sections & Schools](#6-admin--sections--schools)
7. [Admin — Modules](#7-admin--modules)
8. [Admin — Test Sets](#8-admin--test-sets)
9. [Admin — Contexts & Invite Codes](#9-admin--contexts--invite-codes)
10. [Admin — System](#10-admin--system)

---

## 1. Authentication & Session

### `POST /api/auth/register`
**Auth:** None (public)

Registers a new user account. Both students and teachers must select a school from the database (`schoolId`). Teachers additionally supply a valid invite code. On success, issues a `tsr_session` JWT cookie.

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `firstName` | string | ✓ | |
| `lastName` | string | ✓ | |
| `email` | string | ✓ | Must be unique |
| `password` | string | ✓ | Minimum 6 characters |
| `role` | `"STUDENT"` \| `"TEACHER"` | ✓ | |
| `schoolId` | number | ✓ | Must reference an active school |
| `section` | string | Students only | Section name within the chosen school |
| `subject` | string | Teachers only | Subject / department |
| `code` | string | Teachers only | Invite code (DB or env-based) |

**Response:** `{ success, user: { id, name, email, role }, redirectTo }`

---

### `POST /api/auth/login`
**Auth:** None (public)

Validates credentials, creates a `UserSession` record, and sets the `tsr_session` cookie.

**Request body:** `{ email, password, role }`

**Response:** `{ success, user: { id, name, email, role, setupDone? }, redirectTo }`

---

### `POST /api/auth/logout`
**Auth:** Any authenticated user

Deletes the `UserSession` from the database and clears the cookie.

**Response:** `{ success }`

---

### `GET /api/auth/me`
**Auth:** Any authenticated user

Returns the current user's profile derived from the session token.

**Response:** `{ success, user: { id, name, email, role, ... } }`

---

### `POST /api/onboarding/complete`
**Auth:** STUDENT

Saves the student's avatar and difficulty selection after initial login. Marks `setupDone = true` on the `StudentProfile`, creates initial `ModuleProgress` records, and reissues the JWT with the updated payload.

**Request body:** `{ avatar, difficulty }`

**Response:** `{ success, user }`

---

## 2. Public Endpoints

These routes require no authentication and are used by the registration page and public-facing UI.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/contexts` | Returns all active `ScenarioContext` rows (key, label, icon, color, description) |
| `GET` | `/api/schools` | Returns all active schools (`id`, `name`) |
| `GET` | `/api/sections?schoolId=N` | Returns active sections for a given school (`id`, `name`, `emoji`) |

---

## 3. Student Endpoints

All student routes require role `STUDENT`. The student may only access their own data.

---

### `GET /api/modules/available`
Returns all `ACTIVE` modules assigned to the student's section, with lock status and current progress.

**Response:** `{ success, modules: [ { id, title, icon, context, status, isLocked, currentStage, percentScore, ... } ] }`

---

### `GET /api/modules/[id]`
**Auth:** Any authenticated user

Returns full module metadata plus all 12 stages. `correctAnswer` is excluded from the response.

**Response:** `{ success, module: { ...metadata, stages: [ ...12 stages ] } }`

---

### `POST /api/student/modules/[moduleId]/stage/[stageNum]`
**Auth:** STUDENT

Core stage submission endpoint. Saves the student's answer as a `StageResponse`, auto-scores the stage if it is auto-scoreable, advances `ModuleProgress.currentStage`, and triggers `computeDiagnostic()` after Stage 12 is submitted.

**Auto-scored stage types:** MULTIPLE_CHOICE (Stage 1), RANKING (Stage 2), CHECKLIST (Stages 5 & 9), COMPUTATION (Stage 7), BUDGET_CHECK (Stage 10), SELECT_JUSTIFY (Stage 11).

**Request body:** `{ answer: string | object, timeSpent?: number, hintsUsed?: number }`

**Response:** `{ success, isCorrect, score, currentStage, moduleComplete }`

---

### `GET /api/student/modules/[moduleId]/diagnostic`
**Auth:** STUDENT

Returns the student's own `DiagnosticReport` for the given module after completion.

**Response:** `{ success, report: { understandingScore, analysisScore, solutionScore, reflectionScore, weakStages, needsIntervention, ... } }`

---

### `GET /api/student/modules/[moduleId]/completion`
**Auth:** STUDENT

Returns the final overall percent score after module completion.

**Response:** `{ success, percentScore, totalScore, maxPossible }`

---

### `POST /api/student/tests/submit`
**Auth:** STUDENT

Submits all answers for a pre-test or post-test. Each answer is scored immediately. Creates `TestResult` + `TestResponse` records. One submission per student per test set is enforced.

**Request body:** `{ testSetId, answers: [ { questionId, answer } ] }`

**Response:** `{ success, result: { score, totalItems, percentScore, timeSpent } }`

---

### `PATCH /api/student/profile`
**Auth:** STUDENT

Updates the student's display name and/or password.

**Request body:** `{ name?, currentPassword?, newPassword? }`

**Response:** `{ success }`

---

### `GET /api/diagnostic/[userId]/[moduleId]`
**Auth:** STUDENT (own data only), TEACHER (students in their sections), ADMIN

Returns a `DiagnosticReport` with full cluster scores, stage breakdown, and intervention flags.

**Response:** `{ success, report: { ...clusterScores, ...levels, weakStages, strongStages, needsIntervention, interventionNote } }`

---

## 4. Teacher Endpoints

All teacher routes require role `TEACHER`.

---

### `GET /api/teacher/contexts`
Returns all active `ScenarioContext` rows available for module creation.

---

### `POST /api/teacher/contexts`
Creates a new scenario context. Validates key uniqueness.

**Request body:** `{ key, label, description?, icon, color }`

**Response:** `{ success, context }`

---

### `PATCH /api/teacher/contexts/[id]`
Updates an existing context (label, description, icon, color, isActive, sortOrder).

---

### `DELETE /api/teacher/contexts/[id]`
Deletes a context. Blocked if any module references the context key.

---

### `GET /api/teacher/modules/create`
Returns the sections the teacher can assign modules to.

**Response:** `{ success, sections: [ { id, name, emoji } ] }`

---

### `POST /api/teacher/modules/create`
**Auth:** TEACHER or ADMIN

Creates a new module with all 12 stages in a single database transaction. Optionally assigns the module to sections immediately.

**Request body:**

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `scenario` | string | Anchor problem text |
| `context` | string | ScenarioContext key |
| `icon` | string | Emoji |
| `timeEstimate` | number | Minutes |
| `stages` | array (12) | Each: `{ stageNumber, type, title, instruction, hint, options, correctAnswer, maxScore }` |
| `saveAsDraft` | boolean | `false` = publish as ACTIVE |

**Response:** `{ success, module: { id, title, status } }`

---

### `PATCH /api/teacher/modules/[id]`
Updates module metadata (title, icon, scenario, context, status, timeEstimate). Verifies teacher access via section assignment.

---

### `GET /api/teacher/modules/[id]/edit-data`
Returns module metadata plus all stages for the edit form.

---

### `PATCH /api/teacher/modules/[id]/stages/[stageNum]`
Updates a single stage's content (title, instruction, hint, maxScore, options, correctAnswer).

---

### `POST /api/teacher/modules/assign`
Assigns a module to one or more of the teacher's sections. Validates sections belong to the requesting teacher. Supports optional `dueDate` and `unlockAfter`.

**Request body:** `{ moduleId, sections: string[], dueDate?, unlockAfter? }`

---

### `PATCH /api/teacher/responses/[responseId]/score`
Manually grades an open-ended `StageResponse`. Verifies the student is in the teacher's section.

**Request body:** `{ score, teacherNote? }`

**Response:** `{ success, response }`

---

### `GET /api/teacher/class-diagnostic`
Returns aggregated diagnostic data for all students in the teacher's sections — cross-section summary, per-section breakdown, intervention lists, and per-module details.

**Response:** `{ success, summary, sections: [ { name, students, interventionCount, ... } ], modules: [ ... ] }`

---

### `POST /api/teacher/tests/create`
Creates a test set with all questions in a single transaction.

---

### `PUT /api/teacher/tests/[id]`
Full replacement update of a test set's metadata and all questions. Blocked if any student results exist for the test.

---

### `PATCH /api/teacher/tests/[id]`
Toggles the `isActive` flag on a test set.

---

### `DELETE /api/teacher/tests/[id]`
Deletes a test set. Blocked if student results exist.

---

### `PATCH /api/teacher/profile`
Updates the teacher's display name and/or password.

---

## 5. Admin — Users

All admin routes require role `ADMIN`.

---

### `POST /api/admin/users`
Creates a user of any role (STUDENT, TEACHER, ADMIN) without requiring an invite code. Creates a `StudentProfile` if role is STUDENT.

**Request body:** `{ name, email, password, role, schoolId?, sectionId? }`

---

### `PATCH /api/admin/users/[id]`
Updates a user's name, email, or role. Cannot edit other ADMIN accounts.

---

### `DELETE /api/admin/users/[id]`
Permanently deletes a user. Blocks self-deletion and deletion of other admins.

---

### `POST /api/admin/users/[id]/reset-password`
Sets a new password for the user and revokes all their active sessions.

**Request body:** `{ newPassword }`

---

### `POST /api/admin/users/[id]/revoke-sessions`
Deletes all `UserSession` records for the user, forcing re-login on all devices.

---

### `POST /api/admin/users/[id]/assign-section`
Assigns or removes a student from a section.

**Request body:** `{ sectionId: number | null }`

---

### `POST /api/admin/users/[id]/assign-teacher-sections`
Set-based replacement of a teacher's section assignments. Sections in the list get `teacherId` set to this user; sections previously owned but not in the list get `teacherId` cleared.

**Request body:** `{ sectionIds: number[] }`

---

### `DELETE /api/admin/users/[id]/progress/[moduleId]`
Resets a student's progress for a specific module. Removes `ModuleProgress`, all `StageResponse` records, and the `DiagnosticReport` for that module.

---

## 6. Admin — Sections & Schools

---

### `POST /api/admin/sections`
Creates a new section.

**Request body:** `{ name, emoji?, gradeLevel?, schoolYear?, schoolId? }`

---

### `PATCH /api/admin/sections/[id]`
Updates section fields. Supports `teacherId` to assign or remove a teacher.

**Request body:** `{ name?, emoji?, gradeLevel?, schoolYear?, schoolId?, teacherId?, isActive? }`

---

### `DELETE /api/admin/sections/[id]`
Deletes a section. Blocked if students are still assigned. Removes all module assignments first.

---

### `GET /api/admin/schools`
Returns all schools with section and student counts, plus a list of their sections.

---

### `POST /api/admin/schools`
Creates a new school.

**Request body:** `{ name, address? }`

---

### `PATCH /api/admin/schools/[id]`
Updates school name, address, or `isActive` status.

---

### `DELETE /api/admin/schools/[id]`
Deletes a school. Blocked if sections or students are assigned.

---

## 7. Admin — Modules

---

### `PATCH /api/admin/modules/[id]`
Updates module metadata.

**Request body:** `{ title?, icon?, subtitle?, scenario?, context?, status?, gradeLevel?, isLocked?, unlockAfter?, timeEstimate? }`

---

### `DELETE /api/admin/modules/[id]`
Permanently deletes a module and all related data: stages, student responses, module progress, section assignments, and diagnostic reports.

---

### `POST /api/admin/modules/[id]/assign`
Set-based replacement of module-to-section assignments. Upserts assignments for the given `sectionIds` and removes any existing assignments not in the list. Supports an optional `dueDate`.

**Request body:** `{ sectionIds: number[], dueDate?: string | null }`

**Response:** `{ success, message, assignedCount }`

---

### `POST /api/admin/modules/[id]/stages/[stageNum]`
Creates a new stage for a module. Validates stage number (1–12) and assigns the correct `StagePhase`.

**Request body:** `{ type, title, instruction, hint?, options?, correctAnswer?, maxScore? }`

---

### `PATCH /api/admin/modules/[id]/stages/[stageNum]`
Updates an existing stage's content and configuration.

**Request body:** `{ type?, title?, instruction?, hint?, maxScore?, options?, correctAnswer? }`

---

## 8. Admin — Test Sets

---

### `GET /api/admin/test-sets`
Returns all test sets with question and result counts, the linked module (if any), current section assignments, and lists of all sections and schools for the assignment modal.

**Response:** `{ success, testSets: [ { id, title, type, module, assignments, _count, ... } ], modules, sections, schools }`

---

### `POST /api/admin/test-sets`
Creates a new test set.

**Request body:** `{ title, type: "PRE_TEST" | "POST_TEST", moduleId?, description?, timeLimit? }`

---

### `PATCH /api/admin/test-sets/[id]`
Updates test set metadata (title, type, moduleId, description, timeLimit, isActive).

---

### `DELETE /api/admin/test-sets/[id]`
Deletes a test set and all its questions. Blocked if any student results exist.

---

### `POST /api/admin/test-sets/[id]/assign`
Set-based replacement of test-set-to-section assignments using the `TestSetAssignment` junction table.

**Request body:** `{ sectionIds: number[] }`

**Response:** `{ success, message, assignedCount }`

---

### `POST /api/admin/test-sets/[id]/reset`
Deletes all `TestResult` records for the test set (cascades to `TestResponse`). Students may retake the test after a reset.

**Response:** `{ success, deletedCount }`

---

### `GET /api/admin/test-sets/[id]/questions`
Returns the test set plus all its questions.

**Response:** `{ success, testSet: { ...metadata, questions: [ ... ] } }`

---

### `POST /api/admin/test-sets/[id]/questions`
Creates a new question for the test set.

**Request body:**

| Field | Type | Notes |
|-------|------|-------|
| `questionNum` | number | Must be unique within the test set |
| `context` | string | Real-world context label (e.g., "Sari-Sari Store") |
| `questionText` | string | |
| `answer` | string | Correct answer value or "A"/"B"/"C"/"D" for multiple choice |
| `answerType` | string | `"number"` \| `"text"` \| `"time"` \| `"multiple_choice"` |
| `choices` | string | JSON array of 4 choice strings (multiple choice only) |
| `difficulty` | string | `"easy"` \| `"average"` \| `"difficult"` |
| `points` | number | Default 1 |

---

### `PATCH /api/admin/test-sets/[id]/questions/[qid]`
Updates a question. Validates `questionNum` uniqueness within the test set.

---

### `DELETE /api/admin/test-sets/[id]/questions/[qid]`
Deletes a question. Blocked if any student has already answered it.

---

## 9. Admin — Contexts & Invite Codes

---

### `GET /api/admin/contexts`
Lists all scenario contexts.

---

### `POST /api/admin/contexts`
Creates a new `ScenarioContext`.

**Request body:** `{ key, label, description?, icon, color, sortOrder? }`

---

### `PATCH /api/admin/contexts/[id]`
Updates context fields (label, description, icon, color, isActive, sortOrder).

---

### `DELETE /api/admin/contexts/[id]`
Deletes a context. Blocked if any module references the context key.

---

### `GET /api/admin/invite-codes`
Returns all teacher invite codes with creator and consumer information.

---

### `POST /api/admin/invite-codes`
Generates a new invite code in the format `TSR-XXXX-XXXX`.

**Request body:** `{ label?, expiresAt? }`

**Response:** `{ success, code: { id, code, label, expiresAt, isActive } }`

---

### `PATCH /api/admin/invite-codes/[id]`
Toggles the `isActive` flag on an invite code.

---

### `DELETE /api/admin/invite-codes/[id]`
Deletes an invite code. Blocked if the code has already been used by a teacher.

---

## 10. Admin — System

---

### `POST /api/admin/sessions/clear`
Deletes all expired `UserSession` records from the database. Active sessions are not affected.

**Response:** `{ success, deletedCount }`

---

### `GET /api/admin/export`
Exports the full system dataset as a downloadable JSON file. Includes all modules with stages and assignments, all student module progress, all stage responses, and all diagnostic reports.

**Response:** `Content-Disposition: attachment; filename="tsr-export-YYYY-MM-DD.json"`

```json
{
  "exportedAt": "ISO datetime",
  "exportedBy": { "id": 1, "email": "admin@example.com" },
  "summary": { "totalModules": 0, "totalProgress": 0, "totalResponses": 0, "totalDiagnostics": 0 },
  "modules": [ ... ],
  "progress": [ ... ],
  "stageResponses": [ ... ],
  "diagnosticReports": [ ... ]
}
```

---

### `POST /api/admin/setup`
**Auth:** Token-gated (no session required)

Creates the first ADMIN account. Requires `ADMIN_SETUP_TOKEN` environment variable. Blocked if any admin user already exists.

**Request body:** `{ token, name, email, password }`

---

## Appendix — HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| `200` | OK — successful GET / PATCH / DELETE |
| `201` | Created — successful POST that created a resource |
| `400` | Bad Request — validation failure or malformed body |
| `401` | Unauthorized — missing or invalid session |
| `403` | Forbidden — authenticated but insufficient role |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate record or deletion blocked by dependents |
| `500` | Internal Server Error — unexpected server-side failure |

---

## Appendix — Role Hierarchy

| Role | Access |
|------|--------|
| `STUDENT` | Own profile, own module progress, own test results |
| `TEACHER` | Own sections' students + modules; grading; context management |
| `ADMIN` | Full system access including user management, all data, and system operations |
