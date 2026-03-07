import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/albums/[id] — get album with ordered tracks
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const albums = await sql`SELECT * FROM albums WHERE id = ${id} AND user_id = ${user.id}`
    if (albums.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })

    const tracks = await sql`
      SELECT t.*, at.position, at.id AS album_track_id
      FROM album_tracks at
      JOIN tracks t ON t.id = at.track_id
      WHERE at.album_id = ${id}
      ORDER BY at.position ASC
    `
    return NextResponse.json({ album: albums[0], tracks })
  } catch (error) {
    console.error('Get album error:', error)
    return NextResponse.json({ error: 'Error al obtener album' }, { status: 500 })
  }
}

// PATCH /api/albums/[id] — update album metadata
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { title, description, cover_url } = await request.json()

    const rows = await sql`
      UPDATE albums SET
        title = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        cover_url = COALESCE(${cover_url ?? null}, cover_url),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })
    return NextResponse.json({ album: rows[0] })
  } catch (error) {
    console.error('Update album error:', error)
    return NextResponse.json({ error: 'Error al actualizar album' }, { status: 500 })
  }
}

// DELETE /api/albums/[id] — delete album (tracks are NOT deleted, only unlinked)
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const rows = await sql`DELETE FROM albums WHERE id = ${id} AND user_id = ${user.id} RETURNING id`
    if (rows.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete album error:', error)
    return NextResponse.json({ error: 'Error al eliminar album' }, { status: 500 })
  }
}
