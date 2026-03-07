import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// POST /api/albums/[id]/tracks — add a track to an album
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id: albumId } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { track_id } = await request.json()
    if (!track_id) return NextResponse.json({ error: 'track_id es obligatorio' }, { status: 400 })

    // Verify album belongs to user
    const albums = await sql`SELECT id FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`
    if (albums.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })

    // Verify track belongs to user
    const tracks = await sql`SELECT id FROM tracks WHERE id = ${track_id} AND user_id = ${user.id}`
    if (tracks.length === 0) return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 })

    // Already in album?
    const existing = await sql`SELECT id FROM album_tracks WHERE album_id = ${albumId} AND track_id = ${track_id}`
    if (existing.length > 0) return NextResponse.json({ error: 'El track ya está en el album' }, { status: 409 })

    // Get max position
    const maxPos = await sql`SELECT COALESCE(MAX(position), 0) AS pos FROM album_tracks WHERE album_id = ${albumId}`
    const position = Number(maxPos[0].pos) + 1

    await sql`INSERT INTO album_tracks (album_id, track_id, position) VALUES (${albumId}, ${track_id}, ${position})`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add track to album error:', error)
    return NextResponse.json({ error: 'Error al agregar track' }, { status: 500 })
  }
}

// DELETE /api/albums/[id]/tracks — remove a track from an album
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const { id: albumId } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { track_id } = await request.json()
    if (!track_id) return NextResponse.json({ error: 'track_id es obligatorio' }, { status: 400 })

    // Verify album belongs to user
    const albums = await sql`SELECT id FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`
    if (albums.length === 0) return NextResponse.json({ error: 'Album no encontrado' }, { status: 404 })

    await sql`DELETE FROM album_tracks WHERE album_id = ${albumId} AND track_id = ${track_id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove track from album error:', error)
    return NextResponse.json({ error: 'Error al quitar track' }, { status: 500 })
  }
}
