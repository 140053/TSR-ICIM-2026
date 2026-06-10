// /api/admin/test-sets/[id]
// PATCH  → update title, type, moduleId, description, timeLimit, isActive
// DELETE → delete (blocked if test results exist)

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tsId = parseInt(id);
  if (isNaN(tsId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const body = await req.json() as Partial<{
    title:       string;
    type:        "PRE_TEST" | "POST_TEST";
    moduleId:    number | null;
    description: string | null;
    timeLimit:   number | null;
    isActive:    boolean;
  }>;

  const updated = await prisma.testSet.update({
    where: { id: tsId },
    data: {
      ...(body.title       !== undefined && { title:       body.title?.trim() ?? ""      }),
      ...(body.type        !== undefined && { type:        body.type                      }),
      ...(body.moduleId    !== undefined && { moduleId:    body.moduleId                  }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.timeLimit   !== undefined && { timeLimit:   body.timeLimit                 }),
      ...(body.isActive    !== undefined && { isActive:    body.isActive                  }),
    },
  });

  return NextResponse.json({ success: true, testSet: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tsId = parseInt(id);
  if (isNaN(tsId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const ts = await prisma.testSet.findUnique({ where: { id: tsId } });
  if (!ts)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const resultCount = await prisma.testResult.count({ where: { testSetId: tsId } });
  if (resultCount > 0)
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${resultCount} student result(s) are linked to this test set.` },
      { status: 409 }
    );

  // Delete questions first (cascade isn't guaranteed by schema onDelete)
  await prisma.testQuestion.deleteMany({ where: { testSetId: tsId } });
  await prisma.testSet.delete({ where: { id: tsId } });

  return NextResponse.json({ success: true });
}
