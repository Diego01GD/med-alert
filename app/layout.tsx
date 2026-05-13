import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 1. Agregamos suppressHydrationWarning al body */}
      {/* 2. Dejamos el fondo limpio y con la fuente por defecto para que next-themes no choque */}
      <body 
        suppressHydrationWarning 
        className={`${geistSans.className} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 3. Metemos tu hermoso degradado dentro de un contenedor envolvente */}
          <div className="min-h-screen bg-gradient-to-r from-blue-200 to-cyan-200 text-slate-900">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}