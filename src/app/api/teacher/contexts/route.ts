// /api/teacher/contexts
// GET  → list all contexts (teacher or admin)
// POST → create a new scenario context (teacher or admin)

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function isAllowed(role: string) {
  return role === "TEACHER" || role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || !isAllowed(session.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const contexts = await prisma.scenarioContext.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ success: true, contexts });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || !isAllowed(session.role))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    key: string; label: string; description?: string;
    icon?: string; color?: string;
  };

  if (!body.key?.trim() || !body.label?.trim())
    return NextResponse.json({ success: false, error: "Key and label are required" }, { status: 400 });

  const key = body.key.trim().toUpperCase().replace(/\s+/g, "_");

  const existing = await prisma.scenarioContext.findUnique({ where: { key } });
  if (existing)
    return NextResponse.json({ success: false, error: "A context with that key already exists" }, { status: 409 });

  const maxOrder = await prisma.scenarioContext.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

  const ctx = await prisma.scenarioContext.create({
    data: {
      key,
      label:       body.label.trim(),
      description: body.description?.trim() || null,
      icon:        body.icon?.trim()  || "📦",
      color:       body.color?.trim() || "#64748B",
      sortOrder,
    },
  });
  return NextResponse.json({ success: true, context: ctx }, { status: 201 });
}
