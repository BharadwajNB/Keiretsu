import type { Metadata } from 'next';
import { Geist, Play } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const playFont = Play({
  variable: '--font-play',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Keiretsu — Find Builders Near You',
  description:
    'Discover technically skilled people around you. Search by skills, connect, and collaborate on projects with builders in your college and locality.',
  keywords: ['collaboration', 'skills', 'developers', 'college', 'map', 'connect'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${playFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
