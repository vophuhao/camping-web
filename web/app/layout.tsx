import { Providers } from '@/components/Providers';
import SocketProvider from '@/provider/socketProvider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Campo',
  description: 'R?i ph? v? r?ng th�i!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
        <SocketProvider>
          <Providers>{children}</Providers>
        </SocketProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
