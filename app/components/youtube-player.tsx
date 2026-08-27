"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type YouTubePlayerProps = {
  sourceUrl: string;
  isPlaying: boolean;
  currentTime: number;
  canControl: boolean;
  onPlaybackChange?: (payload: { is_playing?: boolean; current_time?: number }) => void;
};

type YouTubeApi = {
  Player: new (container: HTMLElement, options: Record<string, unknown>) => {
    loadVideoById: (videoId: string) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    getCurrentTime: () => number;
    getPlayerState: () => number;
    stopVideo: () => void;
    destroy: () => void;
  };
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise !== null) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve();
      };
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Unable to load the YouTube player API.'));

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function extractYouTubeVideoId(sourceUrl: string): string {
  const trimmedSource = sourceUrl.trim();
  if (!trimmedSource) {
    return '';
  }

  if (/^[A-Za-z0-9_-]{11}$/.test(trimmedSource)) {
    return trimmedSource;
  }

  let candidateUrl = trimmedSource;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedSource)) {
    const isLikelyYoutubeHost = /(?:^|\/)(?:youtu\.be|(?:m|music\.)?youtube\.com|youtube-nocookie\.com)(?:\/|$)/i.test(trimmedSource)
      || trimmedSource.toLowerCase().includes('youtube.com')
      || trimmedSource.toLowerCase().includes('youtu.be')
      || trimmedSource.toLowerCase().includes('youtube-nocookie.com');

    if (isLikelyYoutubeHost) {
      candidateUrl = `https://${trimmedSource}`;
    }
  }

  try {
    const url = new URL(candidateUrl);
    const hostname = url.hostname.toLowerCase();

    const isYouTubeHost = hostname === 'youtu.be'
      || hostname.endsWith('.youtu.be')
      || hostname.includes('youtube.com')
      || hostname.includes('youtube-nocookie.com');

    if (!isYouTubeHost) {
      return '';
    }

    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      return url.pathname.split('/').find(Boolean) ?? '';
    }

    const videoId = url.searchParams.get('v');
    if (videoId) {
      return videoId;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'live') {
      return pathParts[1] ?? '';
    }
  } catch {
    return '';
  }

  return '';
}

