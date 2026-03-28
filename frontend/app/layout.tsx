import type { Metadata } from "next";
import { Noto_Sans_Mono } from "next/font/google";
import "./globals.css";

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "StripMyPix — EXIF Privacy Analyzer",
  description:
    "Analyze image EXIF metadata for privacy leaks and strip it in one click. Detect GPS, camera model, serial numbers, timestamps, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${notoSansMono.variable}`}>
      <body
        className={`min-h-screen antialiased ${notoSansMono.className}`}
      >
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--color-neon)]/20 border border-[var(--color-neon)] flex items-center justify-center">
                <span className="text-[var(--color-neon)] font-mono font-bold text-sm">
                  S
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-white">Strip</span>
                <span className="text-[var(--color-neon)]">My</span>
                <span className="text-white">Pix</span>
              </h1>
            </div>
            <span className="text-xs text-slate-500 font-mono hidden sm:block">
              EXIF Privacy Analyzer
            </span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
