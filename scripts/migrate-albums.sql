CREATE TABLE IF NOT EXISTS albums (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS album_tracks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id   UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, track_id)
);

CREATE INDEX IF NOT EXISTS album_tracks_album_idx ON album_tracks(album_id);
CREATE INDEX IF NOT EXISTS album_tracks_track_idx ON album_tracks(track_id);
CREATE INDEX IF NOT EXISTS albums_user_idx ON albums(user_id);
