"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── LAYOUT CONSTANTS ─────────────────────────────────────────
const COL = (n: number) => 80 + n * 220;
const ROW = {
  auth: 80,
  s0:   240,
  s1:   380,
  s2:   520,
  s3:   660,
  s4:   800,
  s5:   940,
  t0:   1120,
  t1:   1260,
  t2:   1400,
  db:   1580,
};
const NW = 168;
const NH = 80;

// ─── TYPES ────────────────────────────────────────────────────
type ColorKey  = "blue" | "green" | "amber" | "teal" | "purple" | "dim";
type ShapeKey  = "rect" | "pill" | "diamond" | "db";
type PhaseKey  = keyof typeof ROW;

interface NodeDef {
  id:     string;
  icon:   string;
  label:  string;
  sub:    string;
  color:  ColorKey;
  cx:     number;
  cy:     number;
  shape:  ShapeKey;
  tip:    string;
}

interface EdgeDef {
  from:   string;
  to:     string;
  label:  string;
  color:  ColorKey;
  dashed: boolean;
}

// ─── COLOR MAPS ───────────────────────────────────────────────
const C: Record<ColorKey, string> = {
  blue:   "#3b82f6",
  green:  "#10b981",
  amber:  "#f59e0b",
  teal:   "#06b6d4",
  purple: "#8b5cf6",
  dim:    "#334d6a",
};
const BG: Record<ColorKey, string> = {
  blue:   "#0e2040",
  green:  "#082818",
  amber:  "#2a1a00",
  teal:   "#041c28",
  purple: "#1a1040",
  dim:    "#0e1a28",
};

