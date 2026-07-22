"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const sampleMovies = [
  { title: 'The Matrix', year: '1999', badge: 'Classic Sci-Fi' },
  { title: 'Interstellar', year: '2014', badge: 'Space Epic' },
  { title: 'La La Land', year: '2016', badge: 'Musical Romance' },
];

function RoomPageContent() {
  const searchParams = useSearchParams();
  const params = searchParams?.get ? searchParams : null;
  const room = params?.get('room') ?? 'ROOM';
  const name = params?.get('name') ?? 'Guest';
  const isHost = params?.get('host') === '1';

  const [selectedMovie, setSelectedMovie] = useState(sampleMovies[0].title);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);

  const activeMovie = useMemo(
    () => sampleMovies.find((movie) => movie.title === selectedMovie) ?? sampleMovies[0],
    [selectedMovie]
  );

  useEffect(() => {
    setParticipants([isHost ? `${name} (host)` : name, 'Mina', 'Jules']);
  }, [isHost, name]);

  const togglePlayback = () => {
    if (!isHost) return;
    setIsPlaying((prev) => !prev);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Room</p>
              <h1 className="text-3xl font-semibold text-white">{room}</h1>
              <p className="mt-2 text-slate-300">{name} joined the watch party.</p>
            </div>
            <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
              {isHost ? 'You are the host' : 'You are a viewer'}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-800">
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_60%)] p-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Now playing</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{activeMovie.title}</h2>
                  <p className="mt-2 text-slate-400">{activeMovie.year} • {activeMovie.badge}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={togglePlayback}
                disabled={!isHost}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => setCurrentTime((prev) => prev + 10)}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Skip +10s
              </button>
              <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-400">
                Time: {currentTime}s
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <label className="mb-2 block text-sm text-slate-400" htmlFor="movie-select">
                Movie selection
              </label>
              <select
                id="movie-select"
                value={selectedMovie}
                onChange={(event) => setSelectedMovie(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {sampleMovies.map((movie) => (
                  <option key={movie.title} value={movie.title}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Participants</p>
              <ul className="mt-3 space-y-2">
                {participants.map((person) => (
                  <li key={person} className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                    {person}
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
