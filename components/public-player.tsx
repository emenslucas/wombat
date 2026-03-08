"use client";

import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/types";
import {
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      dragging.current = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      onChange(getRatio(clientX));
      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (dragging.current) {
          const cx = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
          onChange(getRatio(cx));
        }
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove);
      document.addEventListener("touchend", onUp);
    },
    [getRatio, onChange],
  );

  return { onMouseDown };
}

function formatDuration(secs: number | null): string {
  if (!secs) return "--:--";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface PublicPlayerProps {
  tracks: Track[];
  initialTrackId?: string;
}

export default function PublicPlayer({
  tracks,
  initialTrackId,
}: PublicPlayerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);

  const playTrack = useCallback(
    (track: Track) => {
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
      audioRef.current?.pause();
      const audio = new Audio(track.blob_url);
      audioRef.current = audio;
      audio.volume = muted ? 0 : volume;
      audio.play();
      setPlayingId(track.id);
      setIsPlaying(true);
      setProgress(0);
      setDuration(0);

      audio.addEventListener("timeupdate", () => {
        setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      });
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration || 0);
      });
      audio.onended = () => {
        setIsPlaying(false);
        const idx = tracks.findIndex((t) => t.id === track.id);
        if (idx < tracks.length - 1) playTrack(tracks[idx + 1]);
        else setPlayingId(null);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [playingId, isPlaying, tracks, volume, muted],
  );

  // Auto-play initial track if provided
  useEffect(() => {
    if (initialTrackId) {
      const t = tracks.find((tr) => tr.id === initialTrackId);
      if (t) playTrack(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = (dir: "prev" | "next") => {
    if (!playingId) return;
    const idx = tracks.findIndex((t) => t.id === playingId);
    const next = dir === "next" ? idx + 1 : idx - 1;
    if (next >= 0 && next < tracks.length) playTrack(tracks[next]);
  };

  const handleSeek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  const handleVolume = useCallback((ratio: number) => {
    setVolume(ratio);
    setMuted(ratio === 0);
    if (audioRef.current) audioRef.current.volume = ratio;
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
  };

  const { onMouseDown: onSeekDown } = useDraggableBar(seekRef, handleSeek);
  const { onMouseDown: onVolDown } = useDraggableBar(volRef, handleVolume);

  const playingTrack = tracks.find((t) => t.id === playingId);
  const currentTime = progress * duration;

  return (
    <div className="pb-20 sm:pb-28">
      {/* Track list */}
      <div className="space-y-1 mb-4 px-3 sm:px-0">
        {tracks.map((track, idx) => {
          const isActive = playingId === track.id;
          return (
            <div
              key={track.id}
              className={`group flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors cursor-pointer ${
                isActive ? "bg-accent/40" : "hover:bg-accent/20"
              }`}
              onClick={() => playTrack(track)}
            >
              {/* Index / playing indicator */}
              <div className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center shrink-0">
                {isActive && isPlaying ? (
                  <div className="flex items-end gap-[3px] h-4">
                    <span className="w-[3px] bg-foreground/70 rounded-full sound-wave" />
                    <span className="w-[3px] bg-foreground/70 rounded-full sound-wave sound-wave-delay-1" />
                    <span className="w-[3px] bg-foreground/70 rounded-full sound-wave sound-wave-delay-2" />
                  </div>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm text-muted-foreground/40 group-hover:hidden">
                      {idx + 1}
                    </span>
                    <Play className="w-3 sm:w-4 h-3 sm:h-4 text-foreground/70 hidden group-hover:block" />
                  </>
                )}
              </div>

              {/* Cover */}
              {track.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.cover_url}
                  alt={track.title}
                  className="w-10 h-10 rounded-md object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-secondary/80 rounded-md flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground/80"}`}
                >
                  {track.title}
                </p>
                <p className="text-xs text-muted-foreground/50 truncate hidden sm:block">
                  {track.artist || ""}
                </p>
              </div>

              <span className="text-xs text-muted-foreground/40 shrink-0 hidden sm:block">
                {formatDuration(track.duration)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sticky player */}
      {playingTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/30 px-3 sm:px-6 pb-3 sm:pb-4 pt-2 sm:pt-3 z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Seekbar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-muted-foreground/50 tabular-nums w-8 sm:w-10 text-right hidden sm:block">
                {fmt(currentTime)}
              </span>
              <div
                ref={seekRef}
                className="flex-1 h-1 bg-border/40 rounded-full cursor-pointer relative group select-none"
                onMouseDown={onSeekDown}
                onTouchStart={onSeekDown}
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
              <span className="text-xs text-muted-foreground/50 tabular-nums w-8 sm:w-10 hidden sm:block">
                {fmt(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {playingTrack.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={playingTrack.cover_url}
                    alt={playingTrack.title}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-secondary/80 rounded-md flex items-center justify-center shrink-0">
                    <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {playingTrack.title}
                  </p>
                  <p className="text-xs text-muted-foreground/50 truncate hidden sm:block">
                    {playingTrack.artist || ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0 sm:gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground/60 hover:text-foreground hidden sm:flex"
                  onClick={() => skip("prev")}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 text-foreground"
                  onClick={() => playTrack(playingTrack)}
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
                  className="w-8 h-8 text-muted-foreground/60 hover:text-foreground hidden sm:flex"
                  onClick={() => skip("next")}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={toggleMute}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div
                  ref={volRef}
                  className="w-12 sm:w-20 h-1 bg-border/40 rounded-full cursor-pointer relative group select-none hidden sm:block"
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
      )}
    </div>
  );
}