// ─── NODE DATA ────────────────────────────────────────────────
const NODES: NodeDef[] = [
  // AUTH
  { id:"entry",    icon:"🌐", label:"TSR Application",  sub:"Entry point",           color:"blue",   cx:COL(3), cy:ROW.auth,        shape:"pill",    tip:"Public landing page. Hero, 12-stage marquee, features, role-based CTA buttons." },
  { id:"hasacct",  icon:"❓", label:"Has Account?",     sub:"Session check",         color:"amber",  cx:COL(2), cy:ROW.auth,        shape:"diamond", tip:"Checks for existing session. Yes → Login. No → Register." },
  { id:"register", icon:"📝", label:"Register",         sub:"Name · Email · Hash",   color:"blue",   cx:COL(1), cy:ROW.auth,        shape:"rect",    tip:"New users create account. Password hashed with bcryptjs. Role defaults to STUDENT." },
  { id:"login",    icon:"🔑", label:"Login",            sub:"Email · Password · JWT",color:"blue",   cx:COL(2), cy:ROW.auth - 150,  shape:"rect",    tip:"Returning users sign in. Issues JWT with role + profile data via jose." },
  { id:"rolechk",  icon:"🛡️", label:"Role Check",      sub:"STUDENT · TEACHER",     color:"teal",   cx:COL(4), cy:ROW.auth,        shape:"diamond", tip:"Reads role from JWT. STUDENT → game setup check. TEACHER → teacher dashboard." },

  // STUDENT — s0
  { id:"setupchk", icon:"⚙️", label:"Setup Done?",      sub:"StudentProfile flag",   color:"amber",  cx:COL(3), cy:ROW.s0,          shape:"diamond", tip:"Checks StudentProfile.setupDone. First-time users go through 4-step game setup." },
  { id:"gamesetup",icon:"⚔️", label:"Game Setup",       sub:"Avatar · Diff · Quest", color:"amber",  cx:COL(1), cy:ROW.s0,          shape:"rect",    tip:"4 steps: Name+Section → Avatar picker → Difficulty (Apprentice/Adventurer/Champion) → Quest scenario." },

  // STUDENT — s1
  { id:"studash",  icon:"🏠", label:"Student Dashboard",sub:"Spotlight · Modules",   color:"amber",  cx:COL(3), cy:ROW.s1,          shape:"rect",    tip:"Main student hub. Active quest spotlight with 12-pip tracker, diagnostic snapshot, assigned modules." },

  // STUDENT — s2
  { id:"pretest",  icon:"📝", label:"Pre-Test",         sub:"20 items · Timed",      color:"teal",   cx:COL(0), cy:ROW.s2,          shape:"rect",    tip:"20-item baseline assessment. Covers 5 contexts. Auto-scored. Locked after first attempt." },
  { id:"mymodules",icon:"📚", label:"My Modules",       sub:"Assigned · Progress",   color:"amber",  cx:COL(1), cy:ROW.s2,          shape:"rect",    tip:"Lists all section-assigned modules. Active quest spotlight, status cards, filter/search, diagnostic snapshot." },
  { id:"myreport", icon:"📊", label:"My Report",        sub:"Clusters · Gaps",       color:"teal",   cx:COL(2), cy:ROW.s2,          shape:"rect",    tip:"Personal diagnostic breakdown. 4 cluster score bars. Weak stage alerts. Auto-generated after module completion." },
  { id:"posttest", icon:"✅", label:"Post-Test",        sub:"Parallel · Gain",       color:"teal",   cx:COL(3), cy:ROW.s2,          shape:"rect",    tip:"Parallel form test. Same MELCs, different values. Unlocks after module completion. Compared with pre-test." },
  { id:"achieve",  icon:"🏆", label:"Achievements",    sub:"XP · Badges · Streak",  color:"amber",  cx:COL(4), cy:ROW.s2,          shape:"rect",    tip:"Gamification hub. XP, level, day streak, badge collection earned via stage completions and milestones." },

  // STUDENT — s3
  { id:"moddetail",icon:"📋", label:"Module Detail",   sub:"Scenario · Scores · CTA",color:"amber", cx:COL(1), cy:ROW.s3,          shape:"rect",    tip:"Modal showing full module info: scenario text, phase scores, MELC tags, difficulty. Resume or Start CTA." },

  // STUDENT — s4
  { id:"engine",   icon:"🧩", label:"12-Stage Engine", sub:"StageWrapper · Auto-save",color:"amber",cx:COL(1), cy:ROW.s4,          shape:"rect",    tip:"Core engine. StageWrapper renders the right component per stageNumber. AnimatePresence transitions. Timer + hint tracking. Auto-saves every response." },

  // STUDENT — s5
  { id:"s1to3",    icon:"🔵", label:"Stages 1–3",      sub:"Understanding",          color:"blue",   cx:COL(0), cy:ROW.s5,          shape:"rect",    tip:"Stage 1: Multiple choice — categorize. Stage 2: Drag-to-rank — prioritize. Stage 3: Open-ended — define problem." },
  { id:"s4to7",    icon:"🟣", label:"Stages 4–7",      sub:"Analysis",               color:"purple", cx:COL(1), cy:ROW.s5,          shape:"rect",    tip:"Stage 4: Table (given/missing/assumed). Stage 5: Constraint checklist. Stage 6: Root causes. Stage 7: Live budget calculator." },
  { id:"s8to10",   icon:"🟠", label:"Stages 8–10",     sub:"Solution Dev",           color:"amber",  cx:COL(2), cy:ROW.s5,          shape:"rect",    tip:"Stage 8: Multi-plan form (Plan A & B). Stage 9: Risk anticipation. Stage 10: Trial budget checker with live feedback." },
  { id:"s11to12",  icon:"🟢", label:"Stages 11–12",    sub:"Reflection",             color:"green",  cx:COL(3), cy:ROW.s5,          shape:"rect",    tip:"Stage 11: Select & justify best plan. Stage 12: Reflection slider + metacognitive prompts." },
  { id:"diaggen",  icon:"🗺️", label:"Diagnostic Gen",  sub:"4 clusters · Levels",   color:"teal",   cx:COL(4), cy:ROW.s5,          shape:"rect",    tip:"Auto-computed after Stage 12. Scores 4 phases, assigns PROFICIENT/DEVELOPING/STRUGGLING, flags weak stages." },

  // TEACHER
  { id:"tchdash",  icon:"👩‍🏫", label:"Teacher Dashboard",sub:"Overview · Alerts",  color:"green",  cx:COL(6), cy:ROW.s0,          shape:"rect",    tip:"Main teacher hub. Student completion stats, intervention alerts, pre/post bar chart, pending grade items." },
  { id:"tmodules", icon:"📦", label:"Module Mgmt",     sub:"Assign · Monitor",      color:"green",  cx:COL(5), cy:ROW.s1,          shape:"rect",    tip:"All assigned modules. Segmented completion bars, student avatar grid, cluster averages, intervention flags." },
  { id:"tstudents",icon:"👥", label:"Students",        sub:"Roster · Filter",       color:"green",  cx:COL(6), cy:ROW.s1,          shape:"rect",    tip:"Full student roster with section filter. Stage, score, and diagnostic level badge per student." },
  { id:"treports", icon:"📊", label:"Class Reports",   sub:"Heatmap · Export",      color:"teal",   cx:COL(7), cy:ROW.s1,          shape:"rect",    tip:"Diagnostic heatmap: rows=students, cols=4 clusters. Color-coded cells. PDF/CSV export for thesis research." },
  { id:"tassign",  icon:"📋", label:"Assign Module",   sub:"Section · Due Date",    color:"green",  cx:COL(5), cy:ROW.s2,          shape:"rect",    tip:"Modal: select module, pick sections (Narra/Molave/Kamagong/Yakal), set due date, configure unlock rules." },
  { id:"tdrawer",  icon:"👤", label:"Student Drawer",  sub:"Stages · Grade",        color:"green",  cx:COL(6), cy:ROW.s2,          shape:"rect",    tip:"Slide-in panel. Shows all 12 stage scores, diagnostic cluster bars, time spent. Grade open-ended items inline." },
  { id:"ttests",   icon:"📈", label:"Test Results",    sub:"Pre vs Post · Gain",    color:"teal",   cx:COL(7), cy:ROW.s2,          shape:"rect",    tip:"Class-wide pre/post comparison. Score gain per student. Export for experimental study analysis." },

  // DATABASE
  { id:"db_user",  icon:"👤", label:"User & Profile",  sub:"User · StudentProfile", color:"purple", cx:COL(0), cy:ROW.db,          shape:"db",      tip:"User(id,name,email,password,role) · StudentProfile(avatar,difficulty,xp,level,streak,setupDone) · Section" },
  { id:"db_mod",   icon:"📦", label:"Modules & Stages",sub:"Module · Stage · Assign",color:"purple",cx:COL(1), cy:ROW.db,          shape:"db",      tip:"Module(title,context,scenario,status) · Stage(stageNum,type,instruction,hint,correctAnswer) · ModuleAssignment" },
  { id:"db_prog",  icon:"📈", label:"Progress",        sub:"Progress · Response",   color:"purple", cx:COL(2), cy:ROW.db,          shape:"db",      tip:"ModuleProgress(currentStage,percentScore,timeSpentTotal) · StageResponse(answer,isCorrect,score,hintsUsed,teacherNote)" },
  { id:"db_diag",  icon:"🗺️", label:"Diagnostic",      sub:"DiagnosticReport",      color:"teal",   cx:COL(3), cy:ROW.db,          shape:"db",      tip:"DiagnosticReport(4 cluster scores, 4 levels, weakStages, strongStages, needsIntervention, interventionNote)" },
  { id:"db_test",  icon:"📝", label:"Tests",           sub:"TestSet · Result",      color:"purple", cx:COL(4), cy:ROW.db,          shape:"db",      tip:"TestSet(type,timeLimit) · TestQuestion(text,answer,difficulty,melc) · TestResult(score,percentScore) · TestResponse" },
  { id:"db_sess",  icon:"🔐", label:"Sessions",        sub:"JWT · UserSession",     color:"purple", cx:COL(5), cy:ROW.db,          shape:"db",      tip:"UserSession(token,expiresAt) · jose JWT · proxy.ts route protection for /dashboard/student/* and /dashboard/teacher/*" },
  { id:"db_api",   icon:"⚡", label:"API Routes",      sub:"Next.js App Router",    color:"purple", cx:COL(6), cy:ROW.db,          shape:"db",      tip:"/api/auth · /api/modules · /api/student/modules/[id]/stage/[n] · /api/teacher/responses/[id]/score · /api/admin/*" },
];

