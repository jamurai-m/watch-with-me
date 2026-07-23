"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MoviePreviewCard } from './components/movie-preview-card';
import { MovieSelect } from './components/movie-select';
import { RoomAccessForm } from './components/room-access-form';
import { generateRoomCode } from './lib/room-code';
import { getActiveMovie, sampleMovies } from './lib/sample-data';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('You');
  const [roomInput, setRoomInput] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(sampleMovies[0].title);

  const activeMovie = useMemo(() => getActiveMovie(selectedMovie), [selectedMovie]);

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

            <RoomAccessForm
              name={name}
              roomCode={roomInput}
              onNameChange={setName}
              onRoomCodeChange={setRoomInput}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />

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
            <MoviePreviewCard eyebrow="Tonight's pick" movie={activeMovie} />

            <MovieSelect
              id="movie-select"
              label="Preview a movie"
              value={selectedMovie}
              movies={sampleMovies}
              onChange={setSelectedMovie}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
