"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────
type Role = "admin" | "teacher" | "student";

// ─── Role config ───────────────────────────────────────────────
const ROLES: { key: Role; label: string; icon: string; color: string; bg: string; border: string; desc: string }[] = [
  {
    key: "admin", label: "Admin", icon: "⚙️", color: "#8B5CF6",
    bg: "bg-[#EDE9FE] dark:bg-[#2e1065]", border: "border-[#8B5CF6]",
    desc: "Set up the system, manage users, modules, test sets, and monitor everything.",
  },
  {
    key: "teacher", label: "Teacher", icon: "📋", color: "#4A9B7F",
    bg: "bg-[#D1FAE5] dark:bg-[#064e35]", border: "border-[#4A9B7F]",
    desc: "Register, create modules, grade responses, and track your students' progress.",
  },
  {
    key: "student", label: "Student", icon: "🎒", color: "#3B82C4",
    bg: "bg-[#DBEAFE] dark:bg-[#1e3a5f]", border: "border-[#3B82C4]",
    desc: "Register, take tests, work through module stages, and view your diagnostic report.",
  },
];

// ─── Step data ──────────────────────────────────────────────────
type Step = {
  id:        string;
  icon:      string;
  title:     string;
  summary:   string;
  steps:     string[];
  tips?:     string[];
  note?:     { text: string; color: "amber" | "red" | "green" };
  urlLabel?: string;
};

