import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function isAdminAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("x-admin-token");
  return auth === ADMIN_PASSWORD;
}

// GET /api/admin/users — list all users with track count and total storage
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const users = await sql`
      SELECT
        u.id,
        u.username,
        u.created_at,
        COUNT(t.id)::int AS track_count,
        COALESCE(SUM(t.file_size), 0)::bigint AS total_size
      FROM users u
      LEFT JOIN tracks t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY total_size DESC
    `;
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}
