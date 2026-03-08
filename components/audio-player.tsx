"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Track {
  id: number;
  title: string;
  track_number: number;
  duration: number | null;
  file_url: string;
  file_type: string;
  play_count?: number;
}

interface AudioPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  releaseTitle?: string;
  artistName?: string;
  coverUrl?: string | null;
}

export function AudioPlayer({
  tracks,
  currentTrackIndex,
  onTrackChange,
  releaseTitle,
  artistName,
  coverUrl,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasCountedPlay, setHasCountedPlay] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const currentTrack = tracks[currentTrackIndex];

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      const newIndex =
        currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
      onTrackChange(newIndex);
    }
  }, [currentTime, currentTrackIndex, tracks.length, onTrackChange]);

  const handleNext = useCallback(() => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      onTrackChange(
        randomIndex !== currentTrackIndex
          ? randomIndex
          : (randomIndex + 1) % tracks.length,
      );
    } else {
      const newIndex =
        currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
      onTrackChange(newIndex);
    }
  }, [currentTrackIndex, tracks.length, onTrackChange, isShuffle]);

  const handleEnded = useCallback(() => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  }, [isRepeat, handleNext]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Count play after 5 seconds
  useEffect(() => {
    if (isPlaying && currentTime >= 5 && !hasCountedPlay && currentTrack) {
      setHasCountedPlay(true);
      fetch(`/api/tracks/${currentTrack.id}/play`, { method: "POST" }).catch(
        () => {},
      );
    }
  }, [isPlaying, currentTime, hasCountedPlay, currentTrack]);

  // Reset play count when track changes
  useEffect(() => {
    setHasCountedPlay(false);
  }, [currentTrackIndex]);

  // Auto play on track change
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex, currentTrack]);

  // Cleanup: pause audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          if (e.shiftKey && audioRef.current) {
            audioRef.current.currentTime = Math.max(0, currentTime - 10);
          } else {
            handlePrevious();
          }
          break;
        case "ArrowRight":
          if (e.shiftKey && audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, currentTime + 10);
          } else {
            handleNext();
          }
          break;
        case "KeyM":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, handlePrevious, handleNext, currentTime, duration]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-border/30" />

      <audio
        ref={audioRef}
        src={currentTrack.file_url}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="relative">
        {/* Progress bar - thin line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-border/30 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) {
              audioRef.current.currentTime = percent * duration;
            }
          }}
        >
          <div
            className="h-full bg-foreground transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>

        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-4">
          {/* Left: Track info */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 max-w-[300px]">
            {coverUrl && (
              <div className="relative flex-shrink-0">
                <img
                  src={coverUrl}
                  alt={releaseTitle || "Cover"}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover shadow-lg"
                />
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                    <div className="flex items-end gap-[2px] h-4">
                      <span className="w-[3px] bg-white rounded-full sound-wave" />
                      <span className="w-[3px] bg-white rounded-full sound-wave sound-wave-delay-1" />
                      <span className="w-[3px] bg-white rounded-full sound-wave sound-wave-delay-2" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground/70 truncate">
                {artistName}
              </p>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn(
                  "hidden md:flex p-2 transition-colors duration-200",
                  isShuffle
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
                aria-label="Aleatorio"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrevious}
                className="p-2 text-muted-foreground/70 hover:text-foreground transition-colors duration-200"
                aria-label="Anterior"
              >
                <SkipBack className="w-5 h-5" fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="p-2.5 md:p-3 bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-transform duration-150 mx-1"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause
                    className="w-5 h-5 md:w-6 md:h-6"
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    className="w-5 h-5 md:w-6 md:h-6 ml-0.5"
                    fill="currentColor"
                  />
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-muted-foreground/70 hover:text-foreground transition-colors duration-200"
                aria-label="Siguiente"
              >
                <SkipForward className="w-5 h-5" fill="currentColor" />
              </button>
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={cn(
                  "hidden md:flex p-2 transition-colors duration-200",
                  isRepeat
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
                aria-label="Repetir"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Time display - mobile hidden, desktop visible */}
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground/60 tabular-nums font-mono">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div className="w-32 lg:w-48">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center justify-end gap-2 flex-1 max-w-[300px]">
            <span className="text-xs text-muted-foreground/50 tabular-nums font-mono md:hidden">
              {formatTime(currentTime)}
            </span>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              >
                <VolumeIcon className="w-5 h-5" />
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Track list component
interface TrackListProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  isPlaying: boolean;
}

export function TrackList({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  isPlaying,
}: TrackListProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-card/30 ring-1 ring-border/30">
      {tracks.map((track, index) => (
        <button
          key={track.id}
          onClick={() => onTrackSelect(index)}
          className={cn(
            "w-full flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-4 text-left transition-all duration-200 group",
            "hover:bg-accent/30",
            index === currentTrackIndex && "bg-accent/20",
            index !== tracks.length - 1 && "border-b border-border/20",
          )}
        >
          <span className="w-6 sm:w-8 text-center text-xs sm:text-sm text-muted-foreground/60 tabular-nums font-mono group-hover:hidden">
            {index === currentTrackIndex && isPlaying ? (
              <span className="inline-flex items-end justify-center gap-[3px] h-4">
                <span className="w-[3px] bg-foreground rounded-full sound-wave" />
                <span className="w-[3px] bg-foreground rounded-full sound-wave sound-wave-delay-1" />
                <span className="w-[3px] bg-foreground rounded-full sound-wave sound-wave-delay-2" />
              </span>
            ) : (
              track.track_number.toString().padStart(2, "0")
            )}
          </span>
          <span className="w-6 sm:w-8 hidden group-hover:flex items-center justify-center">
            {index === currentTrackIndex && isPlaying ? (
              <Pause className="w-4 h-4 text-foreground" fill="currentColor" />
            ) : (
              <Play
                className="w-4 h-4 text-foreground ml-0.5"
                fill="currentColor"
              />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm sm:text-[15px] truncate transition-colors duration-200",
                index === currentTrackIndex
                  ? "text-foreground font-medium"
                  : "text-foreground/80",
              )}
            >
              {track.title}
            </p>
          </div>
          <span className="text-xs text-muted-foreground/50 tabular-nums font-mono hidden sm:block">
            {track.duration ? formatDuration(track.duration) : "--:--"}
          </span>
        </button>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
