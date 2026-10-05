import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Social Hub | Multi-Platform Scheduler',
  description:
    '1-Click Multi-Channel Distribution across X/Twitter, Threads, LinkedIn, and Instagram via Typefully & Buffer APIs with Supabase storage and database.',
  keywords: [
    'social media scheduler',
    'typefully',
    'buffer',
    'supabase',
    'content calendar',
    'multi-channel publishing',
  ],
  authors: [{ name: 'Social Hub' }],
};

export const viewport: Viewport = {
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
