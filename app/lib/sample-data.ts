export type SampleMovie = {
  title: string;
  year: string;
  badge: string;
};

export const sampleMovies: SampleMovie[] = [
  { title: 'The Matrix', year: '1999', badge: 'Classic Sci-Fi' },
  { title: 'Interstellar', year: '2014', badge: 'Space Epic' },
  { title: 'La La Land', year: '2016', badge: 'Musical Romance' },
];

export function getActiveMovie(selectedTitle: string): SampleMovie {
  return sampleMovies.find((movie) => movie.title === selectedTitle) ?? sampleMovies[0];
}

export function getMovieForRoom(selectedTitle: string): SampleMovie {
  if (!selectedTitle) {
    return sampleMovies[0];
  }

  const knownMovie = sampleMovies.find((movie) => movie.title === selectedTitle);
  if (knownMovie) {
    return knownMovie;
  }

  return {
    title: selectedTitle,
    year: 'Custom',
    badge: 'Room Selection',
  };
}