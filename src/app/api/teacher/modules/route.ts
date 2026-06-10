// GET /api/teacher/modules — returns modules assigned to the teacher's active sections
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const sections = await prisma.section.findMany({
    where:   { teacherId: session.id, isActive: true },
    include: { moduleAssignments: { include: { module: true } } },
  });

  const seen = new Set<number>();
  const modules: { id: number; title: string; icon: string }[] = [];
  for (const sec of sections) {
    for (const a of sec.moduleAssignments) {
      if (!seen.has(a.moduleId)) {
        seen.add(a.moduleId);
        modules.push({ id: a.moduleId, title: a.module.title, icon: a.module.icon });
      }
    }
  }
  modules.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ success: true, modules });
}
