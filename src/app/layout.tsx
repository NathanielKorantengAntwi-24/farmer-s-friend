// src/app/layout.tsx
import type { Metadata, Viewport } from "next"; 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import CssBaseline from '@mui/material/CssBaseline';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Identity & SEO Metadata
export const metadata: Metadata = {
  title: "Farmer's Friend",
  description: "Precision Calf Dehydration Management",
  manifest: "/manifest.json", 
  // Added icons for browser tab visibility
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Farmer's Friend",
  },
};

// 2. New Viewport Configuration (Fixes the warning)
export const viewport: Viewport = {
  themeColor: "#2e7d32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <CssBaseline />
        {children}
      </body>
    </html>
  );
}