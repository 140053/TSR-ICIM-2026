"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────
type Role = "student" | "teacher" | "admin";

interface Section {
  id:    string;
  title: string;
  icon:  string;
}

// ─── Role config ───────────────────────────────────────────────
const ROLES: { key: Role; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { key: "student", label: "Student",  icon: "🎒", color: "#3B82C4", bg: "bg-[#DBEAFE] dark:bg-[#1e3a5f]", border: "border-[#3B82C4]" },
  { key: "teacher", label: "Teacher",  icon: "📋", color: "#4A9B7F", bg: "bg-[#D1FAE5] dark:bg-[#064e35]", border: "border-[#4A9B7F]" },
  { key: "admin",   label: "Admin",    icon: "⚙️", color: "#8B5CF6", bg: "bg-[#EDE9FE] dark:bg-[#2e1065]", border: "border-[#8B5CF6]" },
];

const SECTIONS: Record<Role, Section[]> = {
  student: [
    { id: "s-register",    title: "Registering & Logging In",     icon: "👤" },
    { id: "s-onboarding",  title: "Onboarding Setup",             icon: "🎨" },
    { id: "s-dashboard",   title: "Student Dashboard",            icon: "🏠" },
    { id: "s-pretest",     title: "Taking the Pre-Test",          icon: "📋" },
    { id: "s-module",      title: "Working Through a Module",     icon: "📦" },
    { id: "s-stages",      title: "Stage Types Explained",        icon: "🗺️" },
    { id: "s-report",      title: "Your Diagnostic Report",       icon: "📊" },
    { id: "s-posttest",    title: "Taking the Post-Test",         icon: "📊" },
    { id: "s-achievements",title: "Achievements & Profile",       icon: "🏆" },
  ],
  teacher: [
    { id: "t-register",    title: "Registering & Logging In",     icon: "👤" },
    { id: "t-dashboard",   title: "Dashboard Home",               icon: "🏠" },
    { id: "t-progress",    title: "Viewing Student Progress",     icon: "👥" },
    { id: "t-grading",     title: "Grading Open-Ended Responses", icon: "✍️" },
    { id: "t-modules",     title: "Managing Modules",             icon: "📦" },
    { id: "t-create",      title: "Creating a New Module",        icon: "➕" },
    { id: "t-tests",       title: "Pre/Post Test Results",        icon: "📈" },
    { id: "t-reports",     title: "Class Reports & Diagnostics",  icon: "📊" },
    { id: "t-contexts",    title: "Managing Learning Contexts",   icon: "🏷️" },
  ],
  admin: [
    { id: "a-login",       title: "Logging In",                   icon: "🔐" },
    { id: "a-dashboard",   title: "Dashboard Overview",           icon: "🏠" },
    { id: "a-users",       title: "Managing Users",               icon: "👥" },
    { id: "a-sections",    title: "Schools & Sections",           icon: "🏫" },
    { id: "a-modules",     title: "Managing Modules",             icon: "📦" },
    { id: "a-create",      title: "Creating a New Module",        icon: "➕" },
    { id: "a-testsets",    title: "Managing Test Sets",           icon: "📝" },
    { id: "a-contexts",    title: "Contexts & Invite Codes",      icon: "🏷️" },
    { id: "a-system",      title: "System Tools",                 icon: "⚙️" },
  ],
};

// ─── Small components ──────────────────────────────────────────
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3.5 bg-[#DBEAFE] dark:bg-[#1e3a5f] border border-[#3B82C4]/30 rounded-xl text-sm text-[#1e3654] dark:text-[#DBEAFE]">
      <span className="text-base shrink-0">💡</span>
      <span>{children}</span>
    </div>
  );
}

