"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Building2,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Users,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { submitKunjunganAction } from "@/app/actions/kunjungan";
import { kunjunganSchema } from "@/lib/validations/kunjungan";
import { cleanErrorMessage, extractZodFieldErrors, cn } from "@/lib/utils";
import type { Pegawai } from "@/types/database";

interface VisitFormProps {
  pegawaiList: Pegawai[];
}

export function VisitForm({ pegawaiList }: VisitFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [useManualPegawai, setUseManualPegawai] = React.useState(false);

  // Form states
  const [namaPengunjung, setNamaPengunjung] = React.useState("");
  const [noKontak, setNoKontak] = React.useState("");
  const [instansi, setInstansi] = React.useState("");
  const [selectedPegawaiId, setSelectedPegawaiId] = React.useState("");
  const [customPegawai, setCustomPegawai] = React.useState("");
  const [divisi, setDivisi] = React.useState("");
  const [keperluan, setKeperluan] = React.useState("");
  const [tanggal, setTanggal] = React.useState(new Date().toISOString().slice(0, 10));
  const [jamRencana, setJamRencana] = React.useState("09:00");
  const [jumlahTamu, setJumlahTamu] = React.useState(1);

  // Validation error state per field
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Auto-fill division when selecting pegawai
  const handlePegawaiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    clearError("pegawai_tujuan");
    if (val === "__custom__") {
      setUseManualPegawai(true);
      setSelectedPegawaiId("");
      setDivisi("");
      return;
    }
    setUseManualPegawai(false);
    setSelectedPegawaiId(val);
    const found = pegawaiList.find((p) => p.id === val);
    if (found) {
      setDivisi(found.divisi);
    } else {
      setDivisi("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetPegawai = "";
    if (useManualPegawai) {
      targetPegawai = customPegawai.trim();
    } else {
      const found = pegawaiList.find((p) => p.id === selectedPegawaiId);
      targetPegawai = found ? found.nama : "";
    }

    const payload = {
      nama_pengunjung: namaPengunjung.trim(),
      no_kontak: noKontak.trim(),
      instansi: instansi.trim(),
      pegawai_tujuan: targetPegawai,
      divisi_tujuan: divisi.trim() || null,
      keperluan: keperluan.trim(),
      tanggal_kunjungan: tanggal,
      jam_rencana: jamRencana || null,
      jumlah_tamu: Number(jumlahTamu) || 1,
    };

    // Client-side schema validation
    const validation = kunjunganSchema.safeParse(payload);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);

      const firstField = Object.keys(newErrors)[0];
      const errorCount = Object.keys(newErrors).length;
      const firstErrorMessage = newErrors[firstField];

      toast.error(firstErrorMessage || "Formulir belum lengkap", {
        description: `Terdapat ${errorCount} kolom yang perlu diperbaiki. Periksa bagian yang ditandai merah.`,
      });

      // Smooth scroll to the first field that has an error
      const fieldIdMap: Record<string, string> = {
        nama_pengunjung: "field-nama",
        no_kontak: "field-kontak",
        instansi: "field-instansi",
        pegawai_tujuan: useManualPegawai ? "field-custom-pegawai" : "field-select-pegawai",
        keperluan: "field-keperluan",
        tanggal_kunjungan: "field-tanggal",
        jumlah_tamu: "field-jumlah-tamu",
      };
      const elementId = fieldIdMap[firstField];
      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus?.();
        }
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    toast.loading("Membuat tiket kunjungan dan QR Code...", { id: "submit-visit" });

    try {
      const result = await submitKunjunganAction(payload);

      if (result.success && result.bookingCode) {
        toast.success("Kunjungan berhasil didaftarkan! Mengarahkan ke tiket digital...", {
          id: "submit-visit",
        });
        router.push(`/tiket/${result.bookingCode}`);
      } else {
        const cleanedMsg = cleanErrorMessage(result.error || "Gagal mendaftarkan kunjungan");
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        } else {
          const extracted = extractZodFieldErrors(result.error);
          if (Object.keys(extracted).length > 0) {
            setErrors(extracted);
          }
        }
        toast.error(cleanedMsg, {
          id: "submit-visit",
          description: "Silakan periksa kembali data yang ditandai.",
        });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala saat menghubungkan ke server", { id: "submit-visit" });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200/80 bg-white/95 backdrop-blur shadow-xl rounded-3xl overflow-hidden transition-all">
      <div className="h-2 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500" />
      <CardHeader className="p-6 sm:p-8 pb-4">
        <div className="flex items-center space-x-2.5 text-blue-600 font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Formulir Pra-Registrasi Tamu</span>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Buku Tamu Digital
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm sm:text-base">
          Silakan lengkapi data kunjungan Anda. Sistem akan menghasilkan tiket QR Code untuk verifikasi di meja resepsionis / satpam.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 pt-2">
        {/* Error Alert Banner if multiple validation errors exist */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in-50 slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 text-sm">
                Mohon lengkapi bagian yang belum sesuai ({Object.keys(errors).length} kolom perlu diperbaiki):
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700 font-medium">
                {Object.values(errors).slice(0, 3).map((errMsg, idx) => (
                  <li key={idx}>{errMsg}</li>
                ))}
                {Object.keys(errors).length > 3 && (
                  <li>Dan {Object.keys(errors).length - 3} kolom lainnya...</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Data Diri Pengunjung */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Identitas Pengunjung
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Nama Lengkap <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="field-nama"
                    placeholder="Contoh: Rian Pratama"
                    value={namaPengunjung}
                    onChange={(e) => {
                      setNamaPengunjung(e.target.value);
                      clearError("nama_pengunjung");
                    }}
                    className={cn(
                      "pl-10",
                      errors.nama_pengunjung &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  />
                </div>
                {errors.nama_pengunjung && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.nama_pengunjung}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Nomor WhatsApp / Kontak <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="field-kontak"
                    type="tel"
                    placeholder="08123456789"
                    value={noKontak}
                    onChange={(e) => {
                      setNoKontak(e.target.value);
                      clearError("no_kontak");
                    }}
                    className={cn(
                      "pl-10",
                      errors.no_kontak &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  />
                </div>
                {errors.no_kontak && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.no_kontak}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Asal Instansi / Lembaga / Pribadi <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="field-instansi"
                    placeholder="Contoh: PT Teknologi Indonesia / Pribadi"
                    value={instansi}
                    onChange={(e) => {
                      setInstansi(e.target.value);
                      clearError("instansi");
                    }}
                    className={cn(
                      "pl-10",
                      errors.instansi &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  />
                </div>
                {errors.instansi && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.instansi}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Jumlah Tamu</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="field-jumlah-tamu"
                    type="number"
                    min={1}
                    max={50}
                    value={jumlahTamu}
                    onChange={(e) => {
                      setJumlahTamu(Math.max(1, parseInt(e.target.value) || 1));
                      clearError("jumlah_tamu");
                    }}
                    className={cn(
                      "pl-10",
                      errors.jumlah_tamu &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  />
                </div>
                {errors.jumlah_tamu && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.jumlah_tamu}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Tujuan Kunjungan */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              2. Tujuan & Keperluan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Pegawai yang Dituju <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualPegawai(!useManualPegawai);
                      clearError("pegawai_tujuan");
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    {useManualPegawai ? "Pilih dari daftar" : "Ketik manual"}
                  </button>
                </div>

                {!useManualPegawai ? (
                  <select
                    id="field-select-pegawai"
                    value={selectedPegawaiId}
                    onChange={handlePegawaiChange}
                    className={cn(
                      "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
                      errors.pegawai_tujuan &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  >
                    <option value="">-- Pilih Pegawai Tujuan --</option>
                    {pegawaiList.map((pegawai) => (
                      <option key={pegawai.id} value={pegawai.id}>
                        {pegawai.nama} - {pegawai.divisi}
                      </option>
                    ))}
                    <option value="__custom__">+ Pegawai tidak ada di daftar (Ketik Manual)</option>
                  </select>
                ) : (
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="field-custom-pegawai"
                      placeholder="Masukkan nama pegawai yang dituju"
                      value={customPegawai}
                      onChange={(e) => {
                        setCustomPegawai(e.target.value);
                        clearError("pegawai_tujuan");
                      }}
                      className={cn(
                        "pl-10",
                        errors.pegawai_tujuan &&
                          "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                      )}
                    />
                  </div>
                )}
                {errors.pegawai_tujuan && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.pegawai_tujuan}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Divisi / Unit Kerja
                </label>
                <Input
                  placeholder="Contoh: IT, SDM, Keuangan, Humas"
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Tanggal Kunjungan <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="field-tanggal"
                    type="date"
                    value={tanggal}
                    onChange={(e) => {
                      setTanggal(e.target.value);
                      clearError("tanggal_kunjungan");
                    }}
                    className={cn(
                      "pl-10",
                      errors.tanggal_kunjungan &&
                        "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                    )}
                  />
                </div>
                {errors.tanggal_kunjungan && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.tanggal_kunjungan}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Perkiraan Jam Kedatangan
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    value={jamRencana}
                    onChange={(e) => setJamRencana(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  Keperluan / Agenda Kunjungan <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {keperluan.length}/500 karakter
                </span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Textarea
                  id="field-keperluan"
                  placeholder="Jelaskan secara ringkas maksud dan tujuan kunjungan Anda (minimal 5 karakter)..."
                  value={keperluan}
                  onChange={(e) => {
                    setKeperluan(e.target.value);
                    clearError("keperluan");
                  }}
                  className={cn(
                    "pl-10",
                    errors.keperluan &&
                      "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                  )}
                  rows={3}
                />
              </div>
              {errors.keperluan && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in-50 slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.keperluan}</span>
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-6 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sedang Memproses Tiket...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Daftarkan Kunjungan & Dapatkan QR Code
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
