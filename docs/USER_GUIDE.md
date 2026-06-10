# User Guide
## Think–Solve–Reflect (TSR) System
### How-To Manual for Admin, Teacher, and Student Roles

---

## Table of Contents

1. [Getting Started — All Roles](#1-getting-started--all-roles)
2. [Admin Guide](#2-admin-guide)
   - [Logging In](#21-logging-in)
   - [Dashboard Overview](#22-dashboard-overview)
   - [Managing Users](#23-managing-users)
   - [Managing Schools & Sections](#24-managing-schools--sections)
   - [Managing Modules](#25-managing-modules)
   - [Creating a New Module](#26-creating-a-new-module)
   - [Managing Test Sets](#27-managing-test-sets)
   - [Managing Contexts & Invite Codes](#28-managing-contexts--invite-codes)
   - [System Tools](#29-system-tools)
3. [Teacher Guide](#3-teacher-guide)
   - [Registering & Logging In](#31-registering--logging-in)
   - [Dashboard Home](#32-dashboard-home)
   - [Viewing Student Progress](#33-viewing-student-progress)
   - [Grading Open-Ended Responses](#34-grading-open-ended-responses)
   - [Managing Modules](#35-managing-modules)
   - [Creating a New Module](#36-creating-a-new-module)
   - [Pre/Post Test Results](#37-prepost-test-results)
   - [Class Reports & Diagnostics](#38-class-reports--diagnostics)
   - [Managing Learning Contexts](#39-managing-learning-contexts)
4. [Student Guide](#4-student-guide)
   - [Registering & Logging In](#41-registering--logging-in)
   - [Onboarding Setup](#42-onboarding-setup)
   - [Student Dashboard](#43-student-dashboard)
   - [Taking the Pre-Test](#44-taking-the-pre-test)
   - [Working Through a Module](#45-working-through-a-module)
   - [Stage Types Explained](#46-stage-types-explained)
   - [Viewing Your Diagnostic Report](#47-viewing-your-diagnostic-report)
   - [Taking the Post-Test](#48-taking-the-post-test)
   - [Achievements & Profile](#49-achievements--profile)

---

## 1. Getting Started — All Roles

### System URLs

| Role | Login Page |
|------|-----------|
| Student | `/login` |
| Teacher | `/login` |
| Admin | `/admin/login` |

### First-Time Setup Order

For a fresh deployment, follow this sequence:

1. **Admin:** Use `/admin/setup` to create the first admin account (requires `ADMIN_SETUP_TOKEN` from the server environment).
2. **Admin:** Create schools and sections under the Sections and Schools tabs.
3. **Admin:** Generate teacher invite codes under the Invite Codes page.
4. **Teacher:** Register at `/register` using the invite code. Select your school.
5. **Admin:** Assign the teacher to their section(s) via the Sections tab → Assign button.
6. **Students:** Register at `/register`, select their school and section.
7. **Admin or Teacher:** Create modules and assign them to sections.
8. **Admin:** Create pre-test and post-test sets, assign them to sections.

---

## 2. Admin Guide

### 2.1 Logging In

1. Navigate to `/admin/login`.
2. Enter your admin email and password.
3. You will be redirected to `/admin` (the admin dashboard).

> **Tip:** The admin login page is separate from the student/teacher login. If you navigate to `/login` as an admin, you will still be redirected to `/admin` after authentication.

---

### 2.2 Dashboard Overview

The admin dashboard (`/admin`) is divided into a **sidebar** and a **content area**.

**Sidebar sections:**
- **Dashboard** — tabs for Overview, Users, Modules, Sections, Schools, System
- **Models** — direct links to Contexts, Invite Codes, Test Sets pages
- **App Views** — link to the Application Workflow diagram

**Overview tab** shows:
- Total users (students, teachers), modules, sections, schools
- Pending grades count
- Recent activity feed (new registrations, completions, pending grades)
- System health (database connection status, active sessions)

**Switching tabs:**  
Click any item in the sidebar **Dashboard** section to switch content areas.

---

### 2.3 Managing Users

Navigate to the **Users** tab in the sidebar.

#### View Users
- All registered users are listed in a searchable table.
- Filter by role using the role badges, or search by name or email.

#### Create a New User
1. Click **+ Create User** (or go to `/admin/users/new`).
2. Fill in: Name, Email, Password, Role (STUDENT / TEACHER / ADMIN).
3. For students, optionally assign a school and section.
4. Click **Create User**. No invite code is required when creating from the admin panel.

#### Edit a User
1. Click the user's name in the table to open their detail page (`/admin/users/[id]`).
2. Update name, email, or role.
3. Click **Save Changes**.

> **Note:** You cannot edit or delete other admin accounts to prevent lockout.

#### Reset a User's Password
1. Open the user's detail page.
2. Click **Reset Password**.
3. Enter and confirm the new password.
4. All of the user's active sessions will be revoked immediately.

#### Revoke All Sessions
1. Open the user's detail page.
2. Click **Revoke Sessions**.
3. The user will be logged out from all devices on their next request.

#### Reset a Student's Module Progress
1. Open the student's detail page.
2. Find the module in the **Progress** section.
3. Click the **Reset** button next to the module.
4. This deletes the student's `ModuleProgress`, all `StageResponse` records, and the `DiagnosticReport` for that module. The student may restart from Stage 1.

---

### 2.4 Managing Schools & Sections

#### Schools Tab
1. Click **Schools** in the sidebar.
2. Click **+ Add School** to create a new school (name and optional address).
3. Each school card shows its sections and enrolled student count.
4. Click **✏️ Edit** to update the school name, address, or active status.
5. Click **🗑️** to delete. Deletion is blocked if sections or students are linked.

#### Sections Tab
1. Click **Sections** in the sidebar.
2. Click **+ Add Section** to create a section. Fill in name, emoji, grade level, school year, and school.
3. Each section card shows:
   - Current teacher assignment
   - Active module
   - Student count
   - Active / Inactive status

#### Assigning a Teacher to a Section
1. Open the Sections tab.
2. Find the section card and click the small **👤 Assign** button next to the teacher name.
3. A dropdown appears with all registered teachers.
4. Select a teacher (or "— Unassigned —" to remove the assignment).
5. Click **Save**.

> **Note:** A teacher can manage multiple sections. Use the Users tab → User Detail → **Assign Sections** for a teacher-centric view.

---

### 2.5 Managing Modules

Navigate to the **Modules** tab in the sidebar.

The module list is a **compact sortable data table** with columns: Module (icon + title + context/subtitle), Status, Stages, Completions, Sections, Time, and Actions. Click any column header to sort ascending; click again to sort descending.

#### Search & Filter
- Use the search bar to find modules by title.
- Use the status filter pills (All / Active / Draft / Archived) to narrow results.
- A result count is shown next to the filter pills.

#### Edit Module Metadata
1. Find the module row and click **✏️ Edit**.
2. A **centered dialog modal** opens (press Esc or click Cancel to close).
3. Fields are laid out in a grid:
   - **Row 1:** Icon | Title | Subtitle
   - **Row 2:** Context | Status | Grade Level | Time
   - **Row 3:** Lock toggle (and Unlock After field when locked)
   - **Row 4:** Banner image upload
   - **Row 5:** Scenario rich text editor (bold, italic, lists supported)
4. Click **Save Changes**.

#### Assign a Module to Sections
1. Find the module and click **📌 Assign**.
2. A modal opens showing all sections grouped by school.
3. Check the sections you want to assign the module to.
   - Click a **school checkbox** to select/deselect all sections in that school at once.
4. Optionally set a **Due Date**.
5. Click **Save Assignments**.

> **Important:** This is a **set-based replace** — any sections previously assigned but not checked will be unassigned.

#### Edit Stages
1. Click **📋 Stages** on a module row.
2. You are taken to the stage editor (`/admin/modules/[id]/stages`).
3. Select a stage from the list and edit its content, type, options, and answer key.

#### Add Scenario Questions
1. Click **📝 Scenario Question** on a module row.
2. You are taken to the Scenario Questions editor (`/admin/modules/[id]/quiz`).
3. Add questions that will be shown to students automatically after they complete Stage 12.
4. Click **Save Questions**.

#### Delete a Module
1. Click **🗑️ Delete** on the module row.
2. A **confirmation dialog** opens (Esc-to-close, focus-trapped). It shows the number of student completions.
3. Confirm to permanently delete the module and all its stages, student responses, progress records, diagnostic reports, and scenario question data.

---

### 2.6 Creating a New Module

1. In the Modules tab, click **＋ New Module** (top-right).
2. You are taken to the 3-step module creation wizard at `/admin/modules/new`.

**Step 1 — Module Info:**
- Enter the module title.
- (Optional) **Upload a banner image** — drag-and-drop or click-to-upload. Max 4 MB. The image is shown on module cards and at the top of the scenario section inside each stage.
- Write the **Scenario** using the **rich text editor** — bold, italic, underline, bullet lists, ordered lists, and blockquotes are supported.
- Select a context from the colored tiles (these come from the ScenarioContext database).
  - To add a new context, click **+ New context** and fill in the label, icon, color, and description.
- Set the estimated time in minutes.
- Click **Next: Configure Stages →**.

**Step 2 — 12 Stages:**
- The left sidebar lists all 12 stages with phase color coding:
  - 🔵 **Understanding** — Stages 1–3
  - 🟣 **Analysis** — Stages 4–7
  - 🟠 **Solution** — Stages 8–10
  - 🟢 **Reflection** — Stages 11–12
- Click a stage in the sidebar to edit it.
- For each stage, set:
  - **Title** — the stage name shown to students
  - **Question / Instruction** — what the student must do
  - **Mode** — every stage must use one of exactly **3 types**:

| Mode | Label | How students answer | Auto-scored? |
|------|-------|---------------------|--------------|
| 🔘 **Multiple Choice** | Multiple Choice | Select one option from up to 6 cards (set the correct choice) | ✅ Yes |
| 🔀 **Arrangement** | Arrangement of Order | Drag items into the correct order using the ⠿ handle | ✅ Yes |
| ✏️ **Answer Input** | Open Input Text | Type a free-text or numeric answer (set an answer key for auto-scoring) | ✅ if answer key set; ✍️ teacher-graded if left blank |

  - **Answer Key** — required for Multiple Choice and Arrangement; optional for Answer Input
  - **Hint** (optional) — shown based on difficulty setting
  - **Max Score** — points awarded for a correct answer
- A green ✓ appears in the sidebar when a stage has a question entered.
- Click **Review →** (bottom of sidebar) when all 12 stages are filled.

**Step 3 — Review & Publish:**
- Review the module summary and stage table.
- Choose:
  - **Save as Draft** — saves as DRAFT status (not visible to students)
  - **✓ Publish Module** — saves as ACTIVE status (visible to assigned sections)
- After saving, you are returned to `/admin`.

> **Note:** After publishing, you can add scenario questions via the **📝 Scenario Question** button on the module row. These questions appear to students automatically after they complete Stage 12.

---

### 2.7 Managing Test Sets

Navigate to `/admin/test-sets` via the sidebar **Models → Test Sets**.

#### The Test Sets Table
The table shows all pre-tests and post-tests with sortable columns:
- Click any column header (**Title, Type, Q's, Results, Sections, Time**) to sort ascending; click again to sort descending.
- Use the **search bar** to filter by title or linked module.
- Use the **type filter pills** (All / Pre-Tests / Post-Tests) to narrow results.
- The **Sections** column shows a green badge with how many sections the test is assigned to.

#### Create a New Test Set
1. Click **+ New Test Set** in the top-right.
2. Fill in:
   - **Title** (required)
   - **Type** — Pre-Test or Post-Test
   - **Linked Module** (optional) — associates this test with a module for the teacher dashboard
   - **Time Limit** in minutes (blank = no limit)
   - **Description** (optional, shown to students)
3. Click **Create**.

#### Manage Questions
1. Click **Questions** on a test set row.
2. You are taken to the question editor (`/admin/test-sets/[id]/questions`).
3. Click **+ Add Question** to create a question. Fill in:
   - Question number (1–20)
   - Context (real-world scenario label)
   - Question text
   - Correct answer
   - Answer type (number / text / time / multiple choice)
   - For multiple choice: enter 4 choices and mark the correct one
   - Difficulty (easy / average / difficult)
   - Points (default 1)
4. Click **Save Question**.

#### Assign a Test Set to Sections
1. Click **📌 Assign** on a test set row.
2. A modal opens showing all sections grouped by school.
3. Check the sections that should have access to this test.
4. Click **Save Assignments**.

> Students in assigned sections will see this test in their dashboard. Assignment is set-based (unchecked sections lose access).

#### Reset Student Progress
1. Click **🔄** (Reset) on a test set row.
2. A confirmation modal shows the number of student results to be deleted.
3. Click **Yes, Reset Progress** to delete all student results. Students can then retake the test.

> **Note:** The Reset button is disabled if the test has no results.

#### Toggle Active/Inactive
- Click the toggle switch in the **Active** column to enable or disable the test set.
- Inactive test sets are not shown to students.

---

### 2.8 Managing Contexts & Invite Codes

#### Scenario Contexts (`/admin/contexts`)
Contexts define the real-world problem domain of a module (e.g., "Barangay Feeding Program").

1. Click **+ Create Context**.
2. Fill in:
   - **Key** — unique identifier in UPPER_SNAKE_CASE (immutable after creation)
   - **Label** — display name (e.g., "Feeding Program")
   - **Description** — short subtitle shown under the label
   - **Icon** — emoji representing the context
   - **Color** — hex color for badges and highlights
   - **Sort Order** — controls display order in pickers
3. Use the **Active** toggle to hide a context from module creation without deleting it.
4. Delete is blocked if any module currently references the context key.

#### Teacher Invite Codes (`/admin/invite-codes`)
Invite codes allow teachers to self-register without admin intervention.

1. Click **+ Generate Code**.
2. Optionally add a **label** (e.g., "Batch 2026-A") and an **expiry date**.
3. The generated code is in the format `TSR-XXXX-XXXX`.
4. Share this code with the teacher. They enter it during registration at `/register`.
5. Once used, the code shows the teacher's name and the date it was redeemed.
6. Toggle **Active** to revoke an unused code without deleting it.

---

### 2.9 System Tools

Navigate to the **System** tab in the sidebar.

#### Export All Data
- Click **Export** to download a complete JSON file of all modules (with stages), student progress, stage responses, and diagnostic reports.
- The file is named `tsr-export-YYYY-MM-DD.json`.

#### Clear Expired Sessions
- Click **Clear** to remove all expired JWT session records from the database.
- Active (non-expired) sessions are not affected.

#### View Database Status
- The System tab shows whether the database is connected, how many sessions are active, and how many stage responses and pending grades exist.

---

## 3. Teacher Guide

### 3.1 Registering & Logging In

#### Registering
1. Go to `/register`.
2. Select **I'm a Teacher** using the role toggle at the top.
3. **Step 1 — Account Info:** Enter your first name, last name, email, and password.
4. Click **Next — Identity →**.
5. **Step 2 — Verify Your Access:**
   - Select your **school** from the dropdown (populated from the database).
   - Enter your **subject / department**.
   - Enter the **teacher invite code** provided by your administrator.
6. Click **📋 Create Classroom**.
7. You are logged in and redirected to `/dashboard/teacher`.

> **Note:** You must have a valid invite code from your school admin. Contact your administrator if you do not have one.

#### Logging In
1. Go to `/login`.
2. Make sure the **I'm a Teacher** tab is selected.
3. Enter your email and password.
4. Click **Sign In**.

---

### 3.2 Dashboard Home

The teacher dashboard (`/dashboard/teacher`) shows:

- **Class Statistics** — total students, completed modules, active students, pending grades count.
- **Module Progress Overview** — a card for each assigned module showing overall completion percentage and cluster averages.
- **Diagnostic Heatmap** — a color-coded grid of all students × diagnostic clusters, making intervention needs visible at a glance.
- **Pending Grades Badge** — a red badge in the sidebar shows how many open-ended responses are waiting for manual grading.

**Sidebar Navigation:**
| Icon | Section | Description |
|------|---------|-------------|
| 🏠 | Dashboard | Home overview |
| 👥 | My Students | Student list + progress |
| 📦 | Modules | Module management |
| 📊 | Reports | Class diagnostic reports |
| 📝 | Tests | Pre/post test results |
| ✍️ | Grade Queue | Pending open-ended responses |
| 🏷️ | Contexts | Manage scenario contexts |
| 👤 | Profile | Edit your account |

---

### 3.3 Viewing Student Progress

#### Student List (`/dashboard/teacher/students`)
- The page uses a **datatable** with per-section tabs at the top. Use the **live search** bar to filter by name, click column headers to sort, and page through results (10 rows per page).
- Click **👤 Profile** on any row to open a **student profile drawer** showing their avatar, XP/level, current module progress, and quick links to their full report and open responses.
- Click a student's name to open their full detail page.

#### Student Detail (`/dashboard/teacher/students/[studentId]`)
- Shows the student's profile, XP/level, and all stage responses for each module.
- Each stage response shows: the student's answer, auto-score (if applicable), teacher score (if graded), and time spent.
- Open-ended responses can be graded directly from this page (see Section 3.4).

#### Module Cards (Modules Tab)
- Each module card on the Modules page shows a list of student rows with:
  - Avatar, name, and current stage
  - Status badge: ✅ Done / ⏳ In Progress / ⚠️ Stuck / ○ Not Started
- Click any student row to open a **progress drawer** showing:
  - Overall score and time spent
  - Cluster scores (Understanding / Analysis / Solution / Reflection)
  - Stage-by-stage breakdown with individual scores

---

### 3.4 Grading Open-Ended Responses

#### From the Grade Queue (`/dashboard/teacher/grade`)
1. Click **✍️ Grade Queue** in the sidebar.
2. All pending open-ended responses are listed with: student name, module, stage number, and the student's answer.
3. Click **Grade** on a response.
4. Enter a **score** (0 to the stage's max score).
5. Optionally add a **teacher note** (feedback shown to the student in their report).
6. Click **Save Grade**.
7. The response moves out of the queue.

#### From Student Detail
1. Open a student's detail page.
2. Find the open-ended response.
3. Click **Grade** and follow the same steps above.

> **Tip:** Of the 3 stage types, only **Answer Input** stages with no answer key require manual grading. Multiple Choice and Arrangement stages are always auto-scored. Answer Input stages with an answer key set are also auto-scored.

---

### 3.5 Managing Modules

Navigate to **📦 Modules** in the sidebar. The page has three tabs:

#### Assigned Modules Tab
Shows all modules currently assigned to your sections with student progress data. Each module card shows:
- **Banner image** at the top (when uploaded)
- Rich-text scenario snippet (HTML stripped for plain-text preview)
- **Per-section completion bars** — when you manage multiple sections, each section's completion percentage is shown separately
- **Pre/post test chips** — blue for pre-test, purple for post-test. Click a chip to edit the linked test, or click **+ Link** to create one.

**Action buttons on each card:**
- 📊 **View Reports** → opens the class diagnostic reports page for this module
- ✍️ **Grade Items** → opens the grade queue filtered to this module
- 🗄 **Archive** → archives the module (removes it from student view)

#### Module Library Tab
Shows only modules **assigned to your sections or drafts you created**.
- Filter by **Active** or **Draft** status.
- **Draft modules** appear with an amber border and an **✅ Activate Module** button. Clicking Activate makes the module active and auto-assigns it to all your sections.

#### Pre/Post Results Tab
Shows a per-module table of all students' pre-test and post-test scores with gain calculations.

---

### 3.6 Creating a New Module

1. In the Modules tab, click **+ New Module** (top-right).
2. You are taken to the 3-step creation wizard at `/dashboard/teacher/modules/new`.

**Step 1 — Module Info:**
- Enter the module title.
- (Optional) **Upload a banner image** — drag-and-drop or click-to-upload. Max 4 MB. Shown on module cards and at the top of the scenario section inside each stage.
- Write the **Scenario** using the **rich text editor** — bold, italic, underline, bullet lists, ordered lists, and blockquotes are supported.
- Select a context tile. Click **+ New context** to add a new one inline.
- Set the estimated time in minutes.
- Click **Next: Configure Stages →**.

**Step 2 — 12 Stages:**
Click each stage in the left sidebar. Every stage must have a question and one of the following **3 types**:

| Mode | How students answer | Auto-scored? |
|------|---------------------|--------------|
| 🔘 **Multiple Choice** | Select one of up to 6 option cards | ✅ Yes |
| 🔀 **Arrangement** | Drag items into the correct order | ✅ Yes |
| ✏️ **Answer Input** | Type a text or numeric answer | ✅ if answer key set; ✍️ teacher-graded if blank |

Also set: **Title**, **Instruction**, **Answer Key**, optional **Hint**, and **Max Score** per stage.

**Step 3 — Review & Publish:**
- **◐ Save as Draft** — module is private, not assigned to any section. Access it later from the Library tab.
- **✓ Publish Module** — module becomes Active and is automatically assigned to all your sections.

> **Note:** At the bottom of the module edit page (`/dashboard/teacher/modules/[id]/edit`), the **Scenario Questions** section lets you add questions that appear to students after they complete all 12 stages. Click **Save Questions** to save them.

---

### 3.7 Pre/Post Test Results

Navigate to **📝 Tests** in the sidebar.

- Only test sets **assigned to your sections** are shown.
- The **Results** tab shows all students' pre-test and post-test scores for each module, including:
  - Raw score (e.g., 14/20)
  - Percent score
  - Date taken
  - **Gain** — the percentage point difference between pre and post scores (shown in green if positive)
- The **Manage** tab lets you create, edit, or delete test sets for your class.

> **Note:** When you create a test, it is automatically assigned to your active sections but starts **inactive**. Activate it from the Tests page when you are ready for students to take it. Each test can be **linked to a module** (set the Linked Module field during creation or editing) — linked tests appear as chips on the module card in the Modules tab. The Context / Scenario dropdown is populated from the database.

---

### 3.8 Class Reports & Diagnostics

Navigate to **📊 Reports** in the sidebar.

#### Class Reports (`/dashboard/teacher/reports`)
- Shows all students in your sections with their overall diagnostic performance.
- Each row shows: student name, section, module, overall score, and per-cluster scores (color-coded).
- Students flagged for **intervention** (any cluster below 60%) are highlighted with a warning.

#### Individual Student Report (`/dashboard/teacher/reports/[studentId]`)
1. Click a student's name in the class reports list.
2. The detailed report shows:
   - **Hero card** with overall percent score and **cross-module average bars** for each diagnostic cluster (Understanding / Analysis / Solution / Reflection)
   - Four cluster bar charts with proficiency badges
   - **Stage breakdown table** — **Type** column shows the stage type label; **Result** column shows ✓ Correct, ✗ Incorrect, a percentage score, or ⏳ Pending. Stage titles come from the actual module stage data.
   - Any teacher intervention notes

**Report actions:**
- **⬇️ Export PDF** — downloads a PDF file directly to your device (no print dialog). Uses html2canvas + jsPDF.
- **🖨️ Print** — opens the browser print dialog.

---

### 3.9 Managing Learning Contexts

Navigate to **🏷️ Contexts** in the sidebar.

Contexts are the real-world problem domains used when creating modules (e.g., "Sari-Sari Store", "School Garden").

1. Click **+ New Context**.
2. Fill in the label, description, emoji icon, and color.
3. The system auto-generates a key from the label.
4. Click **Create**.

> Contexts you create are available in the module creation wizard for all teachers. Deleting a context is blocked if any module currently uses it.

---

## 4. Student Guide

### 4.1 Registering & Logging In

#### Registering
1. Go to `/register`.
2. Select **I'm a Student** using the role toggle at the top (this is the default).
3. **Step 1 — Account Info:** Enter your first name, last name, email, and password.
   - The password strength meter shows when your password is strong enough.
4. Click **Next — Identity →**.
5. **Step 2 — Tell us about yourself:**
   - Select your **school** from the list.
   - Select your **section** (the list updates based on your chosen school).
6. Click **⚔️ Begin My Quest!**.
7. You are taken to the onboarding setup.

#### Logging In
1. Go to `/login`.
2. Select **I'm a Student** (the default tab).
3. Enter your email and password.
4. Click **Sign In**.
5. If your account setup is not complete, you will be redirected to onboarding first.

---

### 4.2 Onboarding Setup

After registering, you will complete a one-time setup:

**Choose Your Avatar:**
- Select from 10 characters: Wizard, Elf, Hero, Champion, Explorer, Fox, Dragon, Lion, Eagle, or Wolf.
- Each avatar has a unique emoji and display name shown throughout the system.

**Choose Your Difficulty:**
| Level | Description |
|-------|-------------|
| 🥉 **Apprentice** | Hints are always visible — best if you want extra support |
| 🥈 **Adventurer** | Hints are available on request — the recommended setting |
| 🥇 **Champion** | No hints — for students who want the hardest challenge |

> **Tip:** Your difficulty setting affects whether hints are shown during stages. You can change it later in your Profile.

After selecting both, click **Begin Your Quest!**. You are taken to the student dashboard.

---

### 4.3 Student Dashboard

The student dashboard (`/dashboard/student`) shows:

- **Your Avatar & Stats** — name, avatar, level, XP bar, and streak.
- **Active Modules** — your currently assigned modules with stage progress bars and status badges.
- **Quick Stats** — stages completed, total XP earned, and current level.

**Navigation (top bar):**
| Link | Page |
|------|------|
| My Modules | Full module list |
| Pre-Test | Take the pre-assessment |
| Post-Test | Take the post-assessment (unlocks after module completion) |
| Reports | View diagnostic reports |
| Achievements | View earned badges |
| Profile | Edit your account |

---

### 4.4 Taking the Pre-Test

> The pre-test measures your knowledge **before** working through a module. Take it before starting any module stages.

1. Click **Pre-Test** in the navigation bar (or go to `/dashboard/student/pre-test`).
2. Read the instructions carefully.
3. The test consists of up to **20 questions** drawn from real-world mathematics scenarios.
4. Questions may be:
   - **Numeric** — type a number as your answer
   - **Text** — type a short word or phrase
   - **Time** — enter a time value (e.g., "2:30")
   - **Multiple Choice** — select one of four options (A/B/C/D)
5. If a time limit is set, a countdown timer appears at the top.
6. Click **Submit Test** when done.
7. You can only submit the pre-test **once**. Your score is shown after submission.

> **Note:** You cannot retake the pre-test once submitted unless your teacher or admin resets your results.

---

### 4.5 Working Through a Module

#### Selecting a Module
1. Click **My Modules** in the navigation or go to `/dashboard/student/modules`.
2. Your assigned modules are shown as cards. If the module has a **banner image**, it appears at the top of the card (128px height with a gradient overlay). Click a card to open the module detail drawer, which shows the full banner in the header and the scenario rendered as **rich text** (with bold, italic, lists, etc.).
3. Status badges:
   - **Not Started** — click to begin
   - **In Progress** — click to continue from where you left off
   - **Completed** — click to review
   - **Locked** 🔒 — you must complete a previous module before this one unlocks

> **Note:** If the module has a banner image, it also appears inside each stage at the top of the scenario section (with a gradient overlay and a phase-colored bottom border).

#### Starting / Continuing a Stage
1. Click a module to enter it. You are taken to your current stage automatically.
2. The top of the stage page shows:
   - The stage number and phase (e.g., "Stage 3 · Understanding")
   - A 12-pip progress bar color-coded by phase
   - A timer tracking how long you spend on this stage

#### Submitting a Stage
1. Read the question or instruction carefully.
2. Enter your answer using the stage's input method (see Section 4.6 for all types).
3. Click **Submit Answer**.
4. For auto-scored stages, you see your result immediately.
5. For teacher-graded stages, the answer is saved and you move on — your teacher will grade it later.
6. Click **Continue to Stage X →** to move to the next stage.

> **Important:** You can only submit each stage **once**. Review your answer before submitting.

#### After Stage 12 — Scenario Questions
After submitting Stage 12, if the module has **Scenario Questions** configured, they appear immediately. Answer all questions and click **✓ Submit**. After submitting, the Completion Screen shows your score, XP earned, and diagnostic cluster summary. If no scenario questions are configured, the Completion Screen appears right away.

---

### 4.6 Stage Types Explained

All stages in a module are built using one of **3 question types**. Your teacher chooses the type that best fits each thinking skill.

| Type | What you see | How to Answer | Scored by |
|------|-------------|---------------|-----------|
| 🔘 **Multiple Choice** | Up to 6 option cards | Click the card that best answers the question. A highlighted border shows your selection. | Auto (immediate result) |
| 🔀 **Arrangement** | A list of items with drag handles | Drag items into the correct order using the ⠿ handle. #1 at the top is most important. | Auto (immediate result) |
| ✏️ **Answer Input** | A text or number input box | Type your answer. If sentence starter chips are shown, click one to begin your response. | Auto if the teacher set an answer key; otherwise teacher-graded |

> **Note:** Your teacher assigns one of these types to each of the 12 stages based on the thinking skill being assessed for that stage.

**Hints:** If your difficulty is set to Apprentice, hints are always visible. On Adventurer, a 💡 Hint button appears — click it to reveal the hint. On Champion, hints are not available.

---

### 4.7 Viewing Your Diagnostic Report

After submitting Stage 12, the diagnostic engine automatically computes your performance across four clusters.

#### Accessing the Report
1. After Stage 12, you see a **Completion Screen** with your score, XP earned, and cluster summary.
2. Click **View Full Report** or go to **Reports** in the navigation.
3. Click the module name to open the detailed report.

#### Reading the Report
The diagnostic report shows:

**Cluster Scores:**
| Cluster | Stages | Color |
|---------|--------|-------|
| Understanding | 1–3 | 🔵 Blue |
| Analysis | 4–7 | 🟣 Purple |
| Solution | 8–10 | 🟠 Amber |
| Reflection | 11–12 | 🟢 Green |

Each cluster displays a percentage score and a **proficiency level**:
- ✅ **Proficient** — 80% or above
- 📈 **Developing** — 60–79%
- ⚠️ **Struggling** — below 60%

**Stage Breakdown:**
- A table shows every stage with your score, the maximum possible score, and grading status.
- Stages still waiting for teacher grading show a ⏳ icon.

**Intervention Note:**
- If your teacher has written a note, it appears at the top of the report.

---

### 4.8 Taking the Post-Test

> The post-test measures your knowledge **after** completing the module. It becomes available only after your `ModuleProgress` status is **COMPLETED** (all 12 stages submitted).

1. Click **Post-Test** in the navigation bar (or go to `/dashboard/student/post-test`).
2. The test format is the same as the pre-test.
3. After submitting, your teacher can view the comparison of your pre and post scores to measure learning gain.

---

### 4.9 Achievements & Profile

#### Achievements (`/dashboard/student/achievements`)
The achievements page shows badges you have earned across five categories:

| Category | Examples |
|----------|---------|
| 🏆 **Progress** | Complete your first stage, complete 5 stages, finish a module |
| 🎯 **Mastery** | Score 100% on a stage, achieve Proficient in a cluster |
| 📝 **Testing** | Submit a pre-test, submit a post-test |
| ⭐ **XP** | Reach Level 2, Level 5, Level 10 |
| 🔥 **Streak** | Log in 3 days in a row, 7 days in a row |

Locked badges appear grayed out with a description of how to unlock them.

#### Profile (`/dashboard/student/profile`)
Access your profile by clicking your avatar or going to `/dashboard/student/profile`.

You can update:
- **Display Name** — change how your name appears in the system
- **Password** — enter your current password and set a new one
- **Difficulty Level** — change between Apprentice, Adventurer, and Champion at any time

> **Note:** Your email address, section, and school assignment can only be changed by your teacher or admin.

---

## Appendix — Quick Reference Cards

### Admin Quick Actions

| Task | Where |
|------|-------|
| Create first admin account | `/admin/setup` (one-time) |
| Add a school | Admin Dashboard → Schools tab → + Add School |
| Add a section | Admin Dashboard → Sections tab → + Add Section |
| Assign teacher to section | Admin Dashboard → Sections tab → 👤 Assign |
| Generate invite code | `/admin/invite-codes` → + Generate Code |
| Create module | Admin Dashboard → Modules tab → ＋ New Module |
| Assign module to sections | Admin Dashboard → Modules tab → 📌 Assign |
| Add scenario questions to a module | Admin Dashboard → Modules tab → 📝 Scenario Question |
| Create test set | `/admin/test-sets` → + New Test Set |
| Assign test to sections | `/admin/test-sets` → 📌 Assign |
| Reset student test results | `/admin/test-sets` → 🔄 Reset |
| Reset student module progress | Admin → Users → [Student] → Progress → Reset |
| Export all data | Admin Dashboard → System tab → Export |

### Teacher Quick Actions

| Task | Where |
|------|-------|
| View pending grades | Sidebar → ✍️ Grade Queue |
| Grade a response | Grade Queue → Grade, or Student Detail → Stage → Grade |
| Create a module | Modules → + New Module → fill info + banner (optional) + 12 stages → Publish or Save as Draft |
| Add scenario questions | Teacher Modules → Edit module → Scenario Questions section at bottom → Save Questions |
| Link a test to a module | Tests → Create Test → set Linked Module field, OR Modules → module card → + Link pre-test / + Link post-test |
| Activate a draft module | Modules → Library tab → Draft card → ✅ Activate Module |
| View student profile | Students → 👤 Profile button on any row |
| View class diagnostic | Sidebar → 📊 Reports |
| Export student report as PDF | Reports → [Student] → ⬇️ Export PDF |
| View pre/post test scores | Sidebar → 📝 Tests → Results tab |
| See students needing help | Dashboard home → Heatmap (red/amber cells = struggling) |

### Student Quick Actions

| Task | Where |
|------|-------|
| Continue a module | Dashboard → Active Modules → Click module |
| Take pre-test | Navigation → Pre-Test |
| Take post-test (unlocks after module completion) | Navigation → Post-Test |
| Answer scenario questions (appear automatically after Stage 12 if configured) | Module → Stage 12 → submit → Scenario Questions page → Submit |
| View diagnostic report | Navigation → Reports → Click module |
| Change difficulty | Navigation → Profile → Difficulty |
| View earned badges | Navigation → Achievements |
