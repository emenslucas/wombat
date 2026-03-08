import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { duration, title, artist, cover_url } = body;

    const rows = await sql`
      UPDATE tracks SET
        title = COALESCE(${title ?? null}, title),
        artist = COALESCE(${artist ?? null}, artist),
        cover_url = COALESCE(${cover_url ?? null}, cover_url),
        duration = COALESCE(${duration ?? null}, duration)
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Track no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ track: rows[0] });
  } catch (error) {
    console.error("Update track error:", error);
    return NextResponse.json(
      { error: "Error al actualizar track" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Fetch track to verify ownership and get blob_url for deletion
    const rows = await sql`
      SELECT id, blob_url, cover_url FROM tracks WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Track no encontrado" },
        { status: 404 },
      );
    }

    const track = rows[0];

    // Delete from DB (cascade deletes are handled by FK)
    await sql`DELETE FROM tracks WHERE id = ${id}`;

    // Delete from Blob storage
    try {
      await del(track.blob_url);
      if (track.cover_url) await del(track.cover_url);
    } catch (blobErr) {
      console.error("Blob delete error (non-fatal):", blobErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete track error:", error);
    return NextResponse.json(
      { error: "Error al eliminar track" },
      { status: 500 },
    );
  }
}