export function YouTubePlayer({
  sourceUrl,
  isPlaying,
  currentTime,
  canControl,
  onPlaybackChange,
}: Readonly<YouTubePlayerProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<InstanceType<YouTubeApi['Player']> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const suppressPlaybackEventUntilRef = useRef(0);
  const lastReportedPlaybackRef = useRef({ isPlaying, currentTime });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const videoId = useMemo(() => extractYouTubeVideoId(sourceUrl), [sourceUrl]);
  let statusLabel = 'Waiting for source';
  if (status === 'ready') {
    statusLabel = canControl ? 'Native controls ready' : 'Viewer mode';
  } else if (status === 'loading') {
    statusLabel = 'Loading...';
  } else if (status === 'error') {
    statusLabel = 'Player error';
  }

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    lastReportedPlaybackRef.current = { isPlaying, currentTime };
  }, [currentTime, isPlaying]);

  const reportPlaybackChange = useCallback((nextIsPlaying: boolean) => {
    if (typeof window === 'undefined' || Date.now() < suppressPlaybackEventUntilRef.current) {
      return;
    }

    const player = playerRef.current;
    if (!player || !onPlaybackChange) {
      return;
    }

    const nextCurrentTime = player.getCurrentTime();
    const lastReported = lastReportedPlaybackRef.current;
    if (lastReported.isPlaying === nextIsPlaying && Math.abs(lastReported.currentTime - nextCurrentTime) < 0.5) {
      return;
    }

    lastReportedPlaybackRef.current = {
      isPlaying: nextIsPlaying,
      currentTime: nextCurrentTime,
    };
    onPlaybackChange({ is_playing: nextIsPlaying, current_time: nextCurrentTime });
  }, [onPlaybackChange]);

  const applyExternalPlaybackState = useCallback((player: InstanceType<YouTubeApi['Player']>) => {
    suppressPlaybackEventUntilRef.current = Date.now() + 250;

    const desiredCurrentTime = currentTimeRef.current;
    if (Math.abs(player.getCurrentTime() - desiredCurrentTime) > 1.5) {
      player.seekTo(desiredCurrentTime, true);
    }

    if (isPlayingRef.current) {
      player.playVideo();
      return;
    }

    player.pauseVideo();
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!containerRef.current || !videoId) {
      if (!videoId) {
        setStatus('idle');
      }
      return undefined;
    }

    setStatus('loading');

    void loadYouTubeApi()
      .then(() => {
        if (!isActive || !containerRef.current || !window.YT?.Player) {
          return;
        }

        if (!playerRef.current) {
          playerRef.current = new window.YT.Player(containerRef.current, {
            videoId,
            playerVars: {
              controls: canControl ? 1 : 0,
              disablekb: canControl ? 0 : 1,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                if (!isActive) {
                  return;
                }
                setStatus('ready');
                const player = playerRef.current;
                if (!player) {
                  return;
                }

                applyExternalPlaybackState(player);
              },
              onStateChange: (event: { data?: number }) => {
                if (!isActive || !window.YT?.PlayerState) {
                  return;
                }

                if (event.data === window.YT.PlayerState.PLAYING) {
                  reportPlaybackChange(true);
                } else if (
                  event.data === window.YT.PlayerState.PAUSED ||
                  event.data === window.YT.PlayerState.ENDED ||
                  event.data === window.YT.PlayerState.CUED
                ) {
                  reportPlaybackChange(false);
                }
              },
            },
          });
        } else {
          playerRef.current.loadVideoById(videoId);
          applyExternalPlaybackState(playerRef.current);
        }
      })
      .catch(() => {
        if (isActive) {
          setStatus('error');
        }
      });

    return () => {
      isActive = false;
    };
  }, [applyExternalPlaybackState, canControl, reportPlaybackChange, videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== 'ready') {
      return;
    }

    if (!videoId) {
      player.stopVideo();
      return;
    }

    if (Math.abs(player.getCurrentTime() - currentTime) > 1.5) {
      suppressPlaybackEventUntilRef.current = Date.now() + 250;
      player.seekTo(currentTime, true);
    }

    if (isPlaying) {
      suppressPlaybackEventUntilRef.current = Date.now() + 250;
      player.playVideo();
      return;
    }

    suppressPlaybackEventUntilRef.current = Date.now() + 250;
    player.pauseVideo();
  }, [currentTime, isPlaying, status, videoId]);

  useEffect(() => {
    if (status !== 'ready' || !onPlaybackChange) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || Date.now() < suppressPlaybackEventUntilRef.current || !window.YT?.PlayerState) {
        return;
      }

      const playerState = player.getPlayerState();
      const currentPlayerTime = player.getCurrentTime();
      const lastReported = lastReportedPlaybackRef.current;
      const isCurrentlyPlaying = playerState === window.YT.PlayerState.PLAYING;
      const threshold = isCurrentlyPlaying ? 5 : 0.75;

      if (Math.abs(currentPlayerTime - lastReported.currentTime) > threshold) {
        lastReportedPlaybackRef.current = {
          isPlaying: isCurrentlyPlaying,
          currentTime: currentPlayerTime,
        };
        onPlaybackChange({
          is_playing: isCurrentlyPlaying,
          current_time: currentPlayerTime,
        });
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [onPlaybackChange, status]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Live player</p>
        </div>
        <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{statusLabel}</div>
      </div>

      <div className="aspect-video bg-black">
        {videoId ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-slate-400">
            Paste a YouTube URL or video ID to load the shared player.
          </div>
        )}
      </div>
    </div>
  );
}