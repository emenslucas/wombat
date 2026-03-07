import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

function isAdminAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-token')
  return auth === ADMIN_PASSWORD
}

// DELETE /api/admin/users/[id] — delete user + all their tracks from DB and Blob
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Get all blob URLs before deleting
    const tracks = await sql`
      SELECT blob_url, cover_url FROM tracks WHERE user_id = ${id}
    `

    // Delete user from DB (sessions and tracks cascade)
    const deleted = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING id
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Delete all blobs (non-fatal if they fail)
    for (const track of tracks) {
      try {
        await del(track.blob_url)
        if (track.cover_url) await del(track.cover_url)
      } catch (blobErr) {
        console.error('Blob delete error (non-fatal):', blobErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
