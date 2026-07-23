import type { SampleMovie } from '../lib/sample-data';

type MovieSelectProps = {
  id: string;
  label: string;
  value: string;
  movies: SampleMovie[];
  disabled?: boolean;
  onChange: (movieTitle: string) => void;
};

export function MovieSelect({ id, label, value, movies, disabled = false, onChange }: MovieSelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-400" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
      >
        {movies.map((movie) => (
          <option key={movie.title} value={movie.title}>
            {movie.title}
          </option>
        ))}
      </select>
    </div>
  );
}