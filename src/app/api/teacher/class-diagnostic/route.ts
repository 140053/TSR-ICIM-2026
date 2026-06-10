// GET /api/teacher/class-diagnostic
//
// Aggregates DiagnosticReport data for all students in the teacher's active
// sections.  Returns three layers of detail:
//
//   summary        — cross-section class totals
//   sections[]     — per-section breakdown with cluster averages, level
//                    distributions, top weak/strong stages, intervention list
//     └─ modules[] — per-module drill-down inside each section
//
// Query params (all optional):
//   moduleId=<n>   — filter to a single module
//   sectionId=<n>  — filter to a single section

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// ─── Internal helpers ─────────────────────────────────────────

function roundOrNull(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(v);
}

function level(avg: number | null): "PROFICIENT" | "DEVELOPING" | "STRUGGLING" | null {
  if (avg == null) return null;
  if (avg >= 80) return "PROFICIENT";
  if (avg >= 60) return "DEVELOPING";
  return "STRUGGLING";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// Average a list of numbers; returns null when the list is empty.
function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((v): v is number => v != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// Count how many values fall in each diagnostic level bucket.
function levelDist(nums: (number | null)[]) {
  let proficient = 0, developing = 0, struggling = 0, noData = 0;
  for (const v of nums) {
    if (v == null)  { noData++;     continue; }
    if (v >= 80)    { proficient++; continue; }
    if (v >= 60)    { developing++; continue; }
    struggling++;
  }
  return { proficient, developing, struggling, noData };
}

// Flatten a JSON weak/strong stages field into number[].
function parseStages(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is number => typeof v === "number");
}

// Count stage occurrences and return the top-N by frequency.
function topStages(stageLists: number[][], n = 5): number[] {
  const freq = new Map<number, number>();
  for (const list of stageLists) {
    for (const s of list) freq.set(s, (freq.get(s) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([stage]) => stage);
}

// ─── Types returned in the response ──────────────────────────

interface ClusterStats {
  avg:         number | null;
  level:       "PROFICIENT" | "DEVELOPING" | "STRUGGLING" | null;
  proficient:  number;
  developing:  number;
  struggling:  number;
  noData:      number;
}

interface ModuleBreakdown {
  moduleId:          number;
  moduleTitle:       string;
  moduleIcon:        string;
  studentsWithData:  number;
  clusters: {
    understanding: ClusterStats;
    analysis:      ClusterStats;
    solution:      ClusterStats;
    reflection:    ClusterStats;
  };
  overall:           ClusterStats;
  interventionCount: number;
  topWeakStages:     number[];
  topStrongStages:   number[];
}

interface StudentIntervention {
  userId:      number;
  name:        string;
  initials:    string;
  avatarEmoji: string;
  difficulty:  string;
  overall:     number | null;
  note:        string | null;
  moduleId:    number;
  moduleTitle: string;
}

interface SectionDiagnostic {
  sectionId:    number;
  sectionName:  string;
  sectionEmoji: string;
  gradeLevel:   string;
  studentCount: number;
  clusters: {
    understanding: ClusterStats;
    analysis:      ClusterStats;
    solution:      ClusterStats;
    reflection:    ClusterStats;
  };
  overall:                    ClusterStats;
  interventionCount:          number;
  studentsNeedingIntervention: StudentIntervention[];
  topWeakStages:              number[];
  topStrongStages:            number[];
  modules:                    ModuleBreakdown[];
}

interface ClassDiagnosticSummary {
  totalStudents:     number;
  studentsWithData:  number;
  interventionCount: number;
  clusters: {
    understanding: ClusterStats;
    analysis:      ClusterStats;
    solution:      ClusterStats;
    reflection:    ClusterStats;
  };
  overall: ClusterStats;
}

// ─── Helper: build ClusterStats for a set of DiagnosticReport rows ────────

function buildClusterStats(
  reports: { understandingScore?: number | null; analysisScore?: number | null; solutionScore?: number | null; reflectionScore?: number | null; overallScore?: number | null }[]
) {
  const make = (vals: (number | null)[]): ClusterStats => {
    const a = avg(vals);
    return { avg: a, level: level(a), ...levelDist(vals) };
  };

  return {
    understanding: make(reports.map((r) => roundOrNull(r.understandingScore))),
    analysis:      make(reports.map((r) => roundOrNull(r.analysisScore))),
    solution:      make(reports.map((r) => roundOrNull(r.solutionScore))),
    reflection:    make(reports.map((r) => roundOrNull(r.reflectionScore))),
    overall:       make(reports.map((r) => roundOrNull(r.overallScore))),
  };
}

// ─── Route handler ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const url        = new URL(req.url);
  const moduleFilter  = url.searchParams.get("moduleId")  ? parseInt(url.searchParams.get("moduleId")!)  : null;
  const sectionFilter = url.searchParams.get("sectionId") ? parseInt(url.searchParams.get("sectionId")!) : null;

  // 1. Fetch teacher with active sections + students + module assignments
  const teacher = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      teacherOf: {
        where: {
          isActive: true,
          ...(sectionFilter != null && { id: sectionFilter }),
        },
        orderBy: { name: "asc" },
        include: {
          students: {
            include: { user: true },
            orderBy: { user: { name: "asc" } },
          },
          moduleAssignments: {
            include: { module: { select: { id: true, title: true, icon: true, context: true } } },
            orderBy: { assignedAt: "asc" },
          },
        },
      },
    },
  });

  if (!teacher)
    return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });

  // 2. Collect all student IDs across the (optionally filtered) sections
  const allStudentIds = teacher.teacherOf.flatMap((sec) =>
    sec.students.map((s) => s.userId)
  );

  if (allStudentIds.length === 0) {
    return NextResponse.json({
      success: true,
      sections: [],
      summary: {
        totalStudents:     0,
        studentsWithData:  0,
        interventionCount: 0,
        clusters: buildClusterStats([]),
        overall: { avg: null, level: null, proficient: 0, developing: 0, struggling: 0, noData: 0 },
      },
    });
  }

  // 3. Fetch all diagnostic reports (optionally filtered by module)
  const diagReports = await prisma.diagnosticReport.findMany({
    where: {
      userId:   { in: allStudentIds },
      ...(moduleFilter != null && { moduleId: moduleFilter }),
    },
  });

  // Index: `userId_moduleId` → report
  const diagMap = new Map(diagReports.map((d) => [`${d.userId}_${d.moduleId}`, d]));

  // ─── 4. Build per-section data ────────────────────────────────

  const sections: SectionDiagnostic[] = teacher.teacherOf.map((sec) => {
    const studentIds = sec.students.map((s) => s.userId);

    const moduleAssignments = moduleFilter != null
      ? sec.moduleAssignments.filter((a) => a.moduleId === moduleFilter)
      : sec.moduleAssignments;

    // Build per-module breakdowns
    const modules: ModuleBreakdown[] = moduleAssignments.map((assignment) => {
      const mod = assignment.module;

      // Reports for this module across this section's students
      const modReports = studentIds
        .map((uid) => diagMap.get(`${uid}_${mod.id}`))
        .filter((r): r is NonNullable<typeof r> => r != null);

      const clusters = buildClusterStats(modReports);

      const interventionStudents = modReports.filter((r) => r.needsIntervention);

      const weakStageLists   = modReports.map((r) => parseStages(r.weakStages));
      const strongStageLists = modReports.map((r) => parseStages(r.strongStages));

      return {
        moduleId:          mod.id,
        moduleTitle:       mod.title,
        moduleIcon:        mod.icon,
        studentsWithData:  modReports.length,
        clusters: {
          understanding: clusters.understanding,
          analysis:      clusters.analysis,
          solution:      clusters.solution,
          reflection:    clusters.reflection,
        },
        overall:           clusters.overall,
        interventionCount: interventionStudents.length,
        topWeakStages:     topStages(weakStageLists),
        topStrongStages:   topStages(strongStageLists),
      };
    });

    // Aggregate all reports for this section (across all its modules)
    const allSecReports = studentIds
      .flatMap((uid) =>
        moduleAssignments.map((a) => diagMap.get(`${uid}_${a.module.id}`))
      )
      .filter((r): r is NonNullable<typeof r> => r != null);

    const secClusters = buildClusterStats(allSecReports);

    const allWeakLists   = allSecReports.map((r) => parseStages(r.weakStages));
    const allStrongLists = allSecReports.map((r) => parseStages(r.strongStages));

    // Build intervention list (deduplicated per student — worst overall)
    const interventionMap = new Map<number, StudentIntervention>();
    for (const assignment of moduleAssignments) {
      const mod = assignment.module;
      for (const profile of sec.students) {
        const uid    = profile.userId;
        const report = diagMap.get(`${uid}_${mod.id}`);
        if (!report?.needsIntervention) continue;

        const existing = interventionMap.get(uid);
        const overall  = roundOrNull(report.overallScore);
        // Keep the worst-scoring module entry per student
        if (!existing || (overall != null && (existing.overall == null || overall < existing.overall))) {
          interventionMap.set(uid, {
            userId:      uid,
            name:        profile.user.name,
            initials:    initials(profile.user.name),
            avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
            difficulty:  profile.difficulty,
            overall,
            note:        report.interventionNote ?? null,
            moduleId:    mod.id,
            moduleTitle: mod.title,
          });
        }
      }
    }

    return {
      sectionId:    sec.id,
      sectionName:  sec.name,
      sectionEmoji: sec.emoji,
      gradeLevel:   sec.gradeLevel,
      studentCount: sec.students.length,
      clusters: {
        understanding: secClusters.understanding,
        analysis:      secClusters.analysis,
        solution:      secClusters.solution,
        reflection:    secClusters.reflection,
      },
      overall:                     secClusters.overall,
      interventionCount:           interventionMap.size,
      studentsNeedingIntervention: [...interventionMap.values()],
      topWeakStages:               topStages(allWeakLists),
      topStrongStages:             topStages(allStrongLists),
      modules,
    };
  });

  // ─── 5. Cross-section summary ─────────────────────────────────

  const allClusters = buildClusterStats(diagReports);

  const summary: ClassDiagnosticSummary = {
    totalStudents:     allStudentIds.length,
    studentsWithData:  new Set(diagReports.map((d) => d.userId)).size,
    interventionCount: sections.reduce((sum, s) => sum + s.interventionCount, 0),
    clusters: {
      understanding: allClusters.understanding,
      analysis:      allClusters.analysis,
      solution:      allClusters.solution,
      reflection:    allClusters.reflection,
    },
    overall: allClusters.overall,
  };

  return NextResponse.json({ success: true, sections, summary });
}
