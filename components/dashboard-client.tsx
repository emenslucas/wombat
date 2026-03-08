"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Album, AlbumTrack, Track, User } from "@/lib/types";
import {
  Check,
  Disc3,
  FolderOpen,
  GripVertical,
  ImageIcon,
  Link2,
  Loader2,
  LogOut,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  user: User;
  initialTracks: Track[];
  initialAlbums: Album[];
}

type ActiveTab = "tracks" | "albums";

function formatDuration(secs: number | null): string {
  if (!secs) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Draggable bar hook ────────────────────────────────────────────────────

function useDraggableBar(
  barRef: React.RefObject<HTMLDivElement | null>,
  onChange: (ratio: number) => void,
) {
  const dragging = useRef(false);

  const getRatio = useCallback(
    (clientX: number) => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [barRef],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      onChange(getRatio(e.clientX));
      const onMove = (ev: MouseEvent) => {
        if (dragging.current) onChange(getRatio(ev.clientX));
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [getRatio, onChange],
  );

  return { onMouseDown };
}

// ── Player bar ────────────────────────────────────────────────────────────

function PlayerBar({
  playingTrack,
  isPlaying,
  audioRef,
  onPrev,
  onNext,
  onToggle,
}: {
  playingTrack: Track;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const volBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () =>
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    setDuration(audio.duration || 0);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [audioRef, playingTrack]);

  const handleSeek = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      audio.currentTime = ratio * audio.duration;
      setProgress(ratio);
    },
    [audioRef],
  );

  const handleVolume = useCallback(
    (ratio: number) => {
      setVolume(ratio);
      setMuted(ratio === 0);
      if (audioRef.current) audioRef.current.volume = ratio;
    },
    [audioRef],
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
  };

  const { onMouseDown: onSeekDown } = useDraggableBar(seekBarRef, handleSeek);
  const { onMouseDown: onVolDown } = useDraggableBar(volBarRef, handleVolume);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/30 px-6 pb-4 pt-3 z-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/50 tabular-nums w-10 text-right">
            {fmt(progress * duration)}
          </span>
          <div
            ref={seekBarRef}
            className="flex-1 h-1 bg-border/40 rounded-full cursor-pointer relative group select-none"
            onMouseDown={onSeekDown}
          >
            <div
              className="absolute inset-y-0 left-0 bg-foreground/70 rounded-full pointer-events-none"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progress * 100}% - 6px)` }}
            />
          </div>
          <span className="text-xs text-muted-foreground/50 tabular-nums w-10">
            {fmt(duration)}
          </span>
        </div>
        <div className="flex">
          <div className="grid grid-cols-3 items-center w-full">
            {/* IZQUIERDA */}
            <div className="flex items-center gap-3 min-w-0">
              {playingTrack.cover_url ? (
                <img
                  src={playingTrack.cover_url}
                  alt={playingTrack.title}
                  className="w-9 h-9 rounded-md object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-secondary/80 rounded-md flex items-center justify-center shrink-0">
                  <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {playingTrack.title}
                </p>
                <p className="text-xs text-muted-foreground/50 truncate">
                  {playingTrack.artist || ""}
                </p>
              </div>
            </div>

            {/* CENTRO */}
            <div className="flex justify-center">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground/60 hover:text-foreground"
                  onClick={onPrev}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-foreground"
                  onClick={onToggle}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground/60 hover:text-foreground"
                  onClick={onNext}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* DERECHA */}
            <div className="flex justify-end">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleMute}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div
                  ref={volBarRef}
                  className="w-20 h-1 bg-border/40 rounded-full cursor-pointer relative group select-none"
                  onMouseDown={onVolDown}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-foreground/50 rounded-full pointer-events-none"
                    style={{ width: `${(muted ? 0 : volume) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      left: `calc(${(muted ? 0 : volume) * 100}% - 5px)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Album Editor ──────────────────────────────────────────────────────────

function AlbumEditor({
  album,
  allTracks,
  onClose,
  onUpdated,
}: {
  album: Album;
  allTracks: Track[];
  onClose: () => void;
  onUpdated: (album: Album) => void;
}) {
  const [albumTracks, setAlbumTracks] = useState<AlbumTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(album.title);
  const [description, setDescription] = useState(album.description || "");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState(album.cover_url || "");
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  // Load album tracks
  useEffect(() => {
    fetch(`/api/albums/${album.id}`)
      .then((r) => r.json())
      .then((d) => {
        setAlbumTracks(d.tracks || []);
      })
      .catch(() => toast.error("Error al cargar tracks del album"))
      .finally(() => setLoading(false));
  }, [album.id]);

  // ── Save metadata (title / description / cover)
  const saveMetadata = async (updates: {
    title?: string;
    description?: string;
    cover_url?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar");
        return;
      }
      onUpdated(data.album);
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ── Upload cover
  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "cover");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al subir portada");
        return;
      }
      setCoverUrl(data.url);
      await saveMetadata({ cover_url: data.url });
    } catch {
      toast.error("Error al subir portada");
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Add track to album
  const addTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/albums/${album.id}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al agregar");
        return;
      }
      // Reload tracks
      const r2 = await fetch(`/api/albums/${album.id}`);
      const d2 = await r2.json();
      setAlbumTracks(d2.tracks || []);
    } catch {
      toast.error("Error al agregar track");
    }
  };

  // ── Remove track from album
  const removeTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/albums/${album.id}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
      if (!res.ok) {
        toast.error("Error al quitar");
        return;
      }
      setAlbumTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch {
      toast.error("Error al quitar track");
    }
  };

  // ── Drag-to-reorder
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };
  const handleDragEnd = async () => {
    if (
      dragItem.current === null ||
      dragOver.current === null ||
      dragItem.current === dragOver.current
    ) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const reordered = [...albumTracks];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    setAlbumTracks(reordered);
    // Persist
    try {
      await fetch(`/api/albums/${album.id}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: reordered.map((t) => t.id) }),
      });
    } catch {
      toast.error("Error al reordenar");
    }
  };

  const availableTracks = allTracks.filter(
    (t) => !albumTracks.some((at) => at.id === t.id),
  );

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur z-30 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground/60 hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" /> Cerrar
          </button>
          {saving && (
            <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
            </span>
          )}
        </div>

        {/* Cover + title */}
        <div className="flex gap-5 mb-8">
          {/* Cover */}
          <div className="relative shrink-0">
            <div
              className="w-28 h-28 bg-secondary/50 rounded-xl border border-border/30 overflow-hidden cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Portada"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground/40">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px]">Portada</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {coverUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
              }}
            />
          </div>

          {/* Title + description */}
          <div className="flex-1 flex flex-col gap-3">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-lg font-semibold bg-background/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingTitle(false);
                      saveMetadata({ title });
                    }
                    if (e.key === "Escape") {
                      setTitle(album.title);
                      setEditingTitle(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setEditingTitle(false);
                    saveMetadata({ title });
                  }}
                  className="text-foreground/70 hover:text-foreground"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTitle(album.title);
                    setEditingTitle(false);
                  }}
                  className="text-muted-foreground/60 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 text-left group"
              >
                <h2 className="text-xl font-semibold tracking-tight group-hover:text-foreground/80">
                  {title}
                </h2>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
              </button>
            )}
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== album.description)
                  saveMetadata({ description });
              }}
              placeholder="Descripción del album (opcional)"
              className="h-8 text-sm bg-background/50 text-muted-foreground border-border/40"
            />
          </div>
        </div>

        {/* Tracklist */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground/70 mb-3">
            Tracks ({albumTracks.length})
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : albumTracks.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border/40 rounded-xl text-muted-foreground/40 text-sm">
              Agrega tracks desde la lista de abajo
            </div>
          ) : (
            <div className="space-y-1">
              {albumTracks.map((track, index) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 group cursor-default border border-transparent hover:border-border/20"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab shrink-0" />
                  <span className="text-xs text-muted-foreground/40 w-5 text-center tabular-nums">
                    {index + 1}
                  </span>
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center shrink-0">
                      <Music className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground/50 truncate">
                      {track.artist || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/40 tabular-nums">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 transition-all ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add tracks */}
        {availableTracks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground/70 mb-3">
              Agregar tracks
            </h3>
            <div className="space-y-1">
              {availableTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/20 group cursor-default border border-transparent hover:border-border/20"
                >
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center shrink-0">
                      <Music className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground/50 truncate">
                      {track.artist || "—"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/40 tabular-nums">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    onClick={() => addTrack(track.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground transition-all ml-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Album Modal ────────────────────────────────────────────────────

function CreateAlbumModal({
  onCreated,
  onClose,
}: {
  onCreated: (album: Album) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on mount
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const create = async () => {
    const trimmed = title.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al crear album");
        return;
      }
      toast.success("Album creado");
      onCreated({ ...data.album, track_count: 0 });
    } catch {
      toast.error("Error al crear album");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Crear nuevo album</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground/80">Título *</Label>
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
                if (e.key === "Escape") onClose();
              }}
              placeholder="Nombre del album"
              className="h-10 bg-background/50 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground/80">
              Descripción (opcional)
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
                if (e.key === "Escape") onClose();
              }}
              placeholder="Descripción breve"
              className="h-10 bg-background/50 border-border/50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-full"
              disabled={loading || !title.trim()}
              onClick={create}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────

export default function DashboardClient({
  user,
  initialTracks,
  initialAlbums,
}: Props) {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [activeTab, setActiveTab] = useState<ActiveTab>("tracks");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState(user.username);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Album state
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

  // Edit track state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackTitle, setEditingTrackTitle] = useState("");
  const [editingTrackArtist, setEditingTrackArtist] = useState("");
  const [editingTrackCover, setEditingTrackCover] = useState<string | null>(
    null,
  );
  const [editingCoverFile, setEditingCoverFile] = useState<File | null>(null);
  const [editingCoverPreview, setEditingCoverPreview] = useState<string | null>(
    null,
  );
  const [editingTrackSaving, setEditingTrackSaving] = useState(false);
  const editingCoverInputRef = useRef<HTMLInputElement>(null);

  // Update durations for tracks that don't have them
  useEffect(() => {
    const updateDurations = async () => {
      const tracksToUpdate = tracks.filter(
        (t) => t.duration === null || t.duration === undefined,
      );
      if (tracksToUpdate.length === 0) return;

      for (const track of tracksToUpdate) {
        try {
          const duration = await new Promise<number>((resolve) => {
            const audio = new Audio(track.blob_url);
            audio.addEventListener("loadedmetadata", () => {
              resolve(Math.floor(audio.duration));
            });
            audio.addEventListener("error", () => {
              resolve(0);
            });
          });

          if (duration > 0) {
            const res = await fetch(`/api/tracks/${track.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ duration }),
            });
            if (res.ok) {
              setTracks((prev) =>
                prev.map((t) => (t.id === track.id ? { ...t, duration } : t)),
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to update duration for track ${track.id}:`,
            error,
          );
        }
      }
    };

    updateDurations();
  }, [tracks]);

  const resetUploadForm = () => {
    setTrackTitle("");
    setTrackArtist(user.username);
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setUploadProgress("");
  };

  // ── Audio player logic ─────────────────────────────────────────────────

  const playTrack = (track: Track) => {
    if (playingId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.blob_url;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    setPlayingId(track.id);
  };

  const handlePrev = () => {
    const idx = tracks.findIndex((t) => t.id === playingId);
    if (idx > 0) playTrack(tracks[idx - 1]);
  };

  const handleNext = () => {
    const idx = tracks.findIndex((t) => t.id === playingId);
    if (idx < tracks.length - 1) playTrack(tracks[idx + 1]);
  };

  const handleToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", handleNext);
    }
    return () => {
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!trackTitle.trim() || !audioFile || isUploading) return;
    setIsUploading(true);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        setUploadProgress("Subiendo portada...");
        const fd = new FormData();
        fd.append("file", coverFile);
        fd.append("type", "cover");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error || "Error al subir portada");
          return;
        }
        coverUrl = d.url;
      }
      setUploadProgress("Subiendo audio...");
      const fd2 = new FormData();
      fd2.append("file", audioFile);
      fd2.append("type", "audio");
      const r2 = await fetch("/api/upload", { method: "POST", body: fd2 });
      const d2 = await r2.json();
      if (!r2.ok) {
        toast.error(d2.error || "Error al subir audio");
        return;
      }

      // Extract duration from uploaded audio
      setUploadProgress("Procesando audio...");
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio(d2.url);
        audio.addEventListener("loadedmetadata", () => {
          resolve(Math.floor(audio.duration));
        });
        audio.addEventListener("error", () => {
          resolve(0); // fallback
        });
      });

      setUploadProgress("Guardando...");
      const r3 = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trackTitle.trim(),
          artist: trackArtist.trim(),
          duration,
          blob_url: d2.url,
          blob_pathname: d2.pathname,
          file_size: d2.size,
          cover_url: coverUrl,
        }),
      });
      const d3 = await r3.json();
      if (!r3.ok) {
        toast.error(d3.error || "Error al guardar track");
        return;
      }
      setTracks((prev) => [d3.track, ...prev]);
      toast.success("Track subido correctamente");
      setUploadOpen(false);
      resetUploadForm();
    } catch {
      toast.error("Error al subir el track");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // ── Delete track ───────────────────────────────────────────────────────

  const handleDeleteTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar");
        return;
      }
      if (playingId === trackId) {
        audioRef.current?.pause();
        setPlayingId(null);
        setIsPlaying(false);
      }
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast.success("Track eliminado");
    } catch {
      toast.error("Error al eliminar track");
    }
  };

  // ── Start editing track ─────────────────────────────────────────────────
  const startEditingTrack = (track: Track) => {
    setEditingTrackId(track.id);
    setEditingTrackTitle(track.title);
    setEditingTrackArtist(track.artist || "");
    setEditingTrackCover(track.cover_url || null);
    setEditingCoverFile(null);
    setEditingCoverPreview(null);
  };

  // ── Cancel editing track ────────────────────────────────────────────────
  const cancelEditingTrack = () => {
    setEditingTrackId(null);
    setEditingTrackTitle("");
    setEditingTrackArtist("");
    setEditingTrackCover(null);
    setEditingCoverFile(null);
    setEditingCoverPreview(null);
  };

  // ── Save track edits ────────────────────────────────────────────────────
  const saveEditingTrack = async () => {
    if (!editingTrackId || !editingTrackTitle.trim() || editingTrackSaving)
      return;

    setEditingTrackSaving(true);
    try {
      let coverUrl = editingTrackCover;

      // Upload new cover if selected
      if (editingCoverFile) {
        const fd = new FormData();
        fd.append("file", editingCoverFile);
        fd.append("type", "cover");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error || "Error al subir portada");
          return;
        }
        coverUrl = d.url;
      }

      const res = await fetch(`/api/tracks/${editingTrackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTrackTitle.trim(),
          artist: editingTrackArtist.trim(),
          cover_url: coverUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar");
        return;
      }

      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrackId ? { ...t, ...data.track } : t,
        ),
      );
      toast.success("Track actualizado");
      cancelEditingTrack();
    } catch {
      toast.error("Error al guardar track");
    } finally {
      setEditingTrackSaving(false);
    }
  };

  // ── Delete album ───────────────────────────────────────────────────────

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar album");
        return;
      }
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      toast.success("Album eliminado");
    } catch {
      toast.error("Error al eliminar album");
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // ── Share ──────────────────────────────────────────────────────────────

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${origin}${path}`);
    toast.success("Link copiado");
  };

  const totalSize = tracks.reduce((acc, t) => acc + Number(t.file_size), 0);
  const playingTrack = tracks.find((t) => t.id === playingId);
  const openAlbum = albums.find((a) => a.id === openAlbumId);

  return (
    <main className="min-h-screen bg-background pb-28">
      <audio ref={audioRef} />

      {/* Album Editor overlay */}
      {openAlbum && (
        <AlbumEditor
          album={openAlbum}
          allTracks={tracks}
          onClose={() => setOpenAlbumId(null)}
          onUpdated={(updated) =>
            setAlbums((prev) =>
              prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
            )
          }
        />
      )}

      {/* Create Album Modal */}
      {showCreateAlbum && (
        <CreateAlbumModal
          onCreated={(album) => {
            setAlbums((prev) => [album, ...prev]);
            setShowCreateAlbum(false);
            setOpenAlbumId(album.id);
            setActiveTab("albums");
          }}
          onClose={() => setShowCreateAlbum(false)}
        />
      )}

      {/* Upload track modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => {
            setUploadOpen(false);
            resetUploadForm();
          }}
        >
          <div
            className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Subir track</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground/80">
                  Título *
                </Label>
                <Input
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="Nombre del track"
                  className="h-10 bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground/80">
                  Artista
                </Label>
                <Input
                  value={trackArtist}
                  onChange={(e) => setTrackArtist(e.target.value)}
                  placeholder="Nombre del artista"
                  className="h-10 bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground/80">
                  Archivo de audio * (MP3, WAV, FLAC · máx 50 MB)
                </Label>
                <input
                  type="file"
                  accept=".mp3,.wav,.flac,audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground/80">
                  Portada (opcional)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setCoverFile(f);
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setCoverPreview(url);
                    } else setCoverPreview(null);
                  }}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
                />
                {coverPreview && (
                  <img
                    src={coverPreview}
                    alt="preview"
                    className="w-16 h-16 rounded-lg object-cover mt-1"
                  />
                )}
              </div>
              {uploadProgress && (
                <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {uploadProgress}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setUploadOpen(false);
                    resetUploadForm();
                  }}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-full"
                  disabled={isUploading || !trackTitle.trim() || !audioFile}
                  onClick={handleUpload}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subir"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border/30 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Disc3 className="w-5 h-5 text-foreground/80" />
            <span className="font-semibold tracking-tight">
              @{user.username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4 gap-1.5 text-muted-foreground/70 hover:text-foreground border border-border/40"
              onClick={() => copyLink(`/${user.username}`)}
            >
              <Link2 className="w-3.5 h-3.5" />
              Mi perfil
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 gap-1.5 border-border/40"
              onClick={() => setShowCreateAlbum(true)}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Nuevo album
            </Button>
            <Button
              size="sm"
              className="rounded-full px-4 gap-1.5"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir track
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground/50 hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Storage info */}
        <div className="mb-6 text-xs text-muted-foreground/50">
          {tracks.length} track{tracks.length !== 1 ? "s" : ""} ·{" "}
          {formatBytes(totalSize)} usado
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/30 mb-6">
          {(["tracks", "albums"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground/60 hover:text-foreground/70"
              }`}
            >
              {tab === "tracks"
                ? `Tracks (${tracks.length})`
                : `Albums (${albums.length})`}
            </button>
          ))}
        </div>

        {/* Tracks tab */}
        {activeTab === "tracks" && (
          <div>
            {tracks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground/40">
                <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Aún no tienes tracks. Sube tu primera canción.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {tracks.map((track, index) => {
                  const isActive = playingId === track.id;
                  const isEditing = editingTrackId === track.id;

                  if (isEditing) {
                    // Editing mode
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40"
                      >
                        <span className="text-xs text-muted-foreground/40 w-5 text-center tabular-nums shrink-0">
                          {index + 1}
                        </span>
                        {/* Cover preview */}
                        <div
                          className="shrink-0 cursor-pointer relative"
                          onClick={() => editingCoverInputRef.current?.click()}
                        >
                          {editingCoverPreview || editingTrackCover ? (
                            <img
                              src={
                                editingCoverPreview || editingTrackCover || ""
                              }
                              alt="Portada"
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <input
                          ref={editingCoverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setEditingCoverFile(f);
                              setEditingCoverPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                        {/* Edit inputs */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <Input
                            value={editingTrackTitle}
                            onChange={(e) =>
                              setEditingTrackTitle(e.target.value)
                            }
                            placeholder="Título"
                            className="h-8 text-sm bg-background/50"
                            autoFocus
                          />
                          <Input
                            value={editingTrackArtist}
                            onChange={(e) =>
                              setEditingTrackArtist(e.target.value)
                            }
                            placeholder="Artista"
                            className="h-7 text-xs bg-background/50 text-muted-foreground"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground/40 tabular-nums shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                        {/* Save/Cancel buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={saveEditingTrack}
                            disabled={
                              editingTrackSaving || !editingTrackTitle.trim()
                            }
                            className="p-1.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-50"
                          >
                            {editingTrackSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEditingTrack}
                            disabled={editingTrackSaving}
                            className="p-1.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Normal display mode
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-3 rounded-xl group transition-colors cursor-pointer ${isActive ? "bg-secondary/50" : "hover:bg-secondary/30"}`}
                    >
                      <span className="text-xs text-muted-foreground/40 w-5 text-center tabular-nums shrink-0">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => playTrack(track)}
                        className="shrink-0"
                      >
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt={track.title}
                            className="w-15 h-15 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-foreground/10" : "bg-secondary/50"}`}
                          >
                            {isActive && isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 text-muted-foreground/60" />
                            )}
                          </div>
                        )}
                      </button>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => playTrack(track)}
                      >
                        <p
                          className={`text-sm font-medium truncate ${isActive ? "text-foreground" : ""}`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground/50 truncate">
                          {track.artist || "—"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground/40 tabular-nums shrink-0">
                        {formatDuration(track.duration)}
                      </span>
                      {/* Edit button */}
                      <button
                        onClick={() => startEditingTrack(track)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground transition-all p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 transition-all p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border/40">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar track</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente &quot;{track.title}
                              &quot;. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTrack(track.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Albums tab */}
        {activeTab === "albums" && (
          <div>
            {albums.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground/40">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-4">Aún no tienes albums.</p>
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowCreateAlbum(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Crear primer album
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {albums.map((album) => (
                  <div key={album.id} className="group relative">
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        setOpenAlbumId(album.id);
                      }}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-secondary/40 border border-border/20 mb-2 group-hover:border-border/50 transition-colors">
                        {album.cover_url ? (
                          <img
                            src={album.cover_url}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-10 h-10 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {album.title}
                      </p>
                      <p className="text-xs text-muted-foreground/50">
                        {album.track_count ?? 0} track
                        {(album.track_count ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </button>
                    {/* Share + delete */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="bg-background/80 backdrop-blur rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(`/${user.username}/${album.id}`);
                        }}
                        title="Copiar link"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="bg-background/80 backdrop-blur rounded-lg p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border/40">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar album</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará el album &quot;{album.title}&quot;.
                              Los tracks no se eliminarán.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAlbum(album.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player */}
      {playingTrack && (
        <PlayerBar
          playingTrack={playingTrack}
          isPlaying={isPlaying}
          audioRef={audioRef}
          onPrev={handlePrev}
          onNext={handleNext}
          onToggle={handleToggle}
        />
      )}
    </main>
  );
}
