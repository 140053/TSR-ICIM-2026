// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID." }, { status: 400 });
  }

  // Never let admin delete themselves
  if (userId === session.id) {
    return NextResponse.json({ success: false, error: "Cannot delete your own account." }, { status: 400 });
  }

  // Check the target user exists and is not another admin
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ success: false, error: "Cannot delete admin accounts." }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, message: "User deleted." });
  } catch (err) {
    console.error("[ADMIN/USERS/DELETE]", err);
    return NextResponse.json({ success: false, error: "Failed to delete user." }, { status: 500 });
  }
}


// ─────────────────────────────────────────────────────────────
// app/api/admin/sessions/clear/route.ts
// (Put in a separate file in practice — shown here as a comment
//  for reference alongside the delete route)
//
// POST /api/admin/sessions/clear
// Removes all expired UserSession records from the database.
// ─────────────────────────────────────────────────────────────
//
// import { NextRequest, NextResponse } from "next/server";
// import { getSessionUser } from "@/lib/auth/session";
// import { prisma } from "@/lib/prisma";
//
// export async function POST(req: NextRequest) {
//   const session = await getSessionUser(req);
//   if (!session || session.role !== "ADMIN") {
//     return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
//   }
//   const { count } = await prisma.userSession.deleteMany({
//     where: { expiresAt: { lt: new Date() } },
//   });
//   return NextResponse.json({ success: true, cleared: count });
// }