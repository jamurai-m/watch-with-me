"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type YouTubePlayerProps = {
  sourceUrl: string;
  isPlaying: boolean;
  currentTime: number;
  title: string;
};

type YouTubeApi = {
  Player: new (container: HTMLElement, options: Record<string, unknown>) => {
    loadVideoById: (videoId: string) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    getCurrentTime: () => number;
    stopVideo: () => void;
    destroy: () => void;
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

  try {
    const url = new URL(trimmedSource);

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').find(Boolean) ?? '';
    }

    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return videoId;
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' || pathParts[0] === 'shorts') {
        return pathParts[1] ?? '';
      }
    }
  } catch {
    return '';
  }

  return '';
}

export function YouTubePlayer({ sourceUrl, isPlaying, currentTime, title }: Readonly<YouTubePlayerProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<InstanceType<YouTubeApi['Player']> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const videoId = useMemo(() => extractYouTubeVideoId(sourceUrl), [sourceUrl]);
  let statusLabel = 'Waiting for source';
  if (status === 'ready') {
    statusLabel = 'Synced';
  } else if (status === 'loading') {
    statusLabel = 'Loading...';
  } else if (status === 'error') {
    statusLabel = 'Player error';
  }

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
                if (isPlayingRef.current) {
                  playerRef.current?.playVideo();
                } else {
                  playerRef.current?.pauseVideo();
                }
              },
            },
          });
        } else {
          playerRef.current.loadVideoById(videoId);
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
  }, [videoId]);

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
      player.seekTo(currentTime, true);
    }
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [currentTime, isPlaying, status, videoId]);

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
          <p className="mt-1 text-sm text-slate-300">{title}</p>
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