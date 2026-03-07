import { createSessionCookie, hashPassword } from "@/lib/auth";
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "El usuario solo puede contener letras minúsculas, números, guiones y guiones bajos",
        },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "El usuario ya está en uso" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username, created_at
    `;
    const user = rows[0];
    await createSessionCookie(String(user.id));

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error en el registro. Detalle: " + String(error) },
      { status: 500 },
    );
  }
}
