"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getRoom, type RoomResponse, updatePlayback } from '../api-client';
import { MovieSelect } from '../components/movie-select';
import { YouTubePlayer } from '../components/youtube-player';
import { getMovieForRoom, sampleMovies } from '../lib/sample-data';

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

  const selectedMovie = roomData?.playback.movie_title ?? sampleMovies[0].title;
  const activeMovie = useMemo(() => getMovieForRoom(selectedMovie), [selectedMovie]);
  const movieChoices = useMemo(() => {
    if (sampleMovies.some((movie) => movie.title === selectedMovie)) {
      return sampleMovies;
    }
    return [
      ...sampleMovies,
      {
        title: selectedMovie,
        year: 'Custom',
        badge: 'Room Selection',
      },
    ];
  }, [selectedMovie]);

  const refreshRoom = useCallback(async () => {
    const nextRoomData = await getRoom(room);
    setRoomData(nextRoomData);
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

    const loadRoom = async () => {
      setIsLoading(true);
      try {
        const nextRoomData = await getRoom(room);
        if (!isMounted) return;
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
      window.clearInterval(intervalId);
    };
  }, [refreshRoom, room]);

  const applyPlaybackUpdate = async (payload: {
    movie_title?: string;
    source_url?: string;
    is_playing?: boolean;
    current_time?: number;
  }) => {
    if (!isHost) return;
    setIsUpdating(true);
    setErrorMessage('');
    try {
      const nextRoomData = await updatePlayback(room, payload);
      setRoomData(nextRoomData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update playback.');
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePlayback = () => {
    if (!roomData) return;
    void applyPlaybackUpdate({ is_playing: !roomData.playback.is_playing });
  };

  const skipAhead = () => {
    if (!roomData) return;
    void applyPlaybackUpdate({ current_time: roomData.playback.current_time + 10 });
  };

  const onMovieChange = (movieTitle: string) => {
    void applyPlaybackUpdate({ movie_title: movieTitle });
  };

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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <YouTubePlayer
              sourceUrl={roomData?.playback.source_url ?? ''}
              isPlaying={roomData?.playback.is_playing ?? false}
              currentTime={roomData?.playback.current_time ?? 0}
              title={activeMovie.title}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={togglePlayback}
                disabled={!isHost || !roomData || isUpdating}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {roomData?.playback.is_playing ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={skipAhead}
                disabled={!isHost || !roomData || isUpdating}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                Skip +10s
              </button>
              <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-400">
                Time: {(roomData?.playback.current_time ?? 0).toFixed(1)}s
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm text-slate-400" htmlFor="source-url-input">
                  YouTube URL or video ID
                </label>
                <input
                  id="source-url-input"
                  value={sourceUrlInput}
                  onChange={(event) => setSourceUrlInput(event.target.value)}
                  disabled={!isHost || !roomData || isUpdating}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <button
                onClick={loadSource}
                disabled={!isHost || !roomData || isUpdating}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Load source
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <MovieSelect
                id="movie-select"
                label="Movie selection"
                value={selectedMovie}
                movies={movieChoices}
                disabled={!isHost || !roomData || isUpdating}
                onChange={onMovieChange}
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Participants</p>
              <ul className="mt-3 space-y-2">
                {participants.map((participant) => (
                  <li
                    key={`${participant.name}-${participant.joined_at}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
                  >
                    {participant.name}
                    {participant.is_host ? ' (host)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
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
