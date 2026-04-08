import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SmartCOI',
    template: '%s | SmartCOI',
  },
  description:
    'AI-powered COI compliance tracking for commercial property managers',
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://smartcoi.io'
  ),
  openGraph: {
    title: 'SmartCOI',
    description:
      'AI-powered COI compliance tracking for commercial property managers',
    siteName: 'SmartCOI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartCOI',
    description:
      'AI-powered COI compliance tracking for commercial property managers',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://smartcoi.io/feed.xml',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <Script
          id="vtag-ai-js"
          async
          src="https://r2.leadsy.ai/tag.js"
          data-pid="1xStA5mI6tQwjoDps"
          data-version="062024"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