const ADMIN_STEPS: Step[] = [
  {
    id: "a1",
    icon: "🔐",
    title: "Log In as Admin",
    summary: "Access the admin panel using your admin credentials.",
    urlLabel: "/admin/login",
    steps: [
      'Navigate to <code class="mono">/admin/login</code>.',
      "Enter your admin email and password.",
      'Click <strong>Sign In</strong>. You will be redirected to <code class="mono">/admin</code>.',
    ],
    tips: ["The default seed admin is admin@tsr.edu / Admin1234! — change this immediately on a live server."],
  },
  {
    id: "a2",
    icon: "🏫",
    title: "Create Schools & Sections",
    summary: "Set up the schools and class sections students will belong to.",
    steps: [
      "In the sidebar go to the <strong>Sections</strong> tab.",
      "Click the <strong>Schools</strong> sub-tab → <strong>+ Add School</strong> → enter name and address → <strong>Save</strong>.",
      "Switch to the <strong>Sections</strong> sub-tab → <strong>+ Add Section</strong>.",
      "Fill in: section name, emoji, grade level, school year, and school. Click <strong>Save</strong>.",
      "Repeat for every class section needed.",
    ],
    tips: ["Create all schools first so they appear in the section school dropdown."],
  },
  {
    id: "a3",
    icon: "🔑",
    title: "Generate Teacher Invite Codes",
    summary: "Teachers need a valid invite code to self-register. Generate one here.",
    urlLabel: "Models → Invite Codes",
    steps: [
      "In the sidebar go to <strong>Models → Invite Codes</strong>.",
      "Click <strong>+ Generate Code</strong>.",
      'Optionally add a label (e.g., "Batch 2026-A") and an expiry date.',
      'Click <strong>Generate</strong>. The code in the format <code class="mono">TSR-XXXX-XXXX</code> appears in the list.',
      "Share the code with the teacher via email or messaging.",
    ],
    note: { text: "Each code can be used only once. Generate a new code for each teacher.", color: "amber" },
  },
  {
    id: "a4",
    icon: "👥",
    title: "Manage Users",
    summary: "Create, edit, and reset users directly from the admin dashboard.",
    steps: [
      "Go to the <strong>Users</strong> tab.",
      "Click <strong>+ Create User</strong> → fill in Name, Email, Password, and Role (STUDENT / TEACHER / ADMIN).",
      "For students, optionally assign a school and section from the same form.",
      "Click <strong>Create User</strong>.",
      "To edit a user, click their name in the table, change the fields, and click <strong>Save Changes</strong>.",
      "To reset a password: open the user → <strong>Reset Password</strong> → enter and confirm the new password.",
      "To force-logout everywhere: open the user → <strong>Revoke Sessions</strong>.",
    ],
    tips: ["Admin accounts cannot be edited by other admins — only the owning admin can change their own details."],
  },
  {
    id: "a5",
    icon: "👤",
    title: "Assign Teachers to Sections",
    summary: "Link each teacher to the section(s) they manage so their dashboard populates correctly.",
    steps: [
      "Go to the <strong>Sections</strong> tab.",
      "Find the section card and click the <strong>👤 Assign</strong> button next to the teacher name.",
      "Select the teacher from the dropdown and click <strong>Save</strong>.",
      "Repeat for every section that needs a teacher assigned.",
    ],
    tips: ["A teacher sees only the sections assigned to them. Assign them before they log in for the first time."],
  },
  {
    id: "a6",
    icon: "🏷️",
    title: "Set Up Scenario Contexts",
    summary: "Contexts are the real-world domains (e.g., Sari-Sari Store) used when creating modules.",
    urlLabel: "Models → Contexts",
    steps: [
      "Go to <strong>Models → Contexts</strong>.",
      "Click <strong>+ New Context</strong>.",
      "Fill in: Key (UPPER_SNAKE_CASE, permanent), Label, Description, Icon (emoji), Color, and Sort Order.",
      "Click <strong>Create Context</strong>.",
    ],
    note: { text: "The Key is immutable after creation — choose it carefully, e.g., SARI_SARI_STORE.", color: "amber" },
  },
  {
    id: "a7",
    icon: "📦",
    title: "Create a Module",
    summary: "Build the 12-stage problem-solving module students will work through.",
    urlLabel: "Modules → + New Module",
    steps: [
      "Go to the <strong>Modules</strong> tab and click <strong>+ New Module</strong>.",
      "<strong>Step 1 — Info:</strong> Enter a title; optionally upload a banner image (max 4 MB); write the scenario in the rich-text editor; select a context tile; set the estimated time.",
      "<strong>Step 2 — 12 Stages:</strong> Click each stage number in the sidebar. For each stage choose a mode — <strong>Multiple Choice</strong>, <strong>Arrangement</strong> (drag-to-rank), or <strong>Answer Input</strong>. Fill in the title, instruction, optional hint, and max score. For Multiple Choice mark the correct option; for Arrangement set the correct order; for Answer Input optionally set an answer key for auto-scoring.",
      "<strong>Step 3 — Review:</strong> Check the stage summary table. Click <strong>Save as Draft</strong> (private) or <strong>✓ Publish Module</strong> (makes it Active).",
      "After publishing, click <strong>📌 Assign</strong> on the module row to assign it to sections.",
    ],
    tips: [
      "All 12 stages need a question before you can publish.",
      "Add Scenario Questions (shown after Stage 12) via the 📝 Scenario Question button on the module row.",
    ],
  },
  {
    id: "a8",
    icon: "📝",
    title: "Create & Assign Test Sets",
    summary: "Build pre-tests and post-tests, add questions, then assign to sections.",
    urlLabel: "Models → Test Sets",
    steps: [
      "Go to <strong>Models → Test Sets</strong>.",
      "Click <strong>+ New Test Set</strong> → fill in Title, Type (PRE / POST), linked module (optional), time limit, and description → <strong>Create</strong>.",
      "On the new row click <strong>Questions</strong> → <strong>+ Add Question</strong>.",
      "Fill in the question number, context, question text, answer type, and correct answer. For Multiple Choice enter four options and click the correct letter. Click <strong>Add Question</strong>. Repeat for all questions.",
      "When ready, click <strong>📌 Assign</strong> on the test set row, select sections, and click <strong>Save Assignments</strong>.",
      "Toggle the <strong>Active</strong> switch on the test set to make it visible to students.",
    ],
    note: { text: "Test sets start inactive — students cannot see them until you toggle Active on.", color: "amber" },
  },
  {
    id: "a9",
    icon: "📊",
    title: "Monitor & Export Data",
    summary: "Keep an eye on usage and export a full data snapshot when needed.",
    steps: [
      "The <strong>Overview</strong> tab shows total users, modules, sections, pending grades, and a live activity feed.",
      "The <strong>Users</strong> tab lets you drill into individual progress and reset module attempts.",
      "Go to the <strong>System</strong> tab → <strong>Export All Data</strong> to download a dated JSON snapshot of all modules, progress, responses, and diagnostics.",
      "Use <strong>Clear Expired Sessions</strong> in the System tab to clean up stale auth records.",
    ],
  },
];

