import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type Ctx = { params: Promise<{ username: string }> }

// GET /api/public/[username] — public artist page data (no auth required)
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { username } = await params

    const users = await sql`SELECT id, username FROM users WHERE username = ${username}`
    if (users.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const user = users[0]

    const albums = await sql`
      SELECT a.*, COUNT(at.track_id)::int AS track_count
      FROM albums a
      LEFT JOIN album_tracks at ON at.album_id = a.id
      WHERE a.user_id = ${user.id}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `

    // Loose tracks (not in any album)
    const looseTracks = await sql`
      SELECT t.* FROM tracks t
      WHERE t.user_id = ${user.id}
        AND NOT EXISTS (
          SELECT 1 FROM album_tracks at WHERE at.track_id = t.id
        )
      ORDER BY t.created_at DESC
    `

    return NextResponse.json({ user: { username: user.username }, albums, looseTracks })
  } catch (error) {
    console.error('Public profile error:', error)
    return NextResponse.json({ error: 'Error al cargar perfil' }, { status: 500 })
  }
}
