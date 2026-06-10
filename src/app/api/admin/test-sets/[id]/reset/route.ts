// POST /api/admin/test-sets/[id]/reset
// Deletes all student results (and their responses) for this test set.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

  const testSet = await prisma.testSet.findUnique({ where: { id: tsId } });
  if (!testSet)
    return NextResponse.json({ success: false, error: "Test set not found." }, { status: 404 });

  // TestResponse cascades from TestResult, so deleting results is enough.
  const { count } = await prisma.testResult.deleteMany({ where: { testSetId: tsId } });

  return NextResponse.json({ success: true, deletedCount: count });
}
