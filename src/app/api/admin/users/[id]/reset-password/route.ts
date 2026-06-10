// app/api/admin/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import bcrypt from "bcryptjs";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const Schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
  }

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }

  // Hash and update
  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  // Revoke all existing sessions so they must re-login
  await prisma.userSession.deleteMany({ where: { userId } });

  return NextResponse.json({ success: true, message: "Password reset. All sessions revoked." });
}


// ─────────────────────────────────────────────────────────────
// app/api/admin/users/[id]/revoke-sessions/route.ts
// (Keep in its own file in practice — shown here for reference)
// ─────────────────────────────────────────────────────────────
//
// POST  → deletes all UserSession rows for the user
//
// export async function POST(req: NextRequest, { params }: Ctx) {
//   const session = await getSessionUser(req);
//   if (!session || session.role !== "ADMIN") {
//     return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
//   }
//   const userId = parseInt((await params).id);
//   if (isNaN(userId)) return NextResponse.json({ success: false }, { status: 400 });
//   const { count } = await prisma.userSession.deleteMany({ where: { userId } });
//   return NextResponse.json({ success: true, revoked: count });
// }