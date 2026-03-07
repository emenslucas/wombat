import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// PUT /api/albums/[id]/reorder — update track positions within an album
export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { id: albumId } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { track_ids } = await request.json() // ordered array of track IDs
    if (!Array.isArray(track_ids)) return NextResponse.json({ error: 'track_ids debe ser un array' }, { status: 400 })

    // Verify album belongs to user
    const albums = await sql`SELECT id FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`
    if (albums.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })

    // Update each position
    for (let i = 0; i < track_ids.length; i++) {
      await sql`
        UPDATE album_tracks SET position = ${i + 1}
        WHERE album_id = ${albumId} AND track_id = ${track_ids[i]}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder album tracks error:', error)
    return NextResponse.json({ error: 'Error al reordenar' }, { status: 500 })
  }
}