// ─── EDGE DATA ────────────────────────────────────────────────
const EDGES: EdgeDef[] = [
  // Auth flow
  { from:"entry",    to:"hasacct",  label:"",       color:"blue",   dashed:false },
  { from:"entry",    to:"rolechk",  label:"",       color:"blue",   dashed:false },
  { from:"hasacct",  to:"login",    label:"yes",    color:"blue",   dashed:false },
  { from:"hasacct",  to:"register", label:"no",     color:"amber",  dashed:false },
  { from:"register", to:"login",    label:"",       color:"blue",   dashed:false },
  { from:"login",    to:"rolechk",  label:"",       color:"blue",   dashed:false },
  { from:"rolechk",  to:"setupchk", label:"student",color:"amber",  dashed:false },
  { from:"rolechk",  to:"tchdash",  label:"teacher",color:"green",  dashed:false },
  // Student setup
  { from:"setupchk", to:"gamesetup",label:"no",     color:"amber",  dashed:false },
  { from:"setupchk", to:"studash",  label:"yes",    color:"amber",  dashed:false },
  { from:"gamesetup",to:"studash",  label:"done",   color:"amber",  dashed:false },
  // Student dashboard → pages
  { from:"studash",  to:"pretest",  label:"",       color:"teal",   dashed:false },
  { from:"studash",  to:"mymodules",label:"",       color:"amber",  dashed:false },
  { from:"studash",  to:"myreport", label:"",       color:"teal",   dashed:false },
  { from:"studash",  to:"posttest", label:"",       color:"teal",   dashed:false },
  { from:"studash",  to:"achieve",  label:"",       color:"amber",  dashed:false },
  // Module path
  { from:"mymodules",to:"moddetail",label:"select", color:"amber",  dashed:false },
  { from:"moddetail",to:"engine",   label:"start",  color:"amber",  dashed:false },
  // Stage progression
  { from:"engine",   to:"s1to3",    label:"",       color:"blue",   dashed:false },
  { from:"engine",   to:"s4to7",    label:"",       color:"purple", dashed:false },
  { from:"engine",   to:"s8to10",   label:"",       color:"amber",  dashed:false },
  { from:"engine",   to:"s11to12",  label:"",       color:"green",  dashed:false },
  { from:"s1to3",    to:"s4to7",    label:"next",   color:"blue",   dashed:false },
  { from:"s4to7",    to:"s8to10",   label:"next",   color:"purple", dashed:false },
  { from:"s8to10",   to:"s11to12",  label:"next",   color:"amber",  dashed:false },
  { from:"s11to12",  to:"diaggen",  label:"done",   color:"green",  dashed:false },
  // Diagnostic outputs
  { from:"diaggen",  to:"myreport", label:"saves",  color:"teal",   dashed:false },
  { from:"diaggen",  to:"posttest", label:"unlock", color:"teal",   dashed:false },
  // Teacher paths
  { from:"tchdash",  to:"tmodules", label:"",       color:"green",  dashed:false },
  { from:"tchdash",  to:"tstudents",label:"",       color:"green",  dashed:false },
  { from:"tchdash",  to:"treports", label:"",       color:"teal",   dashed:false },
  { from:"tmodules", to:"tassign",  label:"",       color:"green",  dashed:false },
  { from:"tstudents",to:"tdrawer",  label:"",       color:"green",  dashed:false },
  { from:"treports", to:"ttests",   label:"",       color:"teal",   dashed:false },
  // DB saves (dashed)
  { from:"gamesetup",to:"db_user",  label:"save",   color:"dim",    dashed:true  },
  { from:"login",    to:"db_sess",  label:"session",color:"dim",    dashed:true  },
  { from:"engine",   to:"db_prog",  label:"save",   color:"dim",    dashed:true  },
  { from:"diaggen",  to:"db_diag",  label:"save",   color:"dim",    dashed:true  },
  { from:"pretest",  to:"db_test",  label:"save",   color:"dim",    dashed:true  },
  { from:"posttest", to:"db_test",  label:"save",   color:"dim",    dashed:true  },
  { from:"tassign",  to:"db_mod",   label:"save",   color:"dim",    dashed:true  },
  { from:"tdrawer",  to:"db_prog",  label:"grade",  color:"dim",    dashed:true  },
];

