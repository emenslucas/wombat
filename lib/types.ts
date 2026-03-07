export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Track {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  duration: number | null;
  blob_url: string;
  blob_pathname: string;
  file_size: number;
  cover_url: string | null;
  created_at: string;
  username?: string;
}

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  username?: string;
  track_count?: number;
}

export interface AlbumTrack extends Track {
  position: number;
  album_track_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface AdminUserRow extends User {
  track_count: number;
  total_size: number;
}
