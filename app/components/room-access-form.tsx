type RoomAccessFormProps = {
  name: string;
  roomCode: string;
  isSubmitting?: boolean;
  onNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

export function RoomAccessForm({
  name,
  roomCode,
  isSubmitting = false,
  onNameChange,
  onRoomCodeChange,
  onCreateRoom,
  onJoinRoom,
}: RoomAccessFormProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
      <div>
        <label className="mb-2 block text-sm text-slate-400" htmlFor="name-input">
          Your display name
        </label>
        <input
          id="name-input"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="Your name"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          onClick={onCreateRoom}
          disabled={isSubmitting}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {isSubmitting ? 'Working...' : 'Create room'}
        </button>
        <div className="flex gap-2">
          <input
            value={roomCode}
            onChange={(event) => onRoomCodeChange(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="Enter room code"
          />
          <button
            onClick={onJoinRoom}
            disabled={isSubmitting}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}