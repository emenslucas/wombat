import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; releaseSlug: string }> },
) {
  try {
    const { username, releaseSlug } = await params;

    // Get artist
    const artists = await sql`
      SELECT id, name, slug, bio, avatar_url FROM artists WHERE slug = ${username}
    `;

    if (artists.length === 0) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const artist = artists[0];

    // Get release
    const releases = await sql`
      SELECT * FROM releases
      WHERE artist_id = ${artist.id} AND slug = ${releaseSlug} AND is_public = true
    `;

    if (releases.length === 0) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }

    const release = releases[0];

    // Get public tracks
    const tracks = await sql`
      SELECT id, title, track_number, duration, file_url, file_type, play_count
      FROM tracks
      WHERE release_id = ${release.id} AND is_public = true
      ORDER BY track_number ASC
    `;

    return NextResponse.json({ artist, release, tracks });
  } catch (error) {
    console.error("Get public release error:", error);
    return NextResponse.json(
      { error: "Failed to get release" },
      { status: 500 },
    );
  }
}