const TEACHER_STEPS: Step[] = [
  {
    id: "t1",
    icon: "📝",
    title: "Register as a Teacher",
    summary: "Create your teacher account using the invite code from your admin.",
    urlLabel: "/register",
    steps: [
      'Go to <code class="mono">/register</code> and select <strong>I\'m a Teacher</strong>.',
      "Enter First Name, Last Name, Email, and Password. Click <strong>Next</strong>.",
      "Select your <strong>School</strong> from the dropdown.",
      "Enter your <strong>Subject / Department</strong>.",
      'Enter the <strong>Teacher Invite Code</strong> (format: <code class="mono">TSR-XXXX-XXXX</code>) provided by your admin.',
      "Click <strong>📋 Create Classroom</strong>.",
    ],
    tips: ["Contact your admin if you do not have an invite code — codes are single-use."],
  },
  {
    id: "t2",
    icon: "🔐",
    title: "Log In",
    summary: "Sign in to access your teacher dashboard.",
    urlLabel: "/login",
    steps: [
      'Go to <code class="mono">/login</code> and select the <strong>I\'m a Teacher</strong> tab.',
      "Enter your email and password.",
      "Click <strong>Sign In</strong>. You will land on your <strong>Dashboard</strong>.",
    ],
  },
  {
    id: "t3",
    icon: "🏠",
    title: "Explore Your Dashboard",
    summary: "Get familiar with the sidebar and the key sections of your workspace.",
    steps: [
      "The <strong>Dashboard</strong> home shows class-wide stats: total students, average scores, a diagnostic heatmap, and pending grades count.",
      "Use the sidebar to navigate: <strong>My Students, Modules, Reports, Tests, Grade Queue, Contexts,</strong> and <strong>Profile</strong>.",
      "The red badge on <strong>Grade Queue</strong> tells you how many open-ended responses are waiting.",
    ],
    tips: ["If your dashboard is empty, ask your admin to assign your sections to you."],
  },
  {
    id: "t4",
    icon: "📦",
    title: "Create a Module",
    summary: "Build the 12-stage problem-solving module your students will work through.",
    steps: [
      "Go to <strong>📦 Modules</strong> → <strong>Module Library</strong> tab → click <strong>+ New Module</strong>.",
      "<strong>Step 1 — Info:</strong> Enter a title; optionally upload a banner image (max 4 MB); write the scenario in the rich-text editor (bold, italic, lists, blockquote supported); select a context tile; set estimated time.",
      "<strong>Step 2 — 12 Stages:</strong> Click each stage in the sidebar. Choose a mode: <strong>🔘 Multiple Choice</strong> (always auto-scored), <strong>🔀 Arrangement</strong> (always auto-scored), or <strong>✏️ Answer Input</strong> (auto-scored if an answer key is set, teacher-graded if left blank). Fill in Title, Instruction, optional Hint, and Max Score.",
      "<strong>Step 3:</strong> Click <strong>Save as Draft</strong> to keep it private, or <strong>✓ Publish Module</strong> to make it Active and auto-assign it to all your sections.",
    ],
    tips: [
      "All 12 stages must have a question before you can publish.",
      "After creating stages you can add Scenario Questions from the edit page — these appear to students right after Stage 12.",
    ],
  },
  {
    id: "t5",
    icon: "📋",
    title: "Link a Pre-Test & Post-Test",
    summary: "Associate test sets with your module so students can take them before and after.",
    steps: [
      "On the module card, look for the <strong>Pre-Test</strong> and <strong>Post-Test</strong> chips.",
      "If neither exists, click <strong>+ Link</strong> on the chip to create one linked to this module.",
      "Alternatively go to <strong>📝 Tests → Manage</strong> tab → <strong>+ New Test Set</strong> → set Type (PRE or POST) and link it to your module.",
      "Add questions: click <strong>Questions</strong> on the test set row → <strong>+ Add Question</strong> → fill in details → <strong>Add Question</strong>.",
      "When ready, activate the test set by toggling <strong>Active</strong> on — students can now see it.",
    ],
    note: { text: "The post-test only unlocks for a student after they complete all 12 stages of the linked module.", color: "amber" },
  },
  {
    id: "t6",
    icon: "👥",
    title: "Monitor Student Progress",
    summary: "See how each student is progressing through the module stages.",
    steps: [
      "Go to <strong>👥 My Students</strong>. Use the section tabs at the top to switch between your classes.",
      "Use the live search to filter by name. Click any column header to sort the table.",
      "Click <strong>👤 Profile</strong> on a student row to open a side drawer — shows avatar, XP/level, module progress, and quick links.",
      "In the <strong>Modules</strong> tab, click any student row to open a progress drawer with cluster scores and a stage-by-stage breakdown.",
      "Students flagged with <strong>⚠️ Stuck</strong> have at least one cluster below 60% — consider reaching out to them.",
    ],
  },
  {
    id: "t7",
    icon: "✍️",
    title: "Grade Open-Ended Responses",
    summary: "Review and score the Answer Input stages that were left without an answer key.",
    steps: [
      "Go to <strong>✍️ Grade Queue</strong> in the sidebar.",
      "All pending responses are listed with student name, module, stage number, and the student's answer.",
      "Click <strong>Grade</strong> on a response.",
      "Enter a score (0 to the stage's max score). Optionally add a teacher note visible to the student.",
      "Click <strong>Save Grade</strong>. The response is removed from the queue.",
    ],
    note: { text: "After grading Stage 12 the system automatically recalculates that student's diagnostic report.", color: "green" },
  },
  {
    id: "t8",
    icon: "📊",
    title: "View Reports & Diagnostics",
    summary: "Analyse class and individual performance across the four thinking clusters.",
    steps: [
      "Go to <strong>📊 Reports</strong>. All students with completed modules are listed.",
      "Students with any cluster below 60% are highlighted with a <strong>⚠️ intervention flag</strong>.",
      "Click a student's name to open their full diagnostic report: cluster bars with proficiency badges, stage-by-stage breakdown (type, result, score), and any teacher notes.",
      "Use <strong>⬇️ Export PDF</strong> to save the report, or <strong>🖨️ Print</strong> to open the browser print dialog.",
    ],
  },
];

