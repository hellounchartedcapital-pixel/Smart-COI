import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-dm-sans',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <body className="font-sans">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
