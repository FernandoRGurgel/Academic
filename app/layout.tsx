import type {Metadata} from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { TopNav } from '@/components/TopNav';
import { Suspense } from 'react';

// Configure Fonts
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Academic Enterprise Portal',
  description: 'Gestão de Assessoria Acadêmica de Alta Precisão',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexSerif.variable}`}>
      <body suppressHydrationWarning className="antialiased min-h-screen bg-background">
        <Suspense fallback={<div className="h-16 border-b border-outline-variant bg-surface-container" />}>
          <TopNav />
        </Suspense>
        <div className="pt-16 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
