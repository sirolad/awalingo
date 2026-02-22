import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import PWAUpdater from '@/components/PWAUpdater';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Parkinsans font for headlines (local)
const parkinsans = localFont({
  src: [
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Parkinsans/Parkinsans-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-parkinsans',
  display: 'swap',
});

// Metropolis font for subtexts
const metropolis = localFont({
  src: [
    {
      path: '../../public/fonts/Metropolis Font family/Metropolis-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis Font family/Metropolis-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis Font family/Metropolis-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis Font family/Metropolis-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis Font family/Metropolis-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-metropolis',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Neolingo - Mothertongue Rescue ',
  description:
    'A collaborative platform for learning and expanding the Low Resource Language dictionaries',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Neolingo',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3B82F6',
    'msapplication-tap-highlight': 'no',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Neolingo',
    title: 'Neolingo - Mothertongue Rescue',
    description:
      'A collaborative platform for learning and expanding the Low Resource Language dictionaries',
  },
  twitter: {
    card: 'summary',
    title: 'Neolingo - Mothertongue Rescue',
    description:
      'A collaborative platform for learning and expanding the Low Resource Language dictionaries',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png' }],
    shortcut: ['/icons/icon.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${parkinsans.variable} ${metropolis.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <PWAUpdater />
              {children}
              <Toaster richColors position="top-center" />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
