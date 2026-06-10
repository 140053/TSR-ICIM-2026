// app/api/modules/available/route.ts
//
// Returns the list of ACTIVE modules available to a student —
// used by the onboarding quest-picker step.
// Modules already started by this student are still returned
// (the UI can decide whether to show them).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getSessionUser(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Get student's section + context list in parallel
    const [profile, ctxList] = await Promise.all([
      prisma.studentProfile.findUnique({
        where:  { userId: session.id },
        select: { sectionId: true },
      }),
      prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    const ctxMap = new Map(ctxList.map((c) => [c.key, c]));

    // 3. Get modules assigned to this section (or all active if no section)
    const assignments = profile?.sectionId
      ? await prisma.moduleAssignment.findMany({
          where:   { sectionId: profile.sectionId },
          include: { module: true },
        })
      : [];

    // If no section assignments, fall back to all ACTIVE modules
    const modulesToShow = assignments.length > 0
      ? assignments.map((a) => a.module)
      : await prisma.module.findMany({
          where:   { status: "ACTIVE" },
          orderBy: { id: "asc" },
        });

    // 4. Check how many modules this student has already completed
    //    (to determine which are locked by unlockAfter)
    const completedCount = await prisma.moduleProgress.count({
      where: { userId: session.id, status: "COMPLETED" },
    });

    // 5. Shape the response
    const modules = modulesToShow.map((m) => {
      const ctx    = ctxMap.get(m.context);
      const locked = m.isLocked || (m.unlockAfter != null && completedCount < m.unlockAfter);

      return {
        id:     m.id,
        icon:   ctx?.icon ?? m.icon,
        title:  m.title,
        desc:   m.scenario.slice(0, 160),
        pills:  [
          ...(ctx?.description ? [`${ctx.icon} ${ctx.description}`] : []),
          ...(locked ? [`🔒 Complete ${m.unlockAfter} quest${(m.unlockAfter ?? 1) > 1 ? "s" : ""} first`] : []),
        ],
        color:  ctx?.color ?? "#64748B",
        tagCls: "",
        border: "border-[#243558]",
        shadow: "",
        locked,
      };
    });

    return NextResponse.json(
      { success: true, modules },
      { status: 200 }
    );
  } catch (err) {
    console.error("[MODULES/AVAILABLE]", err);
    return NextResponse.json(
      { success: false, error: "Failed to load modules." },
      { status: 500 }
    );
  }
}