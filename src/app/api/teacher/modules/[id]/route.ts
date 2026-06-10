// PATCH /api/teacher/modules/[id]
// Teacher: update module metadata.
// When status changes DRAFT → ACTIVE (publish), auto-assigns to the teacher's sections.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId))
    return NextResponse.json({ success: false, error: "Invalid module id" }, { status: 400 });

  // Verify the teacher has access: assigned to their section OR they created it
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module)
    return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });

  const assignment = await prisma.moduleAssignment.findFirst({
    where: { moduleId, section: { teacherId: session.id } },
  });

  if (!assignment && module.createdByUserId !== session.id) {
    return NextResponse.json({ success: false, error: "Not authorized to edit this module" }, { status: 403 });
  }

  const body = await req.json();
  const { title, icon, subtitle, scenario, context, status, timeEstimate, bannerUrl } = body;

  const data: Record<string, unknown> = {};
  if (typeof title       === "string" && title.trim())    data.title       = title.trim();
  if (typeof icon        === "string" && icon.trim())     data.icon        = icon.trim();
  if (typeof subtitle    === "string")                    data.subtitle    = subtitle.trim() || null;
  if (typeof scenario    === "string" && scenario.trim()) data.scenario    = scenario.trim();
  if (typeof context     === "string" && context.trim())  data.context     = context.trim();
  if (bannerUrl !== undefined)                            data.bannerUrl   = bannerUrl || null;
  if (timeEstimate !== undefined)
    data.timeEstimate = timeEstimate != null ? Math.max(0, Number(timeEstimate)) : null;

  let publishing = false;
  if (status !== undefined) {
    const s = String(status).toUpperCase();
    if (["ACTIVE", "DRAFT", "ARCHIVED"].includes(s)) {
      data.status = s;
      publishing  = s === "ACTIVE" && module.status === "DRAFT";
    }
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ success: false, error: "No valid fields to update." }, { status: 400 });

  try {
    const updated = await prisma.module.update({ where: { id: moduleId }, data });

    // When publishing a draft, auto-assign to all of the teacher's active sections
    if (publishing) {
      const sections = await prisma.section.findMany({
        where:  { teacherId: session.id, isActive: true },
        select: { id: true },
      });
      if (sections.length > 0) {
        await prisma.moduleAssignment.createMany({
          data: sections.map((sec) => ({ moduleId, sectionId: sec.id })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true, module: { id: updated.id, title: updated.title } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update module.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
