import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

// GET /api/tracks — list all tracks for the logged-in user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tracks = await sql`
      SELECT * FROM tracks WHERE user_id = ${user.id} ORDER BY created_at DESC
    `
    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Get tracks error:', error)
    return NextResponse.json({ error: 'Error al obtener tracks' }, { status: 500 })
  }
}

// POST /api/tracks — save track metadata after blob upload
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { title, artist, duration, blob_url, blob_pathname, file_size, cover_url } = await request.json()

    if (!title || !blob_url || !blob_pathname) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO tracks (user_id, title, artist, duration, blob_url, blob_pathname, file_size, cover_url)
      VALUES (${user.id}, ${title}, ${artist || ''}, ${duration || null}, ${blob_url}, ${blob_pathname}, ${file_size || 0}, ${cover_url || null})
      RETURNING *
    `

    return NextResponse.json({ track: rows[0] })
  } catch (error) {
    console.error('Create track error:', error)
    return NextResponse.json({ error: 'Error al guardar track' }, { status: 500 })
  }
}
