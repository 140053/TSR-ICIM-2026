// /api/admin/test-sets
// GET  → list all test sets (with question + result counts and linked module title)
// POST → create a new test set

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const [testSets, modules, sections, schools] = await Promise.all([
    prisma.testSet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        module:      { select: { id: true, title: true, icon: true } },
        _count:      { select: { questions: true, results: true } },
        assignments: { select: { sectionId: true } },
      },
    }),
    prisma.module.findMany({
      where:   { status: { in: ["ACTIVE", "DRAFT"] } },
      select:  { id: true, title: true, icon: true },
      orderBy: { title: "asc" },
    }),
    prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, emoji: true, schoolId: true, isActive: true,
        teacher: { select: { name: true } },
        _count:  { select: { students: true } },
      },
    }),
    prisma.school.findMany({
      orderBy: { name: "asc" },
      select:  { id: true, name: true, isActive: true },
    }),
  ]);

  return NextResponse.json({ success: true, testSets, modules, sections, schools });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    title:       string;
    type:        "PRE_TEST" | "POST_TEST";
    moduleId?:   number | null;
    description?: string;
    timeLimit?:  number | null;
  };

  if (!body.title?.trim())
    return NextResponse.json({ success: false, error: "Title is required." }, { status: 400 });

  if (body.type !== "PRE_TEST" && body.type !== "POST_TEST")
    return NextResponse.json({ success: false, error: "Type must be PRE_TEST or POST_TEST." }, { status: 400 });

  const created = await prisma.testSet.create({
    data: {
      title:       body.title.trim(),
      type:        body.type,
      moduleId:    body.moduleId  ?? null,
      description: body.description?.trim() || null,
      timeLimit:   body.timeLimit ?? null,
    },
  });

  return NextResponse.json({ success: true, testSet: created }, { status: 201 });
}
