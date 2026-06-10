// PATCH /api/admin/modules/[id]  — update module metadata
// DELETE /api/admin/modules/[id] — permanently delete module + all related data
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id))
    return NextResponse.json({ success: false, error: "Invalid module id" }, { status: 400 });

  const body = await req.json();
  const {
    title, icon, subtitle, scenario, context,
    status, isLocked, unlockAfter, gradeLevel, timeEstimate, bannerUrl,
  } = body;

  // Build update payload — only include provided fields
  const data: Record<string, unknown> = {};
  if (typeof title        === "string" && title.trim())       data.title        = title.trim();
  if (typeof icon         === "string" && icon.trim())        data.icon         = icon.trim();
  if (typeof subtitle     === "string")                       data.subtitle     = subtitle.trim() || null;
  if (typeof scenario     === "string" && scenario.trim())    data.scenario     = scenario.trim();
  if (bannerUrl !== undefined)                                data.bannerUrl    = bannerUrl || null;
  if (typeof context      === "string" && context.trim())     data.context      = context.trim();
  if (typeof gradeLevel   === "string" && gradeLevel.trim())  data.gradeLevel   = gradeLevel.trim();
  if (typeof isLocked     === "boolean")                      data.isLocked     = isLocked;
  if (status !== undefined) {
    const s = String(status).toUpperCase();
    if (["ACTIVE","DRAFT","ARCHIVED"].includes(s)) data.status = s;
  }
  if (unlockAfter !== undefined)  data.unlockAfter  = unlockAfter  != null ? Number(unlockAfter)  : null;
  if (timeEstimate !== undefined) data.timeEstimate = timeEstimate != null ? Number(timeEstimate) : null;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ success: false, error: "No valid fields to update." }, { status: 400 });

  try {
    const updated = await prisma.module.update({ where: { id }, data });
    return NextResponse.json({ success: true, module: { id: updated.id, title: updated.title } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update module.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id))
    return NextResponse.json({ success: false, error: "Invalid module id" }, { status: 400 });

  try {
    // Delete in dependency order to avoid FK constraint errors
    await prisma.diagnosticReport.deleteMany({ where: { moduleId: id } });
    await prisma.stageResponse.deleteMany({ where: { moduleId: id } });
    await prisma.moduleProgress.deleteMany({ where: { moduleId: id } });
    await prisma.moduleAssignment.deleteMany({ where: { moduleId: id } });
    await prisma.moduleQuizResponse.deleteMany({ where: { moduleId: id } });
    await prisma.moduleQuizQuestion.deleteMany({ where: { moduleId: id } });
    await prisma.stage.deleteMany({ where: { moduleId: id } });
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete module.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
