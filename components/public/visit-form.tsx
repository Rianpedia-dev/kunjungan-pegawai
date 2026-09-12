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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { submitKunjunganAction } from "@/app/actions/kunjungan";
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

  // Auto-fill division when selecting pegawai
  const handlePegawaiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
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
      if (!customPegawai.trim()) {
        toast.error("Silakan masukkan nama pegawai atau pejabat yang dituju");
        return;
      }
      targetPegawai = customPegawai.trim();
    } else {
      const found = pegawaiList.find((p) => p.id === selectedPegawaiId);
      if (!found) {
        toast.error("Silakan pilih pegawai tujuan dari daftar atau pilih opsi ketik manual");
        return;
      }
      targetPegawai = found.nama;
    }

    if (!namaPengunjung.trim()) {
      toast.error("Nama lengkap pengunjung wajib diisi");
      return;
    }
    if (!noKontak.trim()) {
      toast.error("Nomor WhatsApp / telepon wajib diisi");
      return;
    }
    if (!instansi.trim()) {
      toast.error("Asal instansi / perusahaan / pribadi wajib diisi");
      return;
    }
    if (!keperluan.trim()) {
      toast.error("Keperluan kunjungan wajib dijelaskan");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Membuat tiket kunjungan dan QR Code...", { id: "submit-visit" });

    try {
      const result = await submitKunjunganAction({
        nama_pengunjung: namaPengunjung,
        no_kontak: noKontak,
        instansi: instansi,
        pegawai_tujuan: targetPegawai,
        divisi_tujuan: divisi || null,
        keperluan: keperluan,
        tanggal_kunjungan: tanggal,
        jam_rencana: jamRencana || null,
        jumlah_tamu: Number(jumlahTamu) || 1,
      });

      if (result.success && result.bookingCode) {
        toast.success("Kunjungan berhasil didaftarkan! Mengarahkan ke tiket digital...", {
          id: "submit-visit",
        });
        router.push(`/tiket/${result.bookingCode}`);
      } else {
        toast.error(result.error || "Gagal mendaftarkan kunjungan", { id: "submit-visit" });
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Data Diri Pengunjung */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Identitas Pengunjung
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Contoh: Rian Pratama"
                    value={namaPengunjung}
                    onChange={(e) => setNamaPengunjung(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Nomor WhatsApp / Kontak <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="08123456789"
                    value={noKontak}
                    onChange={(e) => setNoKontak(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Asal Instansi / Lembaga / Pribadi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Contoh: PT Teknologi Indonesia / Pribadi"
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Jumlah Tamu (Rombongan)
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={jumlahTamu}
                    onChange={(e) => setJumlahTamu(Math.max(1, parseInt(e.target.value) || 1))}
                    className="pl-10"
                  />
                </div>
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
                    onClick={() => setUseManualPegawai(!useManualPegawai)}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    {useManualPegawai ? "Pilih dari daftar" : "Ketik manual"}
                  </button>
                </div>

                {!useManualPegawai ? (
                  <select
                    value={selectedPegawaiId}
                    onChange={handlePegawaiChange}
                    required
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  >
                    <option value="" disabled>
                      -- Pilih Pegawai Tujuan --
                    </option>
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
                      placeholder="Masukkan nama pegawai yang dituju"
                      value={customPegawai}
                      onChange={(e) => setCustomPegawai(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
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
                <label className="text-xs font-semibold text-slate-700">
                  Tanggal Kunjungan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
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
              <label className="text-xs font-semibold text-slate-700">
                Keperluan / Agenda Kunjungan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Textarea
                  placeholder="Jelaskan secara ringkas maksud dan tujuan kunjungan Anda..."
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  required
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700 transition-all rounded-xl py-6"
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
