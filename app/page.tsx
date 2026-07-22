"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const sampleMovies = [
  { title: 'The Matrix', year: '1999', badge: 'Classic Sci-Fi' },
  { title: 'Interstellar', year: '2014', badge: 'Space Epic' },
  { title: 'La La Land', year: '2016', badge: 'Musical Romance' },
];

function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
}

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('You');
  const [roomInput, setRoomInput] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(sampleMovies[0].title);

  const activeMovie = useMemo(
    () => sampleMovies.find((movie) => movie.title === selectedMovie) ?? sampleMovies[0],
    [selectedMovie]
  );

  const createRoom = () => {
    const safeName = name.trim() || 'Guest';
    const room = generateRoomCode();
    router.push(`/room?room=${room}&name=${encodeURIComponent(safeName)}&host=1`);
  };

  const joinRoom = () => {
    const code = roomInput.trim().toUpperCase();
    if (!code) return;
    const safeName = name.trim() || 'Guest';
    router.push(`/room?room=${code}&name=${encodeURIComponent(safeName)}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Watch With Me</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Bring movie night back into sync.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Start a room, invite your person, and keep playback aligned with simple shared controls.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400" htmlFor="name-input">
                  Your display name
                </label>
                <input
                  id="name-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={createRoom}
                  className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Create room
                </button>
                <div className="flex gap-2">
                  <input
                    value={roomInput}
                    onChange={(event) => setRoomInput(event.target.value)}
                    className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    placeholder="Enter room code"
                  />
                  <button
                    onClick={joinRoom}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">MVP focus</p>
                <p className="mt-2 text-sm text-slate-300">Room creation, shared controls, and a simple viewing experience.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">Next milestone</p>
                <p className="mt-2 text-sm text-slate-300">Real-time sync across separate devices and persistent rooms.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-800">
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_60%)] p-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Tonight's pick</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{activeMovie.title}</h2>
                  <p className="mt-2 text-slate-400">{activeMovie.year} • {activeMovie.badge}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400" htmlFor="movie-select">
                Preview a movie
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
          </section>
        </div>
      </div>
    </main>
  );
}
