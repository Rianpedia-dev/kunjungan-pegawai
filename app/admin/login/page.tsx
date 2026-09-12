"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signInAdminAction, signUpInitialAdminAction } from "@/app/actions/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      if (isRegisterMode) {
        toast.loading("Mendaftarkan akun admin baru...", { id: "auth" });
        const res = await signUpInitialAdminAction(formData);
        if (res.success) {
          toast.success("Pendaftaran admin berhasil! Silakan login.", { id: "auth" });
          setIsRegisterMode(false);
        } else {
          toast.error(res.error || "Gagal mendaftarkan akun", { id: "auth" });
        }
      } else {
        toast.loading("Memverifikasi kredensial...", { id: "auth" });
        const res = await signInAdminAction(formData);
        if (res.success) {
          toast.success("Login berhasil! Mengalihkan ke dashboard...", { id: "auth" });
          router.push("/admin");
          router.refresh();
        } else {
          toast.error(res.error || "Login gagal, periksa email & password", { id: "auth" });
        }
      }
    } catch {
      toast.error("Terjadi kendala jaringan", { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-100">
      {/* Back to public link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center text-xs">
        <Link
          href="/"
          className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Halaman Pengunjung (Publik)
        </Link>
        <span className="text-slate-400">v1.0.0</span>
      </div>

      <Card className="w-full max-w-md border-slate-200/90 shadow-xl rounded-3xl overflow-hidden bg-white">
        <div className="h-2 w-full bg-linear-to-r from-blue-700 via-indigo-700 to-sky-600" />

        <CardHeader className="p-6 sm:p-8 pb-4 text-center">
          <Image
            src="/logo-kunjungan-pegawai.avif"
            alt="Logo Kunjungan Pegawai"
            width={64}
            height={64}
            className="h-16 w-16 object-contain rounded-2xl mx-auto mb-3 shadow-md"
            priority
          />
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isRegisterMode ? "Buat Akun Admin" : "Login Portal Admin"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            {isRegisterMode
              ? "Daftarkan akun admin pertama untuk mengelola data kunjungan kantor."
              : "Masuk untuk memindai QR code kedatangan tamu dan melihat rekapitulasi data."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Admin</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="admin@instansi.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full text-sm font-semibold rounded-xl mt-2 bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang Memproses...
                </>
              ) : isRegisterMode ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Daftarkan Akun Admin
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Masuk ke Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Toggle between Login and Initial Registration */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-center">
            {!isRegisterMode && (
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@kunjungan.test");
                  setPassword("Admin123456!");
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🔑 Isi Akun Default (admin@kunjungan.test)</span>
              </button>
            )}

            <div>
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {isRegisterMode
                  ? "Sudah memiliki akun? Masuk di sini"
                  : "Belum punya akun admin? Buat akun di sini"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
