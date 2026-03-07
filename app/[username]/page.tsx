import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Disc3, Music } from 'lucide-react'
import { sql } from '@/lib/db'
import type { Track, Album } from '@/lib/types'
import PublicPlayer from '@/components/public-player'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  return {
    title: `@${username} · Música`,
    description: `Escucha la música de ${username}`,
  }
}

export default async function PublicArtistPage({ params }: PageProps) {
  const { username } = await params

  const users = await sql`SELECT id, username FROM users WHERE username = ${username}`
  if (users.length === 0) notFound()
  const user = users[0]

  const [albums, looseTracks] = await Promise.all([
    sql`
      SELECT a.*, COUNT(at.track_id)::int AS track_count
      FROM albums a
      LEFT JOIN album_tracks at ON at.album_id = a.id
      WHERE a.user_id = ${user.id}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    ` as Promise<Album[]>,
    sql`
      SELECT t.* FROM tracks t
      WHERE t.user_id = ${user.id}
        AND NOT EXISTS (SELECT 1 FROM album_tracks at WHERE at.track_id = t.id)
      ORDER BY t.created_at DESC
    ` as Promise<Track[]>,
  ])

  const hasContent = albums.length > 0 || looseTracks.length > 0

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-2.5">
          <Disc3 className="w-5 h-5 text-foreground/80" />
          <span className="font-semibold tracking-tight">@{user.username}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!hasContent ? (
          <div className="text-center py-24">
            <Music className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground/50">Este artista aún no ha subido música</p>
          </div>
        ) : (
          <>
            {/* Albums */}
            {albums.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/${username}/${album.id}`}
                      className="group block"
                    >
                      <div className="aspect-square bg-secondary/50 rounded-xl overflow-hidden mb-3 flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                        {album.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                          <Disc3 className="w-10 h-10 text-muted-foreground/20" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate text-foreground/80 group-hover:text-foreground transition-colors">{album.title}</p>
                      <p className="text-xs text-muted-foreground/40 mt-0.5">{album.track_count || 0} tracks</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Loose tracks */}
            {looseTracks.length > 0 && (
              <section>
                <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest mb-4">
                  {albums.length > 0 ? 'Tracks sueltos' : 'Tracks'}
                </h2>
                <PublicPlayer tracks={looseTracks} />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
