import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

// GET /api/albums — list all albums for the logged-in user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const albums = await sql`
      SELECT a.*,
        COUNT(at.track_id)::int AS track_count
      FROM albums a
      LEFT JOIN album_tracks at ON at.album_id = a.id
      WHERE a.user_id = ${user.id}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `
    return NextResponse.json({ albums })
  } catch (error) {
    console.error('Get albums error:', error)
    return NextResponse.json({ error: 'Error al obtener albums' }, { status: 500 })
  }
}

// POST /api/albums — create a new album
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { title, description, cover_url } = await request.json()
    if (!title?.trim()) return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })

    const rows = await sql`
      INSERT INTO albums (user_id, title, description, cover_url)
      VALUES (${user.id}, ${title.trim()}, ${description || null}, ${cover_url || null})
      RETURNING *
    `
    return NextResponse.json({ album: rows[0] })
  } catch (error) {
    console.error('Create album error:', error)
    return NextResponse.json({ error: 'Error al crear album' }, { status: 500 })
  }
}
