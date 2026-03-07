import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { sql } from '@/lib/db'
import type { Track, Album } from '@/lib/types'
import DashboardClient from '@/components/dashboard-client'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const [tracks, albumRows] = await Promise.all([
    sql`SELECT * FROM tracks WHERE user_id = ${user.id} ORDER BY created_at DESC` as Promise<Track[]>,
    sql`
      SELECT a.*, COUNT(at.track_id)::int AS track_count
      FROM albums a
      LEFT JOIN album_tracks at ON at.album_id = a.id
      WHERE a.user_id = ${user.id}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    ` as Promise<Album[]>,
  ])

  return <DashboardClient user={user} initialTracks={tracks} initialAlbums={albumRows} />
}
