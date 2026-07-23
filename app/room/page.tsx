"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { MoviePreviewCard } from '../components/movie-preview-card';
import { MovieSelect } from '../components/movie-select';
import { getActiveMovie, sampleMovies } from '../lib/sample-data';

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

  const activeMovie = useMemo(() => getActiveMovie(selectedMovie), [selectedMovie]);

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
            <MoviePreviewCard eyebrow="Now playing" movie={activeMovie} />

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
              <MovieSelect
                id="movie-select"
                label="Movie selection"
                value={selectedMovie}
                movies={sampleMovies}
                onChange={setSelectedMovie}
              />
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