function Note({ children, color = "amber" }: { children: React.ReactNode; color?: "amber" | "red" | "green" }) {
  const cls = {
    amber: "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B]/30 text-[#3d2800] dark:text-[#FEF3C7]",
    red:   "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C]/30 text-[#450a0a] dark:text-[#FEE2E2]",
    green: "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F]/30 text-[#063c28] dark:text-[#D1FAE5]",
  }[color];
  return (
    <div className={cn("flex gap-2.5 p-3.5 border rounded-xl text-sm", cls)}>
      <span className="text-base shrink-0">{color === "amber" ? "⚠️" : color === "red" ? "🚫" : "✅"}</span>
      <span>{children}</span>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5 my-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="w-6 h-6 rounded-full bg-[#3B82C4] text-white flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-[#374151] dark:text-[#D1D5DB]" dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ol>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-[#E2E8F0] dark:border-white/10">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] dark:bg-[#0a0a0a]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#E2E8F0] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[#374151] dark:text-[#D1D5DB]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ id, icon, title, color }: { id: string; icon: string; title: string; color: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-xl font-extrabold font-nunito mb-5 pt-2 scroll-mt-24" style={{ color }}>
      <span className="text-2xl">{icon}</span>
      {title}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-[#1E293B] dark:text-white mt-6 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed mb-3">{children}</p>;
}

function Divider() {
  return <div className="my-8 border-t border-[#E2E8F0] dark:border-white/10" />;
}

// ─── Content per role ──────────────────────────────────────────

function StudentContent({ color }: { color: string }) {
  return (
    <div className="space-y-2">
      <SectionTitle id="s-register" icon="👤" title="Registering & Logging In" color={color} />
      <SubTitle>Registering as a Student</SubTitle>
      <Steps items={[
        'Go to <code class="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#3B82C4] font-mono text-xs">/register</code> and make sure <strong>I\'m a Student</strong> is selected.',
        "Enter your <strong>First Name, Last Name, Email,</strong> and <strong>Password</strong>. The password strength meter shows when your password is strong enough.",
        "Click <strong>Next — Identity →</strong>.",
        "Select your <strong>School</strong> from the dropdown. The section list will update automatically.",
        "Select your <strong>Section</strong> from the tiles.",
        "Click <strong>⚔️ Begin My Quest!</strong> — you will be taken to the onboarding setup.",
      ]} />
      <SubTitle>Logging In</SubTitle>
      <Steps items={[
        'Go to <code class="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#3B82C4] font-mono text-xs">/login</code> and select the <strong>I\'m a Student</strong> tab.',
        "Enter your email and password, then click <strong>Sign In</strong>.",
        "If your account setup is not complete, you will be redirected to onboarding first.",
      ]} />
      <Tip>If you forget your password, contact your teacher or administrator to have it reset.</Tip>

      <Divider />
      <SectionTitle id="s-onboarding" icon="🎨" title="Onboarding Setup" color={color} />
      <P>After registering, complete a one-time setup before entering your dashboard.</P>
      <SubTitle>Choose Your Avatar</SubTitle>
      <P>Pick one of 10 characters: Wizard 🧙, Elf 🧝, Hero 🦸, Champion 🏆, Explorer 🗺️, Fox 🦊, Dragon 🐉, Lion 🦁, Eagle 🦅, or Wolf 🐺. Your avatar is shown throughout the system.</P>
      <SubTitle>Choose Your Difficulty</SubTitle>
      <Table
        headers={["Level", "Badge", "Hint Behavior"]}
        rows={[
          ["Apprentice", "🥉", "Hints are always visible — best for extra support"],
          ["Adventurer", "🥈", "Hints available on request — the recommended setting"],
          ["Champion",   "🥇", "No hints — for students who want the hardest challenge"],
        ]}
      />
      <Tip>You can change your difficulty level anytime from your Profile page.</Tip>

      <Divider />
      <SectionTitle id="s-dashboard" icon="🏠" title="Student Dashboard" color={color} />
      <P>After logging in you land on your personal dashboard. It shows:</P>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#4B5563] dark:text-[#9CA3AF] mb-4">
        <li><strong>Your Avatar & Stats</strong> — name, avatar, level, XP bar, and streak</li>
        <li><strong>Active Modules</strong> — assigned modules with stage progress bars and status badges</li>
        <li><strong>Quick Stats</strong> — stages completed, total XP earned, and current level</li>
      </ul>
      <SubTitle>Navigation Bar</SubTitle>
      <Table
        headers={["Link", "Page"]}
        rows={[
          ["My Modules",   "Full list of assigned modules"],
          ["Pre-Test",     "Take the pre-assessment"],
          ["Post-Test",    "Take the post-assessment (unlocks after module completion)"],
          ["Reports",      "View diagnostic reports"],
          ["Achievements", "View earned badges"],
          ["Profile",      "Edit your account"],
        ]}
      />

      <Divider />
      <SectionTitle id="s-pretest" icon="📋" title="Taking the Pre-Test" color={color} />
      <Note color="amber">Take the pre-test <strong>before</strong> starting any module stages. It measures your knowledge before learning.</Note>
      <Steps items={[
        "Click <strong>Pre-Test</strong> in the navigation or go to your dashboard.",
        "Read the instructions carefully.",
        "Answer up to <strong>20 questions</strong>. Question types include: Numeric (type a number), Short Text, Time (e.g. 2:30), and Multiple Choice (A/B/C/D).",
        "If a time limit is set, a countdown timer appears at the top.",
        "Click <strong>Submit Test</strong> when done.",
      ]} />
      <Note color="red">You can submit the pre-test <strong>only once</strong>. Review all answers before submitting.</Note>

      <Divider />
      <SectionTitle id="s-module" icon="📦" title="Working Through a Module" color={color} />
      <SubTitle>Selecting a Module</SubTitle>
      <P>Go to <strong>My Modules</strong>. Each module card shows a <strong>banner image</strong> at the top (when one has been uploaded) and a status badge. Click a card to open the module detail drawer, where the full banner and <strong>rich-text scenario</strong> (with bold, italic, lists) are displayed.</P>
      <Table
        headers={["Status", "Meaning"]}
        rows={[
          ["Not Started", "Click to begin from Stage 1"],
          ["In Progress",  "Click to continue from your current stage"],
          ["Completed",    "Click to review your answers"],
          ["🔒 Locked",   "Complete a previous module first to unlock"],
        ]}
      />
      <SubTitle>Submitting a Stage</SubTitle>
      <Steps items={[
        "Read the question or instruction at the top of the stage.",
        "Enter your answer using the stage's input method (see Stage Types below).",
        "Click <strong>Submit Answer</strong>.",
        "Auto-scored stages show your result immediately. Teacher-graded stages are saved for your teacher to review.",
        "Click <strong>Continue to Stage X →</strong> to move on.",
      ]} />
      <Note color="red">You can submit each stage <strong>only once</strong>. Double-check your answer before submitting.</Note>
      <SubTitle>After Stage 12 — Scenario Questions</SubTitle>
      <P>After submitting Stage 12, if the module has <strong>Scenario Questions</strong> configured, they will appear immediately before the Completion Screen. Answer all questions and click <strong>✓ Submit</strong>. After submitting, the Completion Screen shows your score, XP earned, and diagnostic cluster summary. If no scenario questions are configured, the Completion Screen appears right away.</P>

      <Divider />
      <SectionTitle id="s-stages" icon="🗺️" title="Stage Types Explained" color={color} />
      <P>All stages in a module use one of <strong>3 question types</strong>. Your teacher chooses the type that best fits each thinking skill.</P>
      <Table
        headers={["Type", "What You See", "How to Answer", "Scored By"]}
        rows={[
          ["🔘 Multiple Choice", "Up to 6 option cards",           "Click the card that best answers the question. A highlighted border shows your selection.", "Auto — result shown immediately"],
          ["🔀 Arrangement",      "A list of items with drag handles","Drag items into the correct order using the ⠿ handle. #1 at the top = most important.",  "Auto — result shown immediately"],
          ["✏️ Answer Input",    "A text or number input box",     "Type your answer. Click a sentence starter chip if shown to begin your response.",          "Auto if the teacher set an answer key; otherwise teacher-graded"],
        ]}
      />
      <Note color="amber">Your teacher assigns one of these 3 types to each stage based on the thinking skill being practiced.</Note>

      <Divider />
      <SectionTitle id="s-report" icon="📊" title="Your Diagnostic Report" color={color} />
      <P>After Stage 12, the system automatically generates a diagnostic report showing your performance across 4 clusters.</P>
      <SubTitle>Accessing the Report</SubTitle>
      <Steps items={[
        "After Stage 12, the <strong>Completion Screen</strong> shows your score, XP earned, and cluster summary.",
        "Click <strong>View Full Report</strong> or go to <strong>Reports</strong> in the navigation.",
        "Click the module name to open the detailed report.",
      ]} />
      <SubTitle>Cluster Scores</SubTitle>
      <Table
        headers={["Cluster", "Stages", "Color", "Proficiency Levels"]}
        rows={[
          ["Understanding", "1–3",   "🔵 Blue",   "Proficient (≥80%) · Developing (60–79%) · Struggling (<60%)"],
          ["Analysis",      "4–7",   "🟣 Purple", "Proficient (≥80%) · Developing (60–79%) · Struggling (<60%)"],
          ["Solution",      "8–10",  "🟠 Amber",  "Proficient (≥80%) · Developing (60–79%) · Struggling (<60%)"],
          ["Reflection",    "11–12", "🟢 Green",  "Proficient (≥80%) · Developing (60–79%) · Struggling (<60%)"],
        ]}
      />

      <Divider />
      <SectionTitle id="s-posttest" icon="📊" title="Taking the Post-Test" color={color} />
      <Note color="amber">The post-test is only available <strong>after you complete all 12 stages</strong> of the assigned module.</Note>
      <P>The format is identical to the pre-test. After submitting, your teacher can compare your pre and post scores to measure your learning gain.</P>
      <Note color="red">Like the pre-test, you can submit the post-test <strong>only once</strong>.</Note>

      <Divider />
      <SectionTitle id="s-achievements" icon="🏆" title="Achievements & Profile" color={color} />
      <SubTitle>Achievements</SubTitle>
      <Table
        headers={["Category", "Example Badges"]}
        rows={[
          ["🏆 Progress",  "Complete your first stage, finish a module"],
          ["🎯 Mastery",   "Score 100% on a stage, achieve Proficient in a cluster"],
          ["📝 Testing",   "Submit a pre-test, submit a post-test"],
          ["⭐ XP",        "Reach Level 2, Level 5, Level 10"],
          ["🔥 Streak",    "Log in 3 days in a row, 7 days in a row"],
        ]}
      />
      <SubTitle>Profile</SubTitle>
      <P>Go to <strong>Profile</strong> in the navigation to update your display name, change your password, or switch difficulty levels.</P>
      <Note color="amber">Your email, section, and school can only be changed by your teacher or admin.</Note>
    </div>
  );
}

function TeacherContent({ color }: { color: string }) {
  return (
    <div className="space-y-2">
      <SectionTitle id="t-register" icon="👤" title="Registering & Logging In" color={color} />
      <SubTitle>Registering as a Teacher</SubTitle>
      <Steps items={[
        'Go to <code class="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#4A9B7F] font-mono text-xs">/register</code> and select <strong>I\'m a Teacher</strong>.',
        "Enter your <strong>First Name, Last Name, Email,</strong> and <strong>Password</strong>. Click <strong>Next</strong>.",
        "Select your <strong>School</strong> from the dropdown.",
        "Enter your <strong>Subject / Department</strong>.",
        "Enter the <strong>Teacher Invite Code</strong> provided by your school administrator.",
        "Click <strong>📋 Create Classroom</strong>.",
      ]} />
      <Tip>You must have a valid invite code from your admin. Contact your administrator if you don't have one.</Tip>

      <Divider />
      <SectionTitle id="t-dashboard" icon="🏠" title="Dashboard Home" color={color} />
      <P>The teacher dashboard shows class-wide statistics, a diagnostic heatmap, and a pending grades badge.</P>
      <SubTitle>Sidebar Navigation</SubTitle>
      <Table
        headers={["Icon", "Section", "Description"]}
        rows={[
          ["🏠", "Dashboard",   "Home overview and class stats"],
          ["👥", "My Students", "Student list with module progress"],
          ["📦", "Modules",     "Module management and progress"],
          ["📊", "Reports",     "Class diagnostic reports"],
          ["📝", "Tests",       "Pre/post test results and management"],
          ["✍️", "Grade Queue", "Open-ended responses awaiting grading"],
          ["🏷️", "Contexts",   "Manage scenario contexts for modules"],
          ["👤", "Profile",     "Edit your account"],
        ]}
      />
      <Tip>The red badge on <strong>Grade Queue</strong> shows how many responses are waiting for your grading.</Tip>

      <Divider />
      <SectionTitle id="t-progress" icon="👥" title="Viewing Student Progress" color={color} />
      <SubTitle>Student List</SubTitle>
      <P>Go to <strong>My Students</strong>. The page is a <strong>datatable</strong> with per-section tabs at the top. Use the <strong>live search</strong> bar to filter by name, click column headers to sort, and page through results (10 rows per page). Click <strong>👤 Profile</strong> on any row to open a side drawer showing the student's avatar, XP/level, current module progress, and quick links to their full report and open responses.</P>
      <SubTitle>Module Cards</SubTitle>
      <P>In the <strong>Modules</strong> tab, each module card shows a list of students with status badges:</P>
      <Table
        headers={["Badge", "Meaning"]}
        rows={[
          ["✅ Done",       "Student completed all 12 stages"],
          ["⏳ In Progress", "Student is currently working through stages"],
          ["⚠️ Stuck",      "Student has clusters below 60% — may need help"],
          ["○ Not Started", "Student has not started this module yet"],
        ]}
      />
      <P>Click any student row to open a <strong>progress drawer</strong> showing overall score, cluster percentages, and a stage-by-stage breakdown. The drawer also has <strong>📊 Full Report</strong> (individual diagnostic report) and <strong>✍️ Grade Open Items</strong> (grade queue filtered to that student) buttons.</P>

      <Divider />
      <SectionTitle id="t-grading" icon="✍️" title="Grading Open-Ended Responses" color={color} />
      <SubTitle>From the Grade Queue</SubTitle>
      <Steps items={[
        "Click <strong>✍️ Grade Queue</strong> in the sidebar.",
        "All pending responses are listed with student name, module, stage, and answer.",
        "Click <strong>Grade</strong> on a response.",
        "Enter a <strong>score</strong> (0 to the stage's max score).",
        "Optionally add a <strong>teacher note</strong> — this feedback is shown to the student in their report.",
        "Click <strong>Save Grade</strong>.",
      ]} />
      <Note color="green">Only <strong>Answer Input</strong> stages where the teacher left the answer key blank require manual grading. <strong>Multiple Choice</strong> and <strong>Arrangement</strong> stages are always auto-scored. Answer Input stages with an answer key are also auto-scored.</Note>

      <Divider />
      <SectionTitle id="t-modules" icon="📦" title="Managing Modules" color={color} />
      <P>Go to <strong>📦 Modules</strong>. The page has three tabs:</P>
      <Table
        headers={["Tab", "Description"]}
        rows={[
          ["Assigned Modules", "Modules assigned to your sections — each card shows a banner image, rich-text scenario snippet, per-section completion bars, and pre/post test chips"],
          ["Module Library",   "Your own modules only (drafts + active modules assigned to your sections) — filter by Active or Draft status"],
          ["Pre/Post Results", "Per-module table of pre-test and post-test scores with gain calculation"],
        ]}
      />
      <SubTitle>Module Card Features</SubTitle>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#4B5563] dark:text-[#9CA3AF] mb-4">
        <li><strong>Banner image</strong> — shown at the top of each card when uploaded</li>
        <li><strong>Per-section completion bars</strong> — appear when you manage multiple sections</li>
        <li><strong>Pre/post test chips</strong> — blue for pre-test, purple for post-test; click <strong>+ Link</strong> to create if none is linked</li>
      </ul>
      <SubTitle>Action Buttons</SubTitle>
      <Table
        headers={["Button", "Action"]}
        rows={[
          ["📊 View Reports",   "Opens the class diagnostic reports page for this module"],
          ["✍️ Grade Items",    "Opens the grade queue filtered to this module"],
          ["🗄 Archive",        "Archives the module (removes it from student view)"],
        ]}
      />
      <SubTitle>Draft Modules</SubTitle>
      <P>Draft modules appear with an amber border in the Library tab. Click <strong>◐ Activate Module</strong> to promote a draft to Active — the module is then auto-assigned to all your sections.</P>

      <Divider />
      <SectionTitle id="t-create" icon="➕" title="Creating a New Module" color={color} />
      <Steps items={[
        "In the Modules tab, click <strong>+ New Module</strong>.",
        "<strong>Step 1 — Module Info:</strong> Enter title; optionally <strong>upload a banner image</strong> (drag-and-drop or click, max 4 MB); write the <strong>scenario using the rich text editor</strong> (bold, italic, underline, bullet list, ordered list, blockquote supported); select a context tile; and set estimated time.",
        "<strong>Step 2 — 12 Stages:</strong> Click each stage in the sidebar. For each stage set: <strong>Title</strong>, <strong>Question / Instruction</strong>, and choose one of 3 modes — <strong>🔘 Multiple Choice</strong> (up to 6 option cards, pick the correct one), <strong>🔀 Arrangement</strong> (drag-to-rank items in order), or <strong>✏️ Answer Input</strong> (free text/number — set an answer key for auto-scoring or leave blank for teacher grading). Also set an optional <strong>Hint</strong> and <strong>Max Score</strong>.",
        "<strong>Step 3 — Review:</strong> Check the stage summary table, then choose <strong>◐ Save as Draft</strong> (module is private, not assigned to any section) or <strong>✓ Publish Module</strong> (module becomes Active and is auto-assigned to all your sections).",
      ]} />
      <Tip>All 12 stages must have a question before you can publish. Stages with a question show a green ✓ in the sidebar. Multiple Choice and Arrangement stages are always auto-scored; Answer Input stages are auto-scored only when an answer key is set.</Tip>
      <Note color="green">After creating stages, you can also add <strong>Scenario Questions</strong> from the edit page's <strong>Scenario Questions</strong> section at the bottom. These questions are shown to students automatically after they complete all 12 stages. Click <strong>Save Questions</strong> to save them.</Note>

      <Divider />
      <SectionTitle id="t-tests" icon="📈" title="Pre/Post Test Results" color={color} />
      <P>Go to <strong>📝 Tests</strong>. Only test sets <strong>assigned to your sections</strong> are shown. The <strong>Results</strong> tab shows all students' pre-test and post-test scores including raw score, percent, date taken, and <strong>gain</strong> (the percentage point improvement).</P>
      <P>The <strong>Manage</strong> tab lets you create or edit test sets for your class. When you create a test it is automatically assigned to all your active sections but starts <strong>inactive</strong> — activate it from this page when you are ready for students to take it.</P>
      <P>Use the <strong>Linked Module</strong> dropdown when creating or editing a test to associate it with a module. The test will then appear as a chip on that module's card. The <strong>Context / Scenario</strong> dropdown is populated from the database.</P>

      <Divider />
      <SectionTitle id="t-reports" icon="📊" title="Class Reports & Diagnostics" color={color} />
      <SubTitle>Class Reports</SubTitle>
      <P>Go to <strong>📊 Reports</strong> to see all students' diagnostic performance. Students with any cluster below 60% are highlighted with a ⚠️ intervention flag.</P>
      <SubTitle>Individual Student Report</SubTitle>
      <P>Click a student's name to see their full diagnostic report. The hero card shows <strong>cross-module cluster average bars</strong> for Understanding, Analysis, Solution, and Reflection. Below that: cluster bar charts with proficiency badges, a stage breakdown table (with a <strong>Type</strong> column showing the stage type label and a <strong>Result</strong> column showing ✓ Correct / ✗ Incorrect / score% / ⏳ Pending), and any teacher notes.</P>
      <P>Use the <strong>⬇️ Export PDF</strong> button to download a PDF directly to your device (no print dialog). Use the <strong>🖨️ Print</strong> button to open the browser print dialog.</P>

      <Divider />
      <SectionTitle id="t-contexts" icon="🏷️" title="Managing Learning Contexts" color={color} />
      <P>Contexts are the real-world problem domains used when creating modules (e.g., "Sari-Sari Store", "School Garden").</P>
      <Steps items={[
        "Go to <strong>🏷️ Contexts</strong> in the sidebar.",
        "Click <strong>+ New Context</strong>.",
        "Fill in the label, description, emoji icon, and color. The system auto-generates a key from the label.",
        "Click <strong>Create Context</strong>.",
      ]} />
      <Note color="amber">Deleting a context is blocked if any module currently uses it.</Note>
    </div>
  );
}

function AdminContent({ color }: { color: string }) {
  return (
    <div className="space-y-2">
      <SectionTitle id="a-login" icon="🔐" title="Logging In" color={color} />
      <Steps items={[
        'Navigate to <code class="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#8B5CF6] font-mono text-xs">/admin/login</code>.',
        "Enter your admin email and password.",
        "You will be redirected to <strong>/admin</strong> (the admin dashboard).",
      ]} />
      <Tip>The admin login is separate from the student/teacher login. Going to <code className="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#8B5CF6] font-mono text-xs">/login</code> as an admin still redirects you to /admin after authentication.</Tip>

      <Divider />
      <SectionTitle id="a-dashboard" icon="🏠" title="Dashboard Overview" color={color} />
      <P>The admin dashboard has a sidebar with two navigation groups:</P>
      <Table
        headers={["Sidebar Group", "Tabs / Pages"]}
        rows={[
          ["Dashboard", "Overview · Users · Modules · Sections · Schools · System"],
          ["Models",    "Contexts · Invite Codes · Test Sets"],
          ["App Views", "Application Workflow diagram"],
        ]}
      />
      <P>The <strong>Overview</strong> tab shows total users, modules, sections, schools, pending grades, and a recent activity feed.</P>

      <Divider />
      <SectionTitle id="a-users" icon="👥" title="Managing Users" color={color} />
      <SubTitle>Create a User</SubTitle>
      <Steps items={[
        "Click the <strong>Users</strong> tab, then <strong>+ Create User</strong>.",
        "Fill in Name, Email, Password, and Role (STUDENT / TEACHER / ADMIN).",
        "For students, optionally assign a school and section.",
        "Click <strong>Create User</strong>. No invite code is required from the admin panel.",
      ]} />
      <SubTitle>Other User Actions</SubTitle>
      <Table
        headers={["Action", "How"]}
        rows={[
          ["Edit user",              "Click user name → edit fields → Save Changes"],
          ["Reset password",         "Click user name → Reset Password → enter new password"],
          ["Revoke all sessions",    "Click user name → Revoke Sessions → user is logged out everywhere"],
          ["Reset module progress",  "Click user name → Progress section → Reset next to the module"],
        ]}
      />
      <Note color="amber">You cannot edit or delete other admin accounts.</Note>

      <Divider />
      <SectionTitle id="a-sections" icon="🏫" title="Managing Schools & Sections" color={color} />
      <SubTitle>Schools</SubTitle>
      <Steps items={[
        "Click the <strong>Schools</strong> tab.",
        "Click <strong>+ Add School</strong> and enter the school name and optional address.",
        "Each school card shows its sections and enrolled student count.",
      ]} />
      <SubTitle>Sections</SubTitle>
      <Steps items={[
        "Click the <strong>Sections</strong> tab.",
        "Click <strong>+ Add Section</strong> and fill in the name, emoji, grade level, school year, and school.",
        "To assign a teacher: find the section card and click the <strong>👤 Assign</strong> button next to the teacher name.",
        "Select a teacher from the dropdown and click <strong>Save</strong>.",
      ]} />
      <Note color="amber">A section must have an assigned teacher before students can see their teacher in the system.</Note>

      <Divider />
      <SectionTitle id="a-modules" icon="📦" title="Managing Modules" color={color} />
      <P>Go to the <strong>Modules</strong> tab. The module list is a <strong>compact sortable data table</strong> with columns: Module (icon + title + context/subtitle), Status, Stages, Completions, Sections, Time, and Actions. Click any column header to sort ascending or descending. Use the search bar or status filter pills (All / Active / Draft / Archived) to find modules.</P>
      <Table
        headers={["Button", "Action"]}
        rows={[
          ["✏️ Edit",             "Opens a centered dialog modal with fields laid out in a grid: Icon / Title / Subtitle (row 1), Context / Status / Grade Level / Time (row 2), Lock toggle with Unlock After field (row 3), Banner upload (row 4), and Scenario rich text editor (row 5). Press Esc or click Cancel to close."],
          ["📌 Assign",           "Open modal → select sections grouped by school → Save Assignments (set-based replace)"],
          ["📋 Stages",           "Navigate to the stage editor for this module"],
          ["📝 Scenario Question","Navigate to the Scenario Questions editor for this module — add questions shown to students after Stage 12"],
          ["🗑️ Delete",           "Opens a confirmation dialog modal (Esc-to-close, focus-trapped). Permanently deletes the module and all related data (blocked if student completions exist)."],
          ["＋ New Module",        "Open the 3-step module creation wizard"],
        ]}
      />

      <Divider />
      <SectionTitle id="a-create" icon="➕" title="Creating a New Module" color={color} />
      <Steps items={[
        "Click <strong>＋ New Module</strong> in the Modules tab.",
        "<strong>Step 1 — Module Info:</strong> Enter the module title; optionally <strong>upload a banner image</strong> (drag-and-drop or click, max 4 MB — shown on module cards and the stage page); write the <strong>scenario using the rich text editor</strong> (bold, italic, underline, bullet list, ordered list, blockquote supported); select a context tile (click <strong>+ New context</strong> to create one inline); and set estimated time in minutes.",
        "<strong>Step 2 — 12 Stages:</strong> Click each stage in the sidebar. For every stage choose one of <strong>3 modes</strong> — <strong>🔘 Multiple Choice</strong> (up to 6 option cards, mark the correct one — always auto-scored), <strong>🔀 Arrangement</strong> (drag items into the correct order — always auto-scored), or <strong>✏️ Answer Input</strong> (free text or number — auto-scored if an answer key is set, teacher-graded if left blank). Also set: Title, Instruction, optional Hint, and Max Score.",
        "<strong>Step 3:</strong> Review the summary table, then click <strong>Save as Draft</strong> (DRAFT status, not visible to students) or <strong>✓ Publish Module</strong> (ACTIVE status, visible to assigned sections).",
      ]} />
      <Tip>After publishing, assign the module to sections from the Modules tab → 📌 Assign button.</Tip>
      <Note color="green">After creating stages, you can add <strong>Scenario Questions</strong> via the <strong>📝 Scenario Question</strong> button on the module row. These questions are shown to students automatically after they complete Stage 12.</Note>

      <Divider />
      <SectionTitle id="a-testsets" icon="📝" title="Managing Test Sets" color={color} />
      <P>Go to <strong>Models → Test Sets</strong>. The page is a sortable datatable. Click any column header to sort.</P>
      <Table
        headers={["Button", "Action"]}
        rows={[
          ["Questions", "Open the question editor for this test set"],
          ["📌 Assign",  "Assign to sections grouped by school (set-based replace)"],
          ["🔄 Reset",   "Delete all student results — students can retake"],
          ["✏️ Edit",    "Edit title, type, linked module, time limit, and description in a modal"],
          ["🗑️ Delete",  "Delete test set and all questions (blocked if results exist)"],
        ]}
      />
      <SubTitle>Adding Questions</SubTitle>
      <Steps items={[
        "Click <strong>Questions</strong> on a test set row.",
        "Click <strong>+ Add Question</strong>.",
        "Fill in the question number, context (select from DB or type custom), question text, answer type, and correct answer.",
        "For Multiple Choice: enter four choices and click a letter circle to mark the correct answer.",
        "Click <strong>Add Question</strong>.",
      ]} />

      <Divider />
      <SectionTitle id="a-contexts" icon="🏷️" title="Contexts & Invite Codes" color={color} />
      <SubTitle>Scenario Contexts</SubTitle>
      <P>Go to <strong>Models → Contexts</strong>. Contexts define the real-world problem domain of a module.</P>
      <Steps items={[
        "Click <strong>+ New Context</strong>.",
        "Fill in: <strong>Key</strong> (unique, UPPER_SNAKE_CASE, immutable after creation), <strong>Label</strong>, <strong>Description</strong>, <strong>Icon</strong> (emoji), <strong>Color</strong>, and <strong>Sort Order</strong>.",
        "Click <strong>Create Context</strong>.",
      ]} />
      <Note color="amber">Deleting a context is blocked if any module references its key.</Note>
      <SubTitle>Teacher Invite Codes</SubTitle>
      <P>Go to <strong>Models → Invite Codes</strong>. Invite codes allow teachers to self-register.</P>
      <Steps items={[
        "Click <strong>+ Generate Code</strong>.",
        "Optionally add a label (e.g., &ldquo;Batch 2026-A&rdquo;) and an expiry date.",
        "The generated code is in the format <code class=\"bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#8B5CF6] font-mono text-xs\">TSR-XXXX-XXXX</code>.",
        "Share this code with the teacher — they enter it during registration.",
      ]} />

      <Divider />
      <SectionTitle id="a-system" icon="⚙️" title="System Tools" color={color} />
      <P>Go to the <strong>System</strong> tab in the sidebar.</P>
      <Table
        headers={["Tool", "Description"]}
        rows={[
          ["Export All Data",       "Downloads tsr-export-YYYY-MM-DD.json — all modules, progress, responses, diagnostics"],
          ["Clear Expired Sessions","Removes all expired JWT session records. Active users are not affected."],
          ["Manage Invite Codes",   "Link to the Invite Codes page"],
        ]}
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────
export default function ManualPage() {
  const [role,       setRole]       = useState<Role>("student");
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileNav, setMobileNav]   = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentRole = ROLES.find((r) => r.key === role)!;
  const sections    = SECTIONS[role];

  // Track active section via IntersectionObserver
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [role, sections]);

  // Reset active section when role changes
  useEffect(() => {
    setActiveSection(sections[0]?.id ?? "");
    contentRef.current?.scrollTo({ top: 0 });
  }, [role, sections]);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNav(false);
  }

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1628] text-[#1E293B] dark:text-[#F1F5F9] font-nunito">

        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B1628]/90 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#2D3F55] px-6 h-14 flex items-center gap-4 shadow-sm">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-white text-xs font-black font-nunito">T</div>
            <span className="text-sm font-extrabold font-nunito hidden sm:inline">
              <span className="text-[#3B82C4]">TSR</span> · Math 6
            </span>
          </a>
          <div className="h-4 w-px bg-[#E2E8F0] dark:bg-[#2D3F55]" />
          <span className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">📖 User Manual</span>

          {/* Role pills (desktop) */}
          <div className="hidden md:flex items-center gap-1.5 ml-auto">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                  role === r.key
                    ? `${r.bg} ${r.border} text-[${r.color}]`
                    : "border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] dark:text-[#94A3B8] hover:border-[#3B82C4] hover:text-[#3B82C4]"
                )}
                style={role === r.key ? { color: r.color } : undefined}
              >
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          {/* Mobile nav toggle */}
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
                <span className="font-bold text-sm">📖 User Manual</span>
                <button onClick={() => setMobileNav(false)} className="text-[#64748B] text-xl leading-none">×</button>
              </div>
              {/* Role tabs */}
              <div className="flex gap-1 p-3 border-b border-[#E2E8F0] dark:border-[#2D3F55]">
                {ROLES.map((r) => (
                  <button key={r.key} onClick={() => { setRole(r.key); }}
                    className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all border",
                      role === r.key ? `${r.bg} ${r.border}` : "border-transparent text-[#64748B]")}
                    style={role === r.key ? { color: r.color } : undefined}>
                    <span className="text-lg">{r.icon}</span>{r.label}
                  </button>
                ))}
              </div>
              {/* Section links */}
              <div className="p-2 flex-1 overflow-y-auto">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => scrollToSection(s.id)}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all",
                      activeSection === s.id ? "font-bold" : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}
                    style={activeSection === s.id ? { color: currentRole.color, backgroundColor: currentRole.color + "11" } : undefined}>
                    <span className="text-base w-5 text-center shrink-0">{s.icon}</span>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="max-w-[1200px] mx-auto flex gap-0">

          {/* Desktop left sidebar */}
          <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#0B1628]">
            {/* Role tabs */}
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

            {/* Section links */}
            <div className="p-2 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-3 py-2">Sections</p>
              {sections.map((s) => (
                <button key={s.id} onClick={() => scrollToSection(s.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all",
                    activeSection === s.id ? "font-bold" : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}
                  style={activeSection === s.id ? { color: currentRole.color, backgroundColor: currentRole.color + "11" } : undefined}>
                  <span className="text-sm w-5 text-center shrink-0">{s.icon}</span>
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main ref={contentRef} className="flex-1 min-w-0 px-6 md:px-10 py-8 max-w-[820px]">

            {/* Role hero banner */}
            <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border"
              style={{ borderColor: currentRole.color + "44", backgroundColor: currentRole.color + "0d" }}>
              <span className="text-4xl">{currentRole.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: currentRole.color }}>
                  User Manual
                </p>
                <h1 className="font-nunito text-2xl font-extrabold dark:text-white">
                  {currentRole.label} Guide
                </h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {role === "student" && "Step-by-step guide for students on how to use the TSR system."}
                  {role === "teacher" && "Complete reference for teachers — modules, grading, diagnostics, and more."}
                  {role === "admin"   && "Full system administration guide — users, modules, test sets, and system tools."}
                </p>
              </div>
            </div>

            {/* Role content */}
            {role === "student" && <StudentContent color={currentRole.color} />}
            {role === "teacher" && <TeacherContent color={currentRole.color} />}
            {role === "admin"   && <AdminContent   color={currentRole.color} />}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-[#E2E8F0] dark:border-[#2D3F55] text-xs text-[#94A3B8] text-center">
              Think–Solve–Reflect · Grade 6 Mathematics · Stage-Based Interactive Module
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
