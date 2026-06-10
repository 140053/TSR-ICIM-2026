// GET /api/student/modules/[moduleId]/quiz-check
// Returns whether the module has any scenario questions.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ moduleId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "STUDENT")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { moduleId: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId))
    return NextResponse.json({ success: false, error: "Invalid module id" }, { status: 400 });

  const count = await prisma.moduleQuizQuestion.count({ where: { moduleId } });

  return NextResponse.json({ success: true, hasQuestions: count > 0 });
}
