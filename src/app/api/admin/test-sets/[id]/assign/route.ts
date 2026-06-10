// POST /api/admin/test-sets/[id]/assign
// Body: { sectionIds: number[] }
// Replaces all section assignments for this test set atomically.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  sectionIds: z.array(z.number().int().positive()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const tsId = parseInt(id);
  if (isNaN(tsId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
      { status: 400 }
    );

  const { sectionIds } = parsed.data;

  const testSet = await prisma.testSet.findUnique({ where: { id: tsId } });
  if (!testSet)
    return NextResponse.json({ success: false, error: "Test set not found." }, { status: 404 });

  if (sectionIds.length > 0) {
    const found = await prisma.section.count({ where: { id: { in: sectionIds } } });
    if (found !== sectionIds.length)
      return NextResponse.json({ success: false, error: "One or more sections not found." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Remove assignments no longer in the list
    await tx.testSetAssignment.deleteMany({
      where: { testSetId: tsId, sectionId: { notIn: sectionIds } },
    });
    // Upsert remaining
    for (const sectionId of sectionIds) {
      await tx.testSetAssignment.upsert({
        where:  { testSetId_sectionId: { testSetId: tsId, sectionId } },
        update: {},
        create: { testSetId: tsId, sectionId },
      });
    }
  });

  return NextResponse.json({
    success: true,
    message: sectionIds.length === 0
      ? "All assignments removed."
      : `Test set assigned to ${sectionIds.length} section(s).`,
    assignedCount: sectionIds.length,
  });
}
