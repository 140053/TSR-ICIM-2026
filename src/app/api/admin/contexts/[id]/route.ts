// /api/admin/contexts/[id]
// PATCH  → update context
// DELETE → delete context (blocked if modules use it)

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ctxId  = parseInt(id);
  if (isNaN(ctxId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const body = await req.json() as Partial<{
    label: string; description: string; icon: string;
    color: string; isActive: boolean; sortOrder: number;
  }>;

  const updated = await prisma.scenarioContext.update({
    where: { id: ctxId },
    data: {
      ...(body.label       !== undefined && { label:       body.label.trim()       }),
      ...(body.description !== undefined && { description: body.description.trim() || null }),
      ...(body.icon        !== undefined && { icon:        body.icon.trim()        }),
      ...(body.color       !== undefined && { color:       body.color.trim()       }),
      ...(body.isActive    !== undefined && { isActive:    body.isActive           }),
      ...(body.sortOrder   !== undefined && { sortOrder:   body.sortOrder          }),
    },
  });
  return NextResponse.json({ success: true, context: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ctxId  = parseInt(id);
  if (isNaN(ctxId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const ctx = await prisma.scenarioContext.findUnique({ where: { id: ctxId } });
  if (!ctx)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Block delete if any module uses this context
  const usedCount = await prisma.module.count({ where: { context: ctx.key } });
  if (usedCount > 0)
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${usedCount} module(s) use this context.` },
      { status: 409 }
    );

  await prisma.scenarioContext.delete({ where: { id: ctxId } });
  return NextResponse.json({ success: true });
}
