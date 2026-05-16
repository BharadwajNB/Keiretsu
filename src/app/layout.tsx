import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: 'Keiretsu — Find Builders Near You',
  description:
    'Discover technically skilled people around you. Search by skills, connect, and collaborate on projects with builders in your college and locality.',
  keywords: ['collaboration', 'skills', 'developers', 'college', 'map', 'connect', 'proximity', 'networking'],
  authors: [{ name: 'Keiretsu' }],
  openGraph: {
    title: 'Keiretsu — Find Builders Near You',
    description:
      'Discover technically skilled people around you. Search by skills, connect, and collaborate on projects with builders in your college and locality.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Keiretsu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keiretsu — Find Builders Near You',
    description:
      'Discover technically skilled people around you. Search by skills, connect, and collaborate.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/custom-globe-transparent.png',
    apple: '/custom-globe-transparent.png',
  },
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
