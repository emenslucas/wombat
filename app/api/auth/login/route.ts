import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT id, username, password_hash FROM users WHERE username = ${username}
    `;
    const user = rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      );
    }

    await createSessionCookie(String(user.id));

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión. Detalle: " + String(error) },
      { status: 500 },
    );
  }
}
