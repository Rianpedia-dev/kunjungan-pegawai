"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Building2,
  User,
  CheckCircle2,
  Clock3,
  Copy,
  Printer,
  ArrowLeft,
  Share2,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatTanggalIndo, formatWaktuIndo } from "@/lib/utils";
import { getKunjunganByCodeAction } from "@/app/actions/kunjungan";
import type { Kunjungan } from "@/types/database";

interface TicketCardProps {
  initialData: Kunjungan;
}

export function TicketCard({ initialData }: TicketCardProps) {
  const [data, setData] = React.useState<Kunjungan>(initialData);
  const [copied, setCopied] = React.useState(false);

  // Poll for status updates every 4 seconds so when admin scans, the ticket updates live!
  React.useEffect(() => {
    let prevStatus = initialData.status;

    const interval = setInterval(async () => {
      if (data.status === "selesai" || data.status === "batal") return;

      const res = await getKunjunganByCodeAction(data.booking_code);
      if (res.success && res.data) {
        if (prevStatus === "menunggu" && res.data.status === "hadir") {
          // Trigger celebration confetti
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success("Status Diperbarui: Anda telah dikonfirmasi Hadir oleh Resepsionis!");
        }
        prevStatus = res.data.status;
        setData(res.data);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [data.booking_code, data.status, initialData.status]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tautan tiket berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getStatusBadge = (status: Kunjungan["status"]) => {
    switch (status) {
      case "menunggu":
        return (
          <Badge variant="warning" className="px-3 py-1 text-xs gap-1.5 font-medium animate-pulse-subtle">
            <Clock3 className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Kedatangan
          </Badge>
        );
      case "hadir":
        return (
          <Badge variant="success" className="px-3 py-1 text-xs gap-1.5 font-semibold bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Telah Hadir (Check-In)
          </Badge>
        );
      case "selesai":
        return (
          <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 font-medium">
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            Kunjungan Selesai
          </Badge>
        );
      case "batal":
        return (
          <Badge variant="destructive" className="px-3 py-1 text-xs gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Dibatalkan
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Daftar Kunjungan Baru
        </Link>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs h-8 rounded-lg"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Tersalin!" : "Salin Link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 rounded-lg"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Cetak Tiket
          </Button>
        </div>
      </div>

      {/* Main Ticket Card */}
      <Card className="border-slate-200/90 shadow-2xl rounded-3xl overflow-hidden bg-white print:border-none print:shadow-none">
        {/* Ticket Header Gradient */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-sky-600 p-6 text-white text-center relative flex flex-col items-center">
          <Image
            src="/logo-kunjungan-pegawai.avif"
            alt="Logo Kunjungan"
            width={48}
            height={48}
            className="h-12 w-12 object-contain rounded-xl mb-2 bg-white/10 p-1 backdrop-blur-xs shadow-sm"
          />
          <span className="text-[11px] uppercase tracking-widest font-semibold text-blue-200">
            Tiket Digital Kunjungan Tamu
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            BUKU TAMU INSTANSI
          </h2>
          <div className="mt-3 inline-block bg-white/15 backdrop-blur-md rounded-full px-4 py-1 font-mono text-sm tracking-widest font-bold">
            {data.booking_code}
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Status and instruction */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div>{getStatusBadge(data.status)}</div>
            {data.status === "menunggu" && (
              <p className="text-xs text-slate-500 max-w-sm">
                Tunjukkan QR Code di bawah ini kepada petugas resepsionis / satpam saat Anda tiba di lokasi.
              </p>
            )}
            {data.status === "hadir" && data.checkin_at && (
              <p className="text-xs text-emerald-700 font-medium">
                Check-in tercatat pada pukul {formatWaktuIndo(data.checkin_at)}. Selamat berkunjung!
              </p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={data.booking_code}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-2 tracking-wider">
              {data.booking_code}
            </p>
          </div>

          {/* Ticket Details Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3.5 text-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-400 font-medium">Nama Pengunjung</span>
                <p className="font-bold text-slate-900 text-base">{data.nama_pengunjung}</p>
                <p className="text-xs text-slate-500">{data.instansi}</p>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs text-slate-400 font-medium">Jumlah Rombongan</span>
                <p className="font-semibold text-slate-800">{data.jumlah_tamu} Orang</p>
              </div>
            </div>

            <hr className="border-slate-200/60" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Pegawai Dituju:</span>
                <span className="font-semibold text-slate-800 text-sm block mt-0.5">
                  {data.pegawai_tujuan}
                </span>
                {data.divisi_tujuan && (
                  <span className="text-slate-500 block text-[11px]">{data.divisi_tujuan}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Jadwal Kunjungan:</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {formatTanggalIndo(data.tanggal_kunjungan)}
                </span>
                {data.jam_rencana && (
                  <span className="text-slate-500 block text-[11px]">
                    Jam: {data.jam_rencana.slice(0, 5)} WIB
                  </span>
                )}
              </div>
            </div>

            <hr className="border-slate-200/60" />

            <div className="text-xs">
              <span className="text-slate-400 font-medium block">Keperluan:</span>
              <p className="text-slate-700 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                {data.keperluan}
              </p>
            </div>
          </div>

          {/* Tips footer */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-xs text-blue-800 flex items-start gap-2.5">
            <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Simpan screenshot halaman ini atau simpan link ini di WhatsApp Anda untuk memudahkan akses saat tiba di meja resepsionis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
