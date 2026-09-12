import Link from "next/link";
import { ShieldCheck, Building, Sparkles, QrCode, ClipboardCheck } from "lucide-react";
import { getPegawaiListAction } from "@/app/actions/kunjungan";
import { VisitForm } from "@/components/public/visit-form";

export const revalidate = 0; // Dynamic data

export default async function HomePage() {
  const { data: pegawaiList } = await getPegawaiListAction();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Sistem Kunjungan Pegawai
              </h1>
              <p className="text-[11px] text-slate-500">Buku Tamu Digital & Tiket QR</p>
            </div>
          </div>

          <Link
            href="/admin/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Portal Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/60 rounded-full px-4 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Registrasi Tamu Lebih Mudah, Cepat & Terverifikasi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang di Portal Kunjungan
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Daftarkan agenda kunjungan Anda sekarang untuk mendapatkan tiket digital QR Code resmi yang mempermudah proses verifikasi saat kedatangan.
          </p>
        </div>

        {/* 3 Step Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Isi Formulir</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lengkapi identitas, instansi, dan pegawai yang ingin Anda temui.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Terima Tiket QR</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sistem menghasilkan kode booking dan QR Code unik untuk disimpan.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-3.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Scan & Masuk</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tunjukkan QR Code ke petugas resepsionis/satpam untuk check-in instan.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form Component */}
        <VisitForm pegawaiList={pegawaiList || []} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Sistem Kunjungan Pegawai. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/admin/login" className="hover:text-blue-600 transition-colors">
              Masuk Resepsionis / Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
