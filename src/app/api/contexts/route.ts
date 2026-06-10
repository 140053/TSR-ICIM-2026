// GET /api/contexts — public endpoint, returns all active scenario contexts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const contexts = await prisma.scenarioContext.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
    select:  { id: true, key: true, label: true, description: true, icon: true, color: true },
  });
  return NextResponse.json({ success: true, contexts });
}
