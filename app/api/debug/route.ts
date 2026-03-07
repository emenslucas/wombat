import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 },
      );
    }

    const sessions = await sql`
      SELECT s.*, u.username
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${token}
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        {
          error: "Token not found in DB",
          tokenPrefix: token.slice(0, 20) + "...",
        },
        { status: 401 },
      );
    }

    const session = sessions[0];
    const expired = new Date(session.expires_at) < new Date();

    return NextResponse.json({
      ok: true,
      username: session.username,
      user_id: session.user_id,
      expires_at: session.expires_at,
      expired,
    });
  } catch (err) {
    console.error("[v0] debug error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