const STUDENT_STEPS: Step[] = [
  {
    id: "s1",
    icon: "📝",
    title: "Register as a Student",
    summary: "Create your student account and join your class section.",
    urlLabel: "/register",
    steps: [
      'Go to <code class="mono">/register</code> — make sure <strong>I\'m a Student</strong> is selected.',
      "Enter your First Name, Last Name, Email, and Password. The password strength meter turns green when it is strong enough.",
      "Click <strong>Next — Identity →</strong>.",
      "Select your <strong>School</strong> from the dropdown. The section list will update automatically.",
      "Click your <strong>Section</strong> tile to select it.",
      "Click <strong>⚔️ Begin My Quest!</strong> — you will be taken to the one-time onboarding setup.",
    ],
  },
  {
    id: "s2",
    icon: "🎨",
    title: "Complete Onboarding",
    summary: "Choose your avatar and difficulty level before entering your dashboard.",
    steps: [
      "<strong>Choose Your Avatar</strong> — pick one of 10 characters: Wizard 🧙, Elf 🧝, Hero 🦸, Champion 🏆, Explorer 🗺️, Fox 🦊, Dragon 🐉, Lion 🦁, Eagle 🦅, or Wolf 🐺.",
      "<strong>Choose Your Difficulty</strong> — Apprentice 🥉 (hints always visible), Adventurer 🥈 (hints on request — recommended), or Champion 🥇 (no hints, hardest challenge).",
      "Click <strong>Save &amp; Enter Dashboard</strong>.",
    ],
    tips: ["You can change your difficulty anytime from your Profile page."],
  },
  {
    id: "s3",
    icon: "🔐",
    title: "Log In",
    summary: "Sign in to access your student dashboard.",
    urlLabel: "/login",
    steps: [
      'Go to <code class="mono">/login</code> and select <strong>I\'m a Student</strong>.',
      "Enter your email and password, then click <strong>Sign In</strong>.",
      "If onboarding is not yet complete you will be redirected there first.",
    ],
  },
  {
    id: "s4",
    icon: "🏠",
    title: "Explore Your Dashboard",
    summary: "Learn the layout so you can find everything quickly.",
    steps: [
      "The dashboard shows your <strong>avatar, level, XP bar</strong>, and any active module cards.",
      "The top navigation links to: <strong>My Modules, Pre-Test, Post-Test, Reports, Achievements,</strong> and <strong>Profile</strong>.",
      "Each module card shows your current stage, a progress bar, and a status badge (Not Started / In Progress / Completed / 🔒 Locked).",
    ],
  },
  {
    id: "s5",
    icon: "📋",
    title: "Take the Pre-Test",
    summary: "Complete the pre-assessment before starting any module stages.",
    urlLabel: "Dashboard → Pre-Test",
    steps: [
      "Click <strong>Pre-Test</strong> in the navigation.",
      "Read the instructions, then answer all questions. Types include: Multiple Choice (A/B/C/D), Numeric, Short Text, and Time (e.g. 2:30).",
      "If a timer is shown, keep an eye on the countdown at the top.",
      "When done, click <strong>Submit Test</strong>.",
    ],
    note: { text: "You can submit the pre-test only once. Review every answer before clicking Submit.", color: "red" },
  },
  {
    id: "s6",
    icon: "📦",
    title: "Start a Module",
    summary: "Open your assigned module and begin working through the stages.",
    steps: [
      "Click <strong>My Modules</strong> in the navigation.",
      "Click a module card with status <strong>Not Started</strong> to open the detail drawer — read the scenario carefully.",
      "Click <strong>Start Module</strong> (or <strong>Continue</strong> if you already started).",
      "You will land on Stage 1. Read the question, enter your answer, and click <strong>Submit Answer</strong>.",
      "Auto-scored stages show your result right away. Teacher-graded stages say \"Saved for review.\"",
      "Click <strong>Continue to Stage X →</strong> to move to the next stage.",
    ],
    note: { text: "You can submit each stage only once — double-check before clicking Submit Answer.", color: "red" },
  },
  {
    id: "s7",
    icon: "🗺️",
    title: "Understand the Stage Types",
    summary: "There are 3 input types across the 12 stages — here is how each one works.",
    steps: [
      "<strong>🔘 Multiple Choice</strong> — Up to 6 option cards appear. Click the card that best answers the question. A highlighted border confirms your selection. Then click Submit Answer.",
      "<strong>🔀 Arrangement</strong> — A list of items with drag handles (⠿). Drag them into the correct order — #1 at the top means most important or first. Then click Submit Answer.",
      "<strong>✏️ Answer Input</strong> — A text or number field. Type your answer; click a sentence-starter chip if one appears to help you begin. Then click Submit Answer.",
    ],
    tips: ["If you are on Apprentice or Adventurer difficulty, look for the 💡 Hint button — it reveals a clue without penalising your score."],
  },
  {
    id: "s8",
    icon: "🏁",
    title: "Complete the Module",
    summary: "Finish all 12 stages and answer any scenario questions at the end.",
    steps: [
      "Work through Stages 1 to 12 in order.",
      "After Stage 12, if the module has <strong>Scenario Questions</strong>, they appear automatically — answer all of them and click <strong>✓ Submit</strong>.",
      "The <strong>Completion Screen</strong> shows your total score, XP earned, and a cluster summary (Understanding, Analysis, Solution, Reflection).",
      "Click <strong>View Full Report</strong> to see your detailed diagnostic report.",
    ],
    note: { text: "The post-test unlocks after you complete all 12 stages. Take it while the material is fresh.", color: "green" },
  },
  {
    id: "s9",
    icon: "📊",
    title: "Take the Post-Test",
    summary: "Complete the post-assessment to measure how much you have learned.",
    urlLabel: "Dashboard → Post-Test",
    steps: [
      "Click <strong>Post-Test</strong> in the navigation (available after module completion).",
      "Answer all questions using the same format as the pre-test.",
      "Click <strong>Submit Test</strong>.",
      "Your teacher can now compare your pre and post scores to see your learning gain.",
    ],
    note: { text: "Like the pre-test, the post-test can only be submitted once.", color: "red" },
  },
  {
    id: "s10",
    icon: "📈",
    title: "Read Your Diagnostic Report",
    summary: "Understand your performance across the four thinking skill clusters.",
    steps: [
      "Go to <strong>Reports</strong> in the navigation.",
      "Click the module name to open its detailed diagnostic report.",
      "The report shows four cluster scores — each with a proficiency badge: <strong>Proficient ≥ 80%</strong>, <strong>Developing 60–79%</strong>, or <strong>Struggling &lt; 60%</strong>.",
      "Scroll down to see a stage-by-stage breakdown including type, your result (✓ Correct / ✗ Incorrect / score%), and any teacher notes.",
    ],
    tips: [
      "Blue = Understanding (Stages 1–3) · Purple = Analysis (4–7) · Amber = Solution (8–10) · Green = Reflection (11–12).",
      "Stages marked ⏳ Pending are still waiting for teacher grading — check back later.",
    ],
  },
  {
    id: "s11",
    icon: "🏆",
    title: "Achievements & Profile",
    summary: "Track your badges, XP level, and keep your profile up to date.",
    steps: [
      "Click <strong>Achievements</strong> in the navigation to see all earned and locked badges across Progress, Mastery, Testing, XP, and Streak categories.",
      "Click <strong>Profile</strong> to update your display name, change your password, or switch difficulty levels.",
      "Your current level and XP bar are always visible at the top of the dashboard.",
    ],
    note: { text: "Your email, section, and school can only be changed by your teacher or admin.", color: "amber" },
  },
];

const STEPS: Record<Role, Step[]> = {
  admin:   ADMIN_STEPS,
  teacher: TEACHER_STEPS,
  student: STUDENT_STEPS,
};

// ─── Small components ──────────────────────────────────────────
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 bg-[#DBEAFE] dark:bg-[#1e3a5f] border border-[#3B82C4]/30 rounded-xl text-sm text-[#1e3654] dark:text-[#DBEAFE]">
      <span className="text-base shrink-0">💡</span>
      <span>{children}</span>
    </div>
  );
}

function Note({ children, color }: { children: React.ReactNode; color: "amber" | "red" | "green" }) {
  const cls = {
    amber: "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B]/30 text-[#3d2800] dark:text-[#FEF3C7]",
    red:   "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C]/30 text-[#450a0a] dark:text-[#FEE2E2]",
    green: "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F]/30 text-[#063c28] dark:text-[#D1FAE5]",
  }[color];
  return (
    <div className={cn("flex gap-2.5 p-3 border rounded-xl text-sm", cls)}>
      <span className="text-base shrink-0">{color === "amber" ? "⚠️" : color === "red" ? "🚫" : "✅"}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Step card ─────────────────────────────────────────────────
function StepCard({ step, index, color }: { step: Step; index: number; color: string }) {
  return (
    <div id={step.id} className="scroll-mt-24 flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>
        <div className="w-px flex-1 mt-2 mb-0" style={{ backgroundColor: color + "33" }} />
      </div>

      {/* Card body */}
      <div className="flex-1 pb-8">
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <span className="text-xl">{step.icon}</span>
          <h2 className="text-lg font-extrabold font-nunito dark:text-white" style={{ color }}>
            {step.title}
          </h2>
          {step.urlLabel && (
            <code className="ml-auto hidden sm:block bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded text-[#3B82C4] font-mono text-[11px]">
              {step.urlLabel}
            </code>
          )}
        </div>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4 leading-relaxed">{step.summary}</p>

        <ol className="space-y-2.5">
          {step.steps.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 text-white"
                style={{ backgroundColor: color + "bb" }}
              >
                {i + 1}
              </span>
              <span
                className="text-sm leading-relaxed text-[#374151] dark:text-[#D1D5DB]"
                dangerouslySetInnerHTML={{ __html: item }}
              />
            </li>
          ))}
        </ol>

        {(step.tips?.length || step.note) && (
          <div className="mt-4 space-y-2">
            {step.tips?.map((t, i) => <Tip key={i}>{t}</Tip>)}
            {step.note && <Note color={step.note.color}>{step.note.text}</Note>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────
export default function StepByStepPage() {
  const [role, setRole]             = useState<Role>("admin");
  const [activeStep, setActiveStep] = useState<string>("");
  const [mobileNav, setMobileNav]   = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentRole = ROLES.find((r) => r.key === role)!;
  const steps       = STEPS[role];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveStep(e.target.id); });
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    );
    steps.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [role, steps]);

  useEffect(() => {
    setActiveStep(steps[0]?.id ?? "");
    contentRef.current?.scrollTo({ top: 0 });
  }, [role, steps]);

  function scrollToStep(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNav(false);
  }

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }
        .mono { background:#F1F5F9; padding:1px 5px; border-radius:4px; color:#3B82C4; font-family:monospace; font-size:0.75rem; }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1628] text-[#1E293B] dark:text-[#F1F5F9] font-nunito">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B1628]/90 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#2D3F55] px-6 h-14 flex items-center gap-4 shadow-sm">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-white text-xs font-black font-nunito">T</div>
            <span className="text-sm font-extrabold font-nunito hidden sm:inline">
              <span className="text-[#3B82C4]">TSR</span> · Math 6
            </span>
          </a>
          <div className="h-4 w-px bg-[#E2E8F0] dark:bg-[#2D3F55]" />
          <span className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">📋 Step-by-Step Guide</span>

          {/* Role pills (desktop) */}
          <div className="hidden md:flex items-center gap-1.5 ml-auto">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                  role === r.key
                    ? `${r.bg} ${r.border}`
                    : "border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] dark:text-[#94A3B8] hover:border-[#3B82C4] hover:text-[#3B82C4]"
                )}
                style={role === r.key ? { color: r.color } : undefined}
              >
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileNav(true)}
            className="md:hidden ml-auto p-2 rounded-lg border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B]">
            ☰
          </button>
        </header>

        {/* Mobile sidebar drawer */}
        {mobileNav && (
          <>
            <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            <div className="md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#0B1628] border-r border-[#E2E8F0] dark:border-[#2D3F55] flex flex-col overflow-y-auto"
              style={{ animation: "slideIn .24s ease both" }}>
              <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
              <div className="p-4 border-b border-[#E2E8F0] dark:border-[#2D3F55] flex items-center justify-between">
                <span className="font-bold text-sm">📋 Step-by-Step</span>
                <button onClick={() => setMobileNav(false)} className="text-[#64748B] text-xl leading-none">×</button>
              </div>
              {/* Role tabs mobile */}
              <div className="flex gap-1 p-3 border-b border-[#E2E8F0] dark:border-[#2D3F55]">
                {ROLES.map((r) => (
                  <button key={r.key} onClick={() => setRole(r.key)}
                    className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all border",
                      role === r.key ? `${r.bg} ${r.border}` : "border-transparent text-[#64748B]")}
                    style={role === r.key ? { color: r.color } : undefined}>
                    <span className="text-lg">{r.icon}</span>{r.label}
                  </button>
                ))}
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                {steps.map((s, i) => (
                  <button key={s.id} onClick={() => scrollToStep(s.id)}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all",
                      activeStep === s.id ? "font-bold" : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}
                    style={activeStep === s.id ? { color: currentRole.color, backgroundColor: currentRole.color + "11" } : undefined}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white"
                      style={{ backgroundColor: activeStep === s.id ? currentRole.color : "#CBD5E1" }}>
                      {i + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="max-w-300 mx-auto flex gap-0">

          {/* Desktop sidebar */}
          <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#0B1628]">
            <div className="p-3 border-b border-[#E2E8F0] dark:border-[#2D3F55] space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-2 mb-2">Select Role</p>
              {ROLES.map((r) => (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    role === r.key ? `${r.bg} ${r.border} font-bold` : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}
                  style={role === r.key ? { color: r.color } : undefined}>
                  <span className="text-lg">{r.icon}</span>
                  {r.label} Guide
                </button>
              ))}
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-3 py-2">Steps</p>
              {steps.map((s, i) => (
                <button key={s.id} onClick={() => scrollToStep(s.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all",
                    activeStep === s.id ? "font-bold" : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}
                  style={activeStep === s.id ? { color: currentRole.color, backgroundColor: currentRole.color + "11" } : undefined}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white"
                    style={{ backgroundColor: activeStep === s.id ? currentRole.color : "#CBD5E1" }}>
                    {i + 1}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main ref={contentRef} className="flex-1 min-w-0 px-6 md:px-10 py-8 max-w-205">

            {/* Role hero */}
            <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border"
              style={{ borderColor: currentRole.color + "44", backgroundColor: currentRole.color + "0d" }}>
              <span className="text-4xl">{currentRole.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: currentRole.color }}>
                  Step-by-Step Guide
                </p>
                <h1 className="font-nunito text-2xl font-extrabold dark:text-white">
                  {currentRole.label} Walkthrough
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{currentRole.desc}</p>
              </div>
              <div className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: currentRole.color + "22", color: currentRole.color }}>
                {steps.length} steps
              </div>
            </div>

            {/* Steps timeline */}
            <div>
              {steps.map((step, i) => (
                <StepCard key={step.id} step={step} index={i} color={currentRole.color} />
              ))}
            </div>

            {/* Done banner */}
            <div className="mt-4 p-6 rounded-2xl border text-center"
              style={{ borderColor: currentRole.color + "44", backgroundColor: currentRole.color + "0d" }}>
              <span className="text-3xl block mb-2">🎉</span>
              <p className="font-extrabold font-nunito text-base dark:text-white" style={{ color: currentRole.color }}>
                You&apos;re all set!
              </p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                {role === "admin"   && "The system is configured and ready for teachers and students."}
                {role === "teacher" && "Your class is live — students can now register, work through modules, and get graded."}
                {role === "student" && "You've completed the full TSR journey. Check your diagnostic report to see how you grew!"}
              </p>
              <div className="mt-4 flex justify-center gap-3 flex-wrap">
                <a href="/manual"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all hover:opacity-80"
                  style={{ borderColor: currentRole.color + "66", color: currentRole.color }}>
                  📖 Full User Manual
                </a>
                <a href="/manual/install"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] dark:text-[#94A3B8] transition-all hover:border-[#3B82C4] hover:text-[#3B82C4]">
                  🛠️ Installation Guide
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-white/10 text-xs text-[#94A3B8] text-center">
              Think–Solve–Reflect · Grade 6 Mathematics · Stage-Based Interactive Module
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
