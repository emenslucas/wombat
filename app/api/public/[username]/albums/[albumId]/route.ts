import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type Ctx = { params: Promise<{ username: string; albumId: string }> }

// GET /api/public/[username]/albums/[albumId] — public album data
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { username, albumId } = await params

    const users = await sql`SELECT id, username FROM users WHERE username = ${username}`
    if (users.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const user = users[0]

    const albums = await sql`SELECT * FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`
    if (albums.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })

    const tracks = await sql`
      SELECT t.*, at.position
      FROM album_tracks at
      JOIN tracks t ON t.id = at.track_id
      WHERE at.album_id = ${albumId}
      ORDER BY at.position ASC
    `

    return NextResponse.json({ user: { username: user.username }, album: albums[0], tracks })
  } catch (error) {
    console.error('Public album error:', error)
    return NextResponse.json({ error: 'Error al cargar album' }, { status: 500 })
  }
}
