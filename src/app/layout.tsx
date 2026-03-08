// src/app/layout.tsx
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Farmer's Friend",
  description: "Precision Calf Dehydration Management",
  manifest: "/manifest.json", // Points to your public/manifest.json
  themeColor: "#2e7d32",      // A nice farm green for the status bar
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Farmer's Friend",
  },
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