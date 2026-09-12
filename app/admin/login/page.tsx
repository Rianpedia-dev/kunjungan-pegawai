"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Lock, Mail, ArrowLeft, Loader2, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signInAdminAction } from "@/app/actions/auth";
import { getDemoAccountsSettingAction } from "@/app/actions/admin-users";
import { adminAuthSchema } from "@/lib/validations/kunjungan";
import { cleanErrorMessage, cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [demoEnabled, setDemoEnabled] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    getDemoAccountsSettingAction().then((res) => {
      if (res && typeof res.enabled === "boolean") {
        setDemoEnabled(res.enabled);
      }
    });
  }, []);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = adminAuthSchema.safeParse({ email, password });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      const firstMsg = Object.values(newErrors)[0] || "Mohon isi formulir dengan benar";
      toast.error(firstMsg);
      return;
    }

    setErrors({});
    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", email.trim().toLowerCase());
    formData.append("password", password);

    try {
      toast.loading("Memverifikasi kredensial...", { id: "auth" });
      const res = await signInAdminAction(formData);
      if (res.success) {
        toast.success("Login berhasil! Mengalihkan ke dashboard...", { id: "auth" });
        router.push("/admin");
        router.refresh();
      } else {
        toast.error(cleanErrorMessage(res.error || "Login gagal, periksa email & kata sandi"), {
          id: "auth",
        });
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
            Login Portal Admin
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Masuk untuk memindai QR code kedatangan tamu dan melihat rekapitulasi data kunjungan.
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  className={cn(
                    "pl-10",
                    errors.email &&
                      "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  className={cn(
                    "pl-10 pr-10",
                    errors.password &&
                      "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full text-sm font-semibold rounded-xl mt-2 bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi Kredensial...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Masuk ke Dashboard
                </>
              )}
            </Button>
          </form>

          {/* Demo Accounts Section (Hanya tampil jika diaktifkan di dashboard admin) */}
          {demoEnabled && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Pilihan Akun Demo:
                </span>
                <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@kunjungan.test");
                    setPassword("Admin123456!");
                    setErrors({});
                    toast.info("Akun Admin 1 dipilih");
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5",
                    email === "admin@kunjungan.test"
                      ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Akun Admin 1</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate">admin@kunjungan.test</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin2@kunjungan.test");
                    setPassword("Admin123456!");
                    setErrors({});
                    toast.info("Akun Admin 2 dipilih");
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5",
                    email === "admin2@kunjungan.test"
                      ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Akun Admin 2</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate">admin2@kunjungan.test</span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
