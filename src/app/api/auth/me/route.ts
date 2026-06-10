// app/api/auth/me/route.ts
import { getSessionUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (err) {
    console.error("[AUTH/ME]", err);
    return NextResponse.json(
      { success: false, error: "Session check failed." },
      { status: 500 }
    );
  }
}