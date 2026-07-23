import type { SampleMovie } from '../lib/sample-data';

type MoviePreviewCardProps = {
  eyebrow: string;
  movie: SampleMovie;
};

export function MoviePreviewCard({ eyebrow, movie }: MoviePreviewCardProps) {
  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-800">
      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_60%)] p-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{movie.title}</h2>
          <p className="mt-2 text-slate-400">
            {movie.year} • {movie.badge}
          </p>
        </div>
      </div>
    </div>
  );
}