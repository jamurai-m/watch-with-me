"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getRoom, type RoomResponse, updatePlayback } from '../api-client';
import { YouTubePlayer } from '../components/youtube-player';

function RoomPageContent() {
  const searchParams = useSearchParams();
  const params = searchParams?.get ? searchParams : null;
  const room = (params?.get('room') ?? 'ROOM').toUpperCase();
  const name = params?.get('name') ?? 'Guest';
  const isHost = params?.get('host') === '1';

  const [roomData, setRoomData] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const lastSourceUrlRef = useRef('');
  const latestPlaybackUpdatedAtRef = useRef('');
  const pendingPlaybackRef = useRef<{ baselineUpdatedAt: string; requestId: number } | null>(null);
  const playbackRequestIdRef = useRef(0);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const refreshRoom = useCallback(async () => {
    const nextRoomData = await getRoom(room);
    const incomingUpdatedAt = Date.parse(nextRoomData.playback.updated_at);
    const latestUpdatedAt = Date.parse(latestPlaybackUpdatedAtRef.current);
    const pendingPlayback = pendingPlaybackRef.current;

    if (
      (Number.isFinite(latestUpdatedAt) && incomingUpdatedAt < latestUpdatedAt)
      || (pendingPlayback && incomingUpdatedAt <= Date.parse(pendingPlayback.baselineUpdatedAt))
    ) {
      return;
    }

    latestPlaybackUpdatedAtRef.current = nextRoomData.playback.updated_at;
    setRoomData(nextRoomData);
  }, [room]);

  const connectRoomEvents = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const apiBaseUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000');
    apiBaseUrl.protocol = apiBaseUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    websocketRef.current?.close();
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const socket = new WebSocket(`${apiBaseUrl.origin}/rooms/${encodeURIComponent(room)}/events`);
    websocketRef.current = socket;

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data as string) as { type?: string; room?: RoomResponse };
        if (payload.type === 'room_state' && payload.room) {
          const incomingUpdatedAt = Date.parse(payload.room.playback.updated_at);
          const latestUpdatedAt = Date.parse(latestPlaybackUpdatedAtRef.current);
          const pendingPlayback = pendingPlaybackRef.current;
          if (
            (Number.isFinite(latestUpdatedAt) && incomingUpdatedAt < latestUpdatedAt)
            || (pendingPlayback && incomingUpdatedAt <= Date.parse(pendingPlayback.baselineUpdatedAt))
          ) {
            return;
          }

          latestPlaybackUpdatedAtRef.current = payload.room.playback.updated_at;
          setRoomData(payload.room);
          setErrorMessage('');
        }
      } catch {
        // Ignore malformed websocket messages and rely on the HTTP snapshot fallback.
      }
    });

    socket.addEventListener('close', () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        connectRoomEvents();
      }, 1500);
    });

    socket.addEventListener('error', () => {
      socket.close();
    });
  }, [room]);

  useEffect(() => {
    const serverSourceUrl = roomData?.playback.source_url ?? '';
    if (serverSourceUrl !== lastSourceUrlRef.current) {
      lastSourceUrlRef.current = serverSourceUrl;
      setSourceUrlInput(serverSourceUrl);
    }
  }, [roomData?.playback.source_url]);

  useEffect(() => {
    let isMounted = true;
    shouldReconnectRef.current = true;

    const loadRoom = async () => {
      setIsLoading(true);
      try {
        const nextRoomData = await getRoom(room);
        if (!isMounted) return;
        latestPlaybackUpdatedAtRef.current = nextRoomData.playback.updated_at;
        setRoomData(nextRoomData);
        setErrorMessage('');
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load room state.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRoom();
    connectRoomEvents();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshRoom();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(async () => {
      try {
        if (!isMounted) return;
        await refreshRoom();
      } catch {
        // Keep the last known room state on transient polling failures.
      }
    }, 3000);

    return () => {
      isMounted = false;
      shouldReconnectRef.current = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      websocketRef.current?.close();
      websocketRef.current = null;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [connectRoomEvents, refreshRoom, room]);

  const applyPlaybackUpdate = useCallback(
    async (payload: {
      source_url?: string;
      is_playing?: boolean;
      current_time?: number;
    }) => {
      if (!isHost) return;
      const requestId = playbackRequestIdRef.current + 1;
      playbackRequestIdRef.current = requestId;
      const baselineUpdatedAt = roomData?.playback.updated_at ?? '';
      pendingPlaybackRef.current = { baselineUpdatedAt, requestId };
      setRoomData((previousRoomData) => {
        if (!previousRoomData) {
          return previousRoomData;
        }

        return {
          ...previousRoomData,
          playback: {
            ...previousRoomData.playback,
            ...payload,
          },
        };
      });
      setIsUpdating(true);
      setErrorMessage('');
      try {
        const nextRoomData = await updatePlayback(room, payload);
        if (requestId === playbackRequestIdRef.current) {
          pendingPlaybackRef.current = null;
          latestPlaybackUpdatedAtRef.current = nextRoomData.playback.updated_at;
          setRoomData(nextRoomData);
        }
      } catch (error) {
        if (requestId === playbackRequestIdRef.current) {
          pendingPlaybackRef.current = null;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to update playback.');
      } finally {
        if (requestId === playbackRequestIdRef.current) {
          setIsUpdating(false);
        }
      }
    },
    [isHost, room, roomData?.playback.updated_at],
  );

  const loadSource = () => {
    const nextSourceUrl = sourceUrlInput.trim();
    if (!nextSourceUrl) {
      return;
    }

    void applyPlaybackUpdate({
      source_url: nextSourceUrl,
      current_time: 0,
      is_playing: false,
    });
  };

  const handleNativePlaybackChange = useCallback(
    (payload: { is_playing?: boolean; current_time?: number }) => {
      if (!isHost) return;
      void applyPlaybackUpdate(payload);
    },
    [applyPlaybackUpdate, isHost],
  );

  const participants = roomData?.participants ?? [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {errorMessage && (
          <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</p>
        )}

        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Room</p>
              <h1 className="text-3xl font-semibold text-white">{room}</h1>
              <p className="mt-2 text-slate-300">
                {isLoading && !roomData ? 'Loading room state...' : `${name} joined the watch party.`}
              </p>
            </div>
            <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
              {isHost ? 'You are the host' : 'You are a viewer'}
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <YouTubePlayer
              sourceUrl={roomData?.playback.source_url ?? ''}
              isPlaying={roomData?.playback.is_playing ?? false}
              currentTime={roomData?.playback.current_time ?? 0}
              canControl={isHost}
              onPlaybackChange={handleNativePlaybackChange}
            />

            <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm text-slate-400" htmlFor="source-url-input">
                  YouTube URL or video ID
                </label>
                <input
                  id="source-url-input"
                  value={sourceUrlInput}
                  onChange={(event) => setSourceUrlInput(event.target.value)}
                  disabled={!isHost || isUpdating}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <button
                type="button"
                onClick={loadSource}
                disabled={!isHost || isUpdating}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Load source
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Participants</p>
            <ul className="mt-3 space-y-2">
              {participants.map((participant) => (
                <li
                  key={participant.participant_id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
                >
                  {participant.name}
                  {participant.is_host ? ' (host)' : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading room…</div>}>
      <RoomPageContent />
    </Suspense>
  );
}
