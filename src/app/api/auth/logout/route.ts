// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("tsr_session")?.value;

    // Delete session from DB if token exists
    if (token) {
      await prisma.userSession.deleteMany({ where: { token } });
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully." },
      { status: 200 }
    );

    // Clear the cookie
    response.cookies.set("tsr_session", "", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   0,
    });

    return response;
  } catch (err) {
    console.error("[AUTH/LOGOUT]", err);
    return NextResponse.json(
      { success: false, error: "Logout failed." },
      { status: 500 }
    );
  }
}