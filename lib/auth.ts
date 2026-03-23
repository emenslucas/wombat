import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { sql } from "./db";
import type { User } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

export const SESSION_COOKIE = "session_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(userId: string): Promise<void> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  // Store token in DB - 30 days from now
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + thirtyDaysInMs);
  
  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    expires: expiresAt, // Explicit expiry date for browser persistence
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    // Use DB as source of truth — no JWT verify needed since we own the token store
    const sessions = await sql`
      SELECT user_id FROM sessions
      WHERE token = ${token} AND expires_at > NOW()
    `;
    if (sessions.length === 0) return null;
    return { userId: sessions[0].user_id as string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await sql`
    SELECT id, username, created_at FROM users WHERE id = ${session.userId}
  `;
  return (rows[0] as User) || null;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}
