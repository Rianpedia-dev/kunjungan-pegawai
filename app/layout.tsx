import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Kunjungan Pegawai & Buku Tamu Digital",
  description: "Aplikasi pencatatan kunjungan pegawai dan verifikasi tamu instansi berbasis QR Code modern, simpel, dan terintegrasi.",
  icons: {
    icon: [
      { url: "/logo-kunjungan-pegawai.avif", type: "image/avif" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo-kunjungan-pegawai.avif",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="icon" href="/logo-kunjungan-pegawai.avif" type="image/avif" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/logo-kunjungan-pegawai.avif" type="image/avif" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