// ─── PORT HELPERS ─────────────────────────────────────────────
type Direction = "top" | "bottom" | "left" | "right";

function getPort(node: NodeDef, dir: Direction): [number, number] {
  const hw = NW / 2, hh = NH / 2;
  if (dir === "top")    return [node.cx,      node.cy - hh];
  if (dir === "bottom") return [node.cx,      node.cy + hh];
  if (dir === "left")   return [node.cx - hw, node.cy];
  return                       [node.cx + hw, node.cy];
}

function smartPorts(from: NodeDef, to: NodeDef): [[number,number],[number,number]] {
  const dx = to.cx - from.cx, dy = to.cy - from.cy;
  const ax = Math.abs(dx),    ay = Math.abs(dy);
  if (dy >  40 && ay > ax * 0.6) return [getPort(from,"bottom"), getPort(to,"top")];
  if (dy < -40 && ay > ax * 0.6) return [getPort(from,"top"),    getPort(to,"bottom")];
  if (dx > 0)                     return [getPort(from,"right"),  getPort(to,"left")];
  return                                 [getPort(from,"left"),   getPort(to,"right")];
}

// ─── ARROW COMPONENT ──────────────────────────────────────────
function Arrow({ from, to, label, color, dashed, markerId }: EdgeDef & { markerId: string }) {
  const fromNode = NODES.find(n => n.id === from);
  const toNode   = NODES.find(n => n.id === to);
  if (!fromNode || !toNode) return null;

  const [[x1,y1],[x2,y2]] = smartPorts(fromNode, toNode);
  const dx = x2 - x1, dy = y2 - y1;

  let d: string;
  if (Math.abs(dy) > Math.abs(dx) * 0.6) {
    const cy1 = y1 + dy * 0.45, cy2 = y2 - dy * 0.45;
    d = `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;
  } else {
    const cx1 = x1 + dx * 0.45, cx2 = x2 - dx * 0.45;
    d = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  }

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const col = C[color];

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={col}
        strokeWidth={dashed ? 1.2 : 1.8}
        strokeDasharray={dashed ? "5,4" : undefined}
        markerEnd={`url(#${markerId})`}
        opacity={dashed ? 0.55 : 0.9}
      />
      {label && (
        <g>
          <rect x={mx - 18} y={my - 8} width={36} height={15} rx={5} fill="#07111f" opacity={0.9} />
          <text
            x={mx} y={my + 0.5}
            fontFamily="Nunito,sans-serif" fontWeight={700} fontSize={8}
            fill={col} textAnchor="middle" dominantBaseline="middle"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── LANE COMPONENT ───────────────────────────────────────────
function Lane({ label, yTop, height, color, bgColor }: {
  label: string; yTop: number; height: number; color: string; bgColor: string;
}) {
  return (
    <g>
      <rect x={0} y={yTop} width={9999} height={height} fill={bgColor} />
      <rect x={0} y={yTop} width={9999} height={1}      fill={color}   opacity={0.3} />
      <rect x={12} y={yTop + 6} width={8} height={height - 12} rx={4}  fill={color} opacity={0.35} />
      <foreignObject x={28} y={yTop + 8} width={220} height={24}>
        <div
          // @ts-expect-error xmlns is valid in foreignObject context
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 10,
            letterSpacing: ".1em", textTransform: "uppercase",
            color, opacity: 0.9,
          }}
        >
          {label}
        </div>
      </foreignObject>
    </g>
  );
}

// ─── NODE COMPONENT ───────────────────────────────────────────
function WorkflowNode({
  node, selected, onClick,
}: {
  node: NodeDef; selected: boolean; onClick: (id: string) => void;
}) {
  const color = C[node.color];
  const bg    = BG[node.color];

  const style: React.CSSProperties = {
    position:  "absolute",
    left:      node.cx - NW / 2,
    top:       node.cy - NH / 2,
    width:     NW,
    minHeight: NH,
    cursor:    "pointer",
    userSelect:"none",
    background: bg,
    border:    `1.5px solid ${selected ? "#fbbf24" : color}`,
    boxShadow: selected
      ? `0 0 0 2px #fbbf24, 0 6px 24px ${color}44`
      : `0 2px 12px rgba(0,0,0,.5)`,
    borderRadius: node.shape === "pill" ? 40 : node.shape === "db" ? 8 : 10,
    borderTop:    node.shape === "db"   ? `3px solid ${color}` : undefined,
    padding:   "10px 12px",
    textAlign: "center",
    transition:"transform .18s, box-shadow .18s",
    fontFamily:"'DM Sans', sans-serif",
  };

  return (
    <div style={style} onClick={() => onClick(node.id)}>
      <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{node.icon}</div>
      <div style={{
        fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 11,
        color: node.shape === "pill" ? "#fff" : "#ddeeff", lineHeight: 1.3,
      }}>
        {node.label}
      </div>
      <div style={{ fontSize: 9, color: "#5a88aa", marginTop: 3, lineHeight: 1.4 }}>
        {node.sub}
      </div>
      {node.shape === "diamond" && (
        <div style={{
          position: "absolute", inset: 0,
          border: `1.5px dashed ${color}`,
          borderRadius: 6,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

// ─── MAIN DIAGRAM ─────────────────────────────────────────────
export default function WorkflowDiagram() {
  const [selected,    setSelected]    = useState<string | null>(null);
  const [tx,          setTx]          = useState(0);
  const [ty,          setTy]          = useState(0);
  const [scale,       setScale]       = useState(0.58);
  const dragging  = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });
  const vpRef     = useRef<HTMLDivElement>(null);

  const maxX = Math.max(...NODES.map(n => n.cx)) + NW / 2 + 60;
  const maxY = Math.max(...NODES.map(n => n.cy)) + NH / 2 + 60;

  // Pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setTx(v => v + e.clientX - lastPos.current.x);
    setTy(v => v + e.clientY - lastPos.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Zoom (wheel)
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta  = e.deltaY < 0 ? 0.08 : -0.08;
    const vpRect = vpRef.current!.getBoundingClientRect();
    const cx     = e.clientX - vpRect.left;
    const cy     = e.clientY - vpRect.top;
    setScale(s => {
      const ns = Math.min(2, Math.max(0.2, s + delta));
      setTx(t => cx - (cx - t) * (ns / s));
      setTy(t => cy - (cy - t) * (ns / s));
      return ns;
    });
  }, []);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Fit on mount
  useEffect(() => {
    const vpRect = vpRef.current?.getBoundingClientRect();
    if (!vpRect) return;
    const sc = Math.min(vpRect.width / (maxX + 40), (vpRect.height - 54) / (maxY + 40)) * 0.88;
    setScale(sc);
    setTx((vpRect.width - maxX * sc) / 2);
    setTy(20);
  }, [maxX, maxY]);

  function resetView() {
    const vpRect = vpRef.current?.getBoundingClientRect();
    if (!vpRect) return;
    const sc = Math.min(vpRect.width / (maxX + 40), (vpRect.height - 54) / (maxY + 40)) * 0.88;
    setScale(sc);
    setTx((vpRect.width - maxX * sc) / 2);
    setTy(20);
  }

  function handleNodeClick(id: string) {
    setSelected(prev => prev === id ? null : id);
  }

  const selectedNode = NODES.find(n => n.id === selected);

  const lanes = [
    { label:"🌐  Auth / Entry",  yTop: ROW.auth - NH/2 - 20, height: 130,  color:"#3b82f6", bgColor:"rgba(59,130,246,.04)"  },
    { label:"👨‍🎓  Student Flow", yTop: ROW.s0   - NH/2 - 16, height: 810,  color:"#f59e0b", bgColor:"rgba(245,158,11,.025)" },
    { label:"👩‍🏫  Teacher Flow", yTop: ROW.s0   - NH/2 - 18, height: 810,  color:"#10b981", bgColor:"rgba(16,185,129,.02)"  },
    { label:"🗄  Database",      yTop: ROW.db   - NH/2 - 16, height: 140,  color:"#8b5cf6", bgColor:"rgba(139,92,246,.04)"  },
  ];

  // Arrow markers (one per color)
  const markerColors: { key: ColorKey; id: string }[] = [
    { key:"blue",   id:"m-blue"   },
    { key:"green",  id:"m-green"  },
    { key:"amber",  id:"m-amber"  },
    { key:"teal",   id:"m-teal"   },
    { key:"purple", id:"m-purple" },
    { key:"dim",    id:"m-dim"    },
  ];

  const colorMarkerMap: Record<ColorKey, string> = {
    blue:   "m-blue",
    green:  "m-green",
    amber:  "m-amber",
    teal:   "m-teal",
    purple: "m-purple",
    dim:    "m-dim",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#07111f", overflow:"hidden" }}>

      {/* TOPBAR */}
      <div style={{
        height: 52, flexShrink: 0,
        background:"#0f2035", borderBottom:"1px solid #1a3350",
        display:"flex", alignItems:"center", padding:"0 20px", gap:16,
        fontFamily:"'DM Sans',sans-serif",
      }}>
        {/* Back link */}
        <Link
          href="/admin"
          style={{ color:"#5a88aa", fontSize:12, textDecoration:"none", display:"flex", alignItems:"center", gap:4, flexShrink:0 }}
        >
          ← Admin
        </Link>
        <div style={{ width:1, height:24, background:"#1a3350", flexShrink:0 }}/>

        {/* Logo */}
        <div style={{
          width:32, height:32, borderRadius:8,
          background:"linear-gradient(135deg,#3b82f6,#10b981)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:13, color:"#fff", fontFamily:"'Nunito',sans-serif", flexShrink:0,
        }}>T</div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>
            <span style={{ color:"#3b82f6" }}>TSR</span> Application Workflow
          </div>
          <div style={{ fontSize:10, color:"#5a88aa" }}>Think · Solve · Reflect — Full System Map</div>
        </div>

        <div style={{ width:1, height:24, background:"#1a3350", flexShrink:0, margin:"0 4px" }}/>

        {/* Legend */}
        {([
          ["Auth",       "#3b82f6"],
          ["Student",    "#f59e0b"],
          ["Teacher",    "#10b981"],
          ["Diagnostic", "#06b6d4"],
          ["Database",   "#8b5cf6"],
        ] as [string,string][]).map(([lbl,col]) => (
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:"#5a88aa" }}>
            <div style={{ width:10, height:10, borderRadius:3, background:col, flexShrink:0 }}/>
            {lbl}
          </div>
        ))}

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {/* Zoom controls */}
          {([
            ["−", () => setScale(s => Math.max(0.2, s - 0.1))],
            ["+", () => setScale(s => Math.min(2,   s + 0.1))],
          ] as [string, () => void][]).map(([lbl, fn]) => (
            <button key={lbl} onClick={fn} style={{
              width:28, height:28, borderRadius:6,
              background:"#1a3350", border:"1px solid #253f5e",
              color:"#ddeeff", fontSize:16, lineHeight:1, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>{lbl}</button>
          ))}
          <button onClick={resetView} style={{
            height:28, padding:"0 10px", borderRadius:6,
            background:"#1a3350", border:"1px solid #253f5e",
            color:"#5a88aa", fontSize:10, fontWeight:700, cursor:"pointer",
          }}>
            FIT
          </button>
          <span style={{ fontSize:10, color:"#334d6a", minWidth:36 }}>{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* CANVAS VIEWPORT */}
      <div
        ref={vpRef}
        style={{ flex:1, overflow:"hidden", position:"relative", cursor: dragging.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Transformed canvas */}
        <div style={{
          position:  "absolute",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "0 0",
          width:  maxX,
          height: maxY,
        }}>
          {/* SVG: lanes + arrows (below nodes) */}
          <svg
            style={{ position:"absolute", top:0, left:0, pointerEvents:"none" }}
            width={maxX}
            height={maxY}
          >
            <defs>
              {markerColors.map(({ key, id }) => (
                <marker
                  key={id}
                  id={id}
                  markerWidth={8}
                  markerHeight={8}
                  refX={7}
                  refY={3}
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={C[key]} opacity={key === "dim" ? 0.6 : 0.9} />
                </marker>
              ))}
            </defs>

            {/* Lanes */}
            {lanes.map(l => <Lane key={l.label} {...l} />)}

            {/* Arrows */}
            {EDGES.map((e, i) => (
              <Arrow key={i} {...e} markerId={colorMarkerMap[e.color]} />
            ))}
          </svg>

          {/* Nodes (above SVG) */}
          {NODES.map(n => (
            <WorkflowNode
              key={n.id}
              node={n}
              selected={selected === n.id}
              onClick={handleNodeClick}
            />
          ))}
        </div>

        {/* Tooltip panel — fixed to viewport bottom-left */}
        {selectedNode && (
          <div style={{
            position:  "absolute",
            bottom:    20,
            left:      20,
            maxWidth:  320,
            background:"#0f2035",
            border:    `1.5px solid ${C[selectedNode.color]}`,
            borderRadius: 12,
            padding:   "14px 16px",
            boxShadow: `0 4px 24px rgba(0,0,0,.6), 0 0 0 1px ${C[selectedNode.color]}33`,
            fontFamily:"'DM Sans',sans-serif",
            zIndex:    50,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:20 }}>{selectedNode.icon}</span>
              <div>
                <div style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, color:"#ddeeff" }}>
                  {selectedNode.label}
                </div>
                <div style={{ fontSize:10, color:C[selectedNode.color], fontWeight:700, marginTop:1 }}>
                  {selectedNode.sub}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ marginLeft:"auto", background:"none", border:"none", color:"#334d6a", cursor:"pointer", fontSize:16, lineHeight:1 }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize:12, color:"#7a9cc4", lineHeight:1.6, margin:0 }}>
              {selectedNode.tip}
            </p>
          </div>
        )}

        {/* Hint */}
        {!selectedNode && (
          <div style={{
            position:"absolute", bottom:20, left:20,
            fontSize:10, color:"#334d6a", fontFamily:"'DM Sans',sans-serif",
            pointerEvents:"none",
          }}>
            Scroll to zoom · Drag to pan · Click a node for details
          </div>
        )}
      </div>
    </div>
  );
}
