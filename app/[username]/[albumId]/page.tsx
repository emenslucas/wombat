import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Disc3, ChevronRight } from 'lucide-react'
import { sql } from '@/lib/db'
import type { Track, Album } from '@/lib/types'
import PublicPlayer from '@/components/public-player'

interface PageProps {
  params: Promise<{ username: string; albumId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username, albumId } = await params
  const albums = await sql`SELECT title FROM albums a JOIN users u ON u.id = a.user_id WHERE a.id = ${albumId} AND u.username = ${username}`
  const title = albums[0]?.title ?? 'Album'
  return {
    title: `${title} · @${username}`,
    description: `Escucha ${title} de ${username}`,
  }
}

export default async function PublicAlbumPage({ params }: PageProps) {
  const { username, albumId } = await params

  const users = await sql`SELECT id, username FROM users WHERE username = ${username}`
  if (users.length === 0) notFound()
  const user = users[0]

  const albums = await sql`SELECT * FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`
  if (albums.length === 0) notFound()
  const album = albums[0] as Album

  const tracks = await sql`
    SELECT t.*, at.position
    FROM album_tracks at
    JOIN tracks t ON t.id = at.track_id
    WHERE at.album_id = ${albumId}
    ORDER BY at.position ASC
  ` as Track[]

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-2.5">
          <Link href={`/${username}`} className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
            <Disc3 className="w-4 h-4" />
            @{username}
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
          <span className="text-sm font-medium truncate">{album.title}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Album hero */}
        <div className="flex items-center gap-6 mb-10">
          <div className="w-28 h-28 bg-secondary/50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {album.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
            ) : (
              <Disc3 className="w-10 h-10 text-muted-foreground/20" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground/40 uppercase tracking-widest mb-1">Album</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{album.title}</h1>
            {album.description && <p className="text-sm text-muted-foreground/60 mt-2">{album.description}</p>}
            <p className="text-xs text-muted-foreground/40 mt-2">
              <Link href={`/${username}`} className="hover:text-foreground transition-colors">@{username}</Link>
              {' · '}{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground/50 text-sm">Este album no tiene tracks todavía</p>
          </div>
        ) : (
          <PublicPlayer tracks={tracks} />
        )}
      </div>
    </main>
  )
}
