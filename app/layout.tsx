import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Tilt_Neon, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'], // or just '400' for Monoton
});

const tiltNeon = Tilt_Neon({
  subsets: ['latin'],
  weight: '400',
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Lyric Search - Dan Glorioso",
  description: "A web app to search keywords from an artist's lyrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${tiltNeon.className} bg-gray-900 text-white`}>
        {children}
      </body>
    </html>
  );
}
