import './globals.css';

export const metadata = {
  title: 'Watch With Me',
  description: 'A simple app for watching movies together with synced playback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
