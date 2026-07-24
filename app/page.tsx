"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createRoom as createRoomRequest, joinRoom as joinRoomRequest } from './api-client';
import { RoomAccessForm } from './components/room-access-form';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('You');
  const [roomInput, setRoomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const createRoom = async () => {
    const safeName = name.trim() || 'Guest';
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const room = await createRoomRequest(safeName);
      router.push(`/room?room=${room.code}&name=${encodeURIComponent(safeName)}&host=1`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create room right now.');
      setIsSubmitting(false);
    }
  };

  const joinRoom = async () => {
    const code = roomInput.trim().toUpperCase();
    if (!code) return;
    const safeName = name.trim() || 'Guest';
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const room = await joinRoomRequest(code, safeName);
      router.push(`/room?room=${room.code}&name=${encodeURIComponent(safeName)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join room right now.');
      setIsSubmitting(false);
    }
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
              isSubmitting={isSubmitting}
              onNameChange={setName}
              onRoomCodeChange={setRoomInput}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />

            {errorMessage && (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</p>
            )}

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
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_60%)] p-6">
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Shared source</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Play content from a link</h2>
                  <p className="mt-2 text-slate-400">Drop in a YouTube URL in a room and keep everyone synced to the same source.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
