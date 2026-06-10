"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Section config ────────────────────────────────────────────
const SECTIONS = [
  { id: "prerequisites",   title: "Prerequisites",              icon: "📋" },
  { id: "clone-install",   title: "Clone & Install",            icon: "📦" },
  { id: "env-vars",        title: "Environment Variables",      icon: "⚙️" },
  { id: "database",        title: "Set Up the Database",        icon: "🗄️" },
  { id: "seed",            title: "Seed Initial Data",          icon: "🌱" },
  { id: "dev-server",      title: "Start Dev Server",           icon: "🚀" },
  { id: "production",      title: "Production Build",           icon: "🏗️" },
  { id: "commands",        title: "Common Commands",            icon: "💻" },
  { id: "troubleshooting", title: "Troubleshooting",            icon: "🔧" },
];

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

function SectionTitle({ id, icon, title }: { id: string; icon: string; title: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-xl font-extrabold font-nunito mb-5 pt-2 scroll-mt-24 text-[#3B82C4]">
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="my-4 rounded-xl bg-[#0F172A] dark:bg-[#020617] border border-[#1E293B] dark:border-white/10 p-4 overflow-x-auto text-[13px] leading-relaxed text-[#94A3B8]">
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#F1F5F9] dark:bg-[#1E293B] px-1.5 py-0.5 rounded text-[#3B82C4] font-mono text-xs">
      {children}
    </code>
  );
}

function Divider() {
  return <div className="my-8 border-t border-[#E2E8F0] dark:border-white/10" />;
}

// ─── Page ──────────────────────────────────────────────────────
export default function InstallPage() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileNav, setMobileNav] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveSection(SECTIONS[0].id);
  }, []);

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
          <span className="text-sm font-bold text-[#64748B] dark:text-[#94A3B8]">🛠️ Installation Guide</span>

          <div className="ml-auto flex items-center gap-2">
            <a href="/manual"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] dark:text-[#94A3B8] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all">
              📖 User Manual
            </a>
            <button onClick={() => setMobileNav(true)}
              className="md:hidden p-2 rounded-lg border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B]">
              ☰
            </button>
          </div>
        </header>

        {/* Mobile sidebar drawer */}
        {mobileNav && (
          <>
            <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            <div className="md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#0B1628] border-r border-[#E2E8F0] dark:border-[#2D3F55] flex flex-col overflow-y-auto"
              style={{ animation: "slideIn .24s ease both" }}>
              <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
              <div className="p-4 border-b border-[#E2E8F0] dark:border-[#2D3F55] flex items-center justify-between">
                <span className="font-bold text-sm">🛠️ Installation</span>
                <button onClick={() => setMobileNav(false)} className="text-[#64748B] text-xl leading-none">×</button>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                {SECTIONS.map((s) => (
                  <button key={s.id} onClick={() => scrollToSection(s.id)}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all",
                      activeSection === s.id
                        ? "font-bold text-[#3B82C4] bg-[#3B82C411]"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}>
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
            <div className="p-3 border-b border-[#E2E8F0] dark:border-[#2D3F55]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-2 mb-1">Installation</p>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => scrollToSection(s.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all",
                    activeSection === s.id
                      ? "font-bold text-[#3B82C4] bg-[#3B82C411]"
                      : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5")}>
                  <span className="text-sm w-5 text-center shrink-0">{s.icon}</span>
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main ref={contentRef} className="flex-1 min-w-0 px-6 md:px-10 py-8 max-w-[820px]">

            {/* Hero banner */}
            <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl border border-[#3B82C4]/30 bg-[#3B82C40d]">
              <span className="text-4xl">🛠️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-[#3B82C4]">Setup</p>
                <h1 className="font-nunito text-2xl font-extrabold dark:text-white">Installation Guide</h1>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Step-by-step instructions to install and run the TSR system locally or in production.
                </p>
              </div>
            </div>

            {/* ── Prerequisites ─────────────────────────────── */}
            <SectionTitle id="prerequisites" icon="📋" title="Prerequisites" />
            <P>Make sure the following tools are installed on your machine before proceeding.</P>
            <Table
              headers={["Tool", "Version", "Notes"]}
              rows={[
                ["Node.js", "20 or later", "Download from nodejs.org"],
                ["pnpm",    "latest",      <>Run <InlineCode>npm install -g pnpm</InlineCode> to install</> as any],
                ["PostgreSQL", "14 or later", "Local install or hosted — Supabase recommended"],
              ]}
            />
            <Tip>
              Using <strong>Supabase</strong>? Create a free project at{" "}
              <strong>supabase.com</strong> — no local PostgreSQL needed.
            </Tip>

            <Divider />

            {/* ── Clone & Install ───────────────────────────── */}
            <SectionTitle id="clone-install" icon="📦" title="Clone & Install" />
            <Steps items={[
              "Clone the repository to your local machine.",
              "Change into the project directory.",
              "Install all dependencies with pnpm.",
            ]} />
            <CodeBlock>{`git clone <repository-url>
cd lm2-ICIM-2026
pnpm install`}</CodeBlock>
            <Note color="green">
              <InlineCode>pnpm install</InlineCode> reads <InlineCode>pnpm-lock.yaml</InlineCode> and installs exact dependency versions — no version drift.
            </Note>

            <Divider />

            {/* ── Environment Variables ─────────────────────── */}
            <SectionTitle id="env-vars" icon="⚙️" title="Environment Variables" />
            <P>
              Create a <InlineCode>.env</InlineCode> file in the project root (same folder as{" "}
              <InlineCode>package.json</InlineCode>). The app will not start correctly without it.
            </P>
            <CodeBlock>{`# PostgreSQL connection string (required)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT secret for session signing (required in production)
JWT_SECRET="replace-with-a-long-random-string"

# Application environment
NODE_ENV="development"`}</CodeBlock>
            <SubTitle>Supabase Connection URL</SubTitle>
            <P>
              If you are using Supabase, copy the <strong>connection pooler</strong> URL (port{" "}
              <InlineCode>6543</InlineCode>) from your project&apos;s <em>Settings → Database</em> page and use it
              as your <InlineCode>DATABASE_URL</InlineCode>. This supports serverless and edge deployments.
            </P>
            <Note color="amber">
              The app falls back to a hardcoded dev secret if <InlineCode>JWT_SECRET</InlineCode> is unset.{" "}
              <strong>Always set JWT_SECRET in production.</strong>
            </Note>

            <Divider />

            {/* ── Database Setup ────────────────────────────── */}
            <SectionTitle id="database" icon="🗄️" title="Set Up the Database" />
            <P>Generate the Prisma client and apply all database migrations.</P>
            <SubTitle>Production / First-time Setup</SubTitle>
            <CodeBlock>{`npx prisma generate
npx prisma migrate deploy`}</CodeBlock>
            <SubTitle>Local Development</SubTitle>
            <P>
              Use <InlineCode>migrate dev</InlineCode> instead — it applies migrations and also creates new
              migration files when your schema changes.
            </P>
            <CodeBlock>{`npx prisma migrate dev`}</CodeBlock>
            <Tip>
              The Prisma client is generated into <InlineCode>src/lib/generated/prisma/</InlineCode> (not{" "}
              <InlineCode>node_modules</InlineCode>). Always run <InlineCode>npx prisma generate</InlineCode> after
              pulling schema changes.
            </Tip>

            <Divider />

            {/* ── Seed ──────────────────────────────────────── */}
            <SectionTitle id="seed" icon="🌱" title="Seed Initial Data" />
            <P>Populate the database with default accounts, scenario contexts, schools, and class sections.</P>
            <CodeBlock>{`npx prisma db seed`}</CodeBlock>
            <P>The seed script creates the following default accounts:</P>
            <Table
              headers={["Role", "Email", "Password"]}
              rows={[
                ["Admin",   "admin@tsr.edu",   "Admin1234!"],
                ["Teacher", "teacher@tsr.edu", "Teacher1234!"],
              ]}
            />
            <Note color="red">
              Change the default passwords immediately in any environment accessible from the internet.
            </Note>

            <Divider />

            {/* ── Dev Server ────────────────────────────────── */}
            <SectionTitle id="dev-server" icon="🚀" title="Start Dev Server" />
            <CodeBlock>{`pnpm dev`}</CodeBlock>
            <P>
              Open <InlineCode>http://localhost:3000</InlineCode> in your browser. The dev server supports hot
              reload — changes to files are reflected instantly without a full restart.
            </P>
            <Note color="green">
              The app auto-redirects based on role after login:{" "}
              <InlineCode>/dashboard/student</InlineCode> for students,{" "}
              <InlineCode>/dashboard/teacher</InlineCode> for teachers, and{" "}
              <InlineCode>/admin</InlineCode> for admins.
            </Note>

            <Divider />

            {/* ── Production Build ──────────────────────────── */}
            <SectionTitle id="production" icon="🏗️" title="Production Build" />
            <CodeBlock>{`pnpm build
pnpm start`}</CodeBlock>
            <P>
              <InlineCode>pnpm build</InlineCode> automatically runs <InlineCode>prisma generate</InlineCode> before
              compiling. Make sure <InlineCode>DATABASE_URL</InlineCode> and <InlineCode>JWT_SECRET</InlineCode> are
              set in your production environment before building.
            </P>
            <Note color="amber">
              Run <InlineCode>npx prisma migrate deploy</InlineCode> on the production database{" "}
              <strong>before</strong> starting the server to apply any pending migrations.
            </Note>

            <Divider />

            {/* ── Common Commands ───────────────────────────── */}
            <SectionTitle id="commands" icon="💻" title="Common Commands" />
            <Table
              headers={["Command", "Description"]}
              rows={[
                ["pnpm dev",                                          "Start the development server with hot reload"],
                ["pnpm build",                                        "Compile a production build (runs prisma generate first)"],
                ["pnpm start",                                        "Serve the production build"],
                ["pnpm lint",                                         "Run ESLint across the codebase"],
                ["npx prisma generate",                               "Regenerate the Prisma client after schema changes"],
                ["npx prisma migrate dev --name <name>",             "Create and apply a new migration (dev only)"],
                ["npx prisma migrate deploy",                         "Apply all pending migrations (production)"],
                ["npx prisma db seed",                                "Run the seed script to populate default data"],
                ["npx prisma studio",                                 "Open the visual database browser at localhost:5555"],
              ]}
            />

            <Divider />

            {/* ── Troubleshooting ───────────────────────────── */}
            <SectionTitle id="troubleshooting" icon="🔧" title="Troubleshooting" />

            <SubTitle>Prisma client not found</SubTitle>
            <P>
              Run <InlineCode>npx prisma generate</InlineCode>. The client is output to{" "}
              <InlineCode>src/lib/generated/prisma/</InlineCode> — not to <InlineCode>node_modules</InlineCode> — so
              it must be regenerated after cloning or pulling changes.
            </P>

            <SubTitle>Migration errors on a fresh database</SubTitle>
            <P>
              Use <InlineCode>npx prisma migrate deploy</InlineCode> instead of{" "}
              <InlineCode>migrate dev</InlineCode> if you already have migration files and just want to apply them
              without creating new ones.
            </P>

            <SubTitle>JWT_SECRET warning in logs</SubTitle>
            <P>
              Set <InlineCode>JWT_SECRET</InlineCode> in your <InlineCode>.env</InlineCode>. The fallback value is
              intentionally insecure and only suitable for local development.
            </P>

            <SubTitle>DATABASE_URL connection refused</SubTitle>
            <P>
              Confirm that your PostgreSQL server is running and that the host, port, username, password, and
              database name in <InlineCode>DATABASE_URL</InlineCode> are correct. For Supabase, use the{" "}
              <strong>connection pooler</strong> URL (port <InlineCode>6543</InlineCode>), not the direct connection
              URL.
            </P>

            <SubTitle>Port 3000 already in use</SubTitle>
            <P>
              Another process is listening on port 3000. Either stop that process or start the dev server on a
              different port: <InlineCode>pnpm dev -- --port 3001</InlineCode>.
            </P>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-[#E2E8F0] dark:border-white/10 text-xs text-[#94A3B8] text-center">
              Think–Solve–Reflect · Grade 6 Mathematics · Stage-Based Interactive Module
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
