"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  PictureInPicture,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  title?: string;
  onTheatreToggle?: () => void;
  isTheatreMode?: boolean;
}

export function VideoPlayer({
  url,
  title,
  onTheatreToggle,
  isTheatreMode = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const [isScrubbing] = useState(false);

  const storageKey = `nuraweb-video-${btoa(url).slice(0, 32)}`;

  // Save volume preference
  useEffect(() => {
    const savedVol = localStorage.getItem("nuraweb-video-volume");
    if (savedVol !== null) {
      setVolume(parseFloat(savedVol));
    }
    const savedMute = localStorage.getItem("nuraweb-video-muted");
    if (savedMute !== null) {
      setIsMuted(savedMute === "true");
    }
  }, []);

  // Sync volume state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Check for saved playback position to resume
  useEffect(() => {
    const stored = parseFloat(localStorage.getItem(storageKey) || "0");
    if (stored > 5) {
      setSavedTime(stored);
      setShowResumePrompt(true);
    }
  }, [storageKey]);

  // Automatically save playback position periodically
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(video.currentTime);
      }
      if (video.currentTime > 5) {
        localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleDurationChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleDurationChange);
    };
  }, [storageKey, isScrubbing]);

  // Intersection Observer to pause when off-screen
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !video.paused) {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => {
      observer.unobserve(video);
    };
  }, []);

  // Pause on page tab blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (document.hidden && video && !video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      setShowResumePrompt(false);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    setCurrentTime(video.currentTime);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("nuraweb-video-muted", String(next));
      return next;
    });
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    localStorage.setItem("nuraweb-video-volume", String(val));
    localStorage.setItem("nuraweb-video-muted", String(val === 0));
  }, []);

  const handleSpeedChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSpeedMenu(false);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handlePiPToggle = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP failed", e);
    }
  }, []);

  // Handle keys when focused
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys when user is typing in form inputs
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "arrowleft":
          e.preventDefault();
          handleSeek(-5);
          break;
        case "arrowright":
          e.preventDefault();
          handleSeek(5);
          break;
        case "j":
          e.preventDefault();
          handleSeek(-10);
          break;
        case "l":
          e.preventDefault();
          handleSeek(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.05));
          setIsMuted(false);
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.05));
          break;
        case "m":
          e.preventDefault();
          handleMuteToggle();
          break;
        case "f":
          e.preventDefault();
          handleFullscreenToggle();
          break;
        case "t":
          e.preventDefault();
          if (onTheatreToggle) onTheatreToggle();
          break;
        default:
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handlePlayPause,
    handleSeek,
    handleMuteToggle,
    handleFullscreenToggle,
    onTheatreToggle,
  ]);

  // Sync fullscreen state if changed externally (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Hide controls after inactivity
  const triggerControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    triggerControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, triggerControlsTimer]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const timeRemaining = duration - currentTime;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const nextTime = percentage * duration;

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleResume = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = savedTime;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  const handleStartOver = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    localStorage.removeItem(storageKey);
    setShowResumePrompt(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/player relative w-full overflow-hidden bg-black text-white focus-visible:outline-none transition-all duration-300",
        isTheatreMode && !isFullscreen ? "aspect-[21/9]" : "aspect-video",
        isFullscreen ? "h-screen w-screen" : "rounded-xl border border-border/10 shadow-2xl"
      )}
      onMouseMove={triggerControlsTimer}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-contain cursor-pointer"
        onClick={handlePlayPause}
        onDoubleClick={handleFullscreenToggle}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        preload="auto"
      />

      {/* Title overlay */}
      {title && showControls && (
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-6 py-4 transition-opacity duration-300 pointer-events-none">
          <h3 className="font-mono text-sm uppercase tracking-wider text-white/90 drop-shadow-md">
            {title}
          </h3>
        </div>
      )}

      {/* Resume dialog */}
      {showResumePrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-30 transition-all duration-300">
          <div className="max-w-xs border border-white/20 bg-background/95 p-6 rounded-lg text-foreground font-mono text-xs uppercase space-y-4 shadow-2xl">
            <p className="text-center font-semibold leading-relaxed">
              Resume watching from <span className="text-primary font-bold">{formatTime(savedTime)}</span>?
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={handleResume}
                className="flex-1 border border-primary bg-primary text-primary-foreground py-2 hover:bg-primary/90 transition-colors uppercase text-[10px]"
              >
                Resume
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 border border-border bg-background py-2 hover:bg-muted transition-colors uppercase text-[10px]"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Center Indicator */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={handlePlayPause}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md hover:scale-105 hover:bg-black/75 transition-all duration-300 pointer-events-auto"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 fill-white" />
          ) : (
            <Play className="h-6 w-6 fill-white ml-1" />
          )}
        </button>
      </div>

      {/* Custom Control Bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-5 pb-4 pt-8 transition-opacity duration-300 flex flex-col gap-3 z-20",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {/* Progress bar / Scrubber */}
        <div
          onClick={handleProgressBarClick}
          className="group/timeline relative h-1.5 w-full bg-white/20 cursor-pointer rounded-full transition-all duration-200 hover:h-2"
        >
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full relative"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            {/* Playhead handle */}
            <div className="absolute right-[-6px] top-[50%] translate-y-[-50%] h-3.5 w-3.5 scale-0 group-hover/timeline:scale-100 rounded-full bg-primary border-2 border-white transition-transform duration-100" />
          </div>
        </div>

        {/* Buttons / Options */}
        <div className="flex items-center justify-between font-mono text-xs text-white/90">
          <div className="flex items-center gap-4">
            {/* Play/Pause Mini button */}
            <button
              onClick={handlePlayPause}
              className="hover:text-white transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={handleMuteToggle}
                className="hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-16 bg-white/30 accent-primary rounded-lg appearance-none cursor-pointer outline-none transition-all duration-200 origin-left scale-x-0 group-hover/volume:scale-x-100 w-0 group-hover/volume:w-16"
              />
            </div>

            {/* Time code: Current / Time remaining */}
            <span className="text-[11px] text-white/80 select-none">
              {formatTime(currentTime)} <span className="opacity-50">/</span> -{formatTime(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Playback speed dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                className="hover:text-white hover:bg-white/10 px-2 py-0.5 rounded transition-colors text-[10px]"
                aria-haspopup="true"
                aria-expanded={showSpeedMenu}
              >
                {playbackRate === 1 ? "1.0x" : `${playbackRate}x`}
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-20 border border-white/10 bg-black/95 backdrop-blur-md rounded shadow-2xl py-1 text-center flex flex-col z-30">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={cn(
                        "w-full py-1.5 text-[10px] hover:bg-white/10 transition-colors",
                        playbackRate === rate ? "text-primary font-bold" : "text-white/80"
                      )}
                    >
                      {rate === 1 ? "Normal" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theatre Mode button */}
            {onTheatreToggle && (
              <button
                onClick={onTheatreToggle}
                className="hover:text-white transition-colors"
                title={isTheatreMode ? "Default View" : "Theatre Mode"}
                aria-label="Toggle Theatre Mode"
              >
                <Tv className={cn("h-4 w-4", isTheatreMode && "text-primary")} />
              </button>
            )}

            {/* PiP button */}
            <button
              onClick={handlePiPToggle}
              className="hover:text-white transition-colors"
              title="Picture in Picture"
              aria-label="Toggle Picture in Picture"
            >
              <PictureInPicture className="h-4 w-4" />
            </button>

            {/* Fullscreen button */}
            <button
              onClick={handleFullscreenToggle}
              className="hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
