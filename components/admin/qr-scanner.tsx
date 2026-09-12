"use client";

import * as React from "react";
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building2,
  RefreshCw,
  Search,
  Check,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  verifyAndCheckInAction,
  updateKunjunganStatusAction,
  getKunjunganByCodeAction,
} from "@/app/actions/kunjungan";
import { formatTanggalIndo, formatWaktuIndo, cleanErrorMessage } from "@/lib/utils";
import type { Kunjungan } from "@/types/database";

export function QrScanner() {
  const [scannerActive, setScannerActive] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<{
    success: boolean;
    type: string;
    message: string;
    data?: Kunjungan;
  } | null>(null);

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const isHandlingScan = React.useRef<boolean>(false);

  // Web Audio API beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880; // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  const processCode = async (code: string) => {
    if (isHandlingScan.current) return;
    isHandlingScan.current = true;
    setIsProcessing(true);
    playBeep();

    try {
      const res = await verifyAndCheckInAction(code);

      if (res.success && res.data) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      setScanResult(res);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(cleanErrorMessage(err) || "Gagal memproses kode");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanSuccess = processCode;

  const isOperatingRef = React.useRef(false);

  const isScannerRunning = () => {
    try {
      const scanner = scannerRef.current;
      if (!scanner) return false;
      return (
        Boolean(scanner.isScanning) ||
        scanner.getState?.() === Html5QrcodeScannerState.SCANNING ||
        scanner.getState?.() === Html5QrcodeScannerState.PAUSED
      );
    } catch {
      return false;
    }
  };

  const startScanner = async () => {
    if (isOperatingRef.current) return;
    isOperatingRef.current = true;
    setCameraError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      if (!isScannerRunning()) {
        const config: Html5QrcodeCameraScanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (!isHandlingScan.current) {
              handleScanSuccess(decodedText);
            }
          },
          () => {
            // ignore scan frame errors
          }
        );
      }

      setScannerActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan izin akses kamera diaktifkan di peramban Anda."
      );
      setScannerActive(false);
    } finally {
      isOperatingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (isOperatingRef.current) return;
    isOperatingRef.current = true;

    try {
      if (scannerRef.current && isScannerRunning()) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.warn("Abaikan pesan stop scanner:", err);
        }
      }
    } catch (err) {
      console.warn("Stop scanner error:", err);
    } finally {
      setScannerActive(false);
      isOperatingRef.current = false;
    }
  };

  // Hanya bersihkan ketika komponen unmount (keluar dari halaman)
  React.useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const isScanning =
            Boolean(scanner.isScanning) ||
            scanner.getState?.() === Html5QrcodeScannerState.SCANNING ||
            scanner.getState?.() === Html5QrcodeScannerState.PAUSED;

          if (isScanning) {
            scanner.stop().catch((e) => console.warn("Abaikan unmount stop error:", e));
          }
        } catch (e) {
          console.warn("Abaikan unmount stop synchronous error:", e);
        }
      }
    };
  }, []);

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      isHandlingScan.current = false;
      setScanResult(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Masukkan kode booking kunjungan");
      return;
    }
    processCode(manualCode.trim());
  };

  const handleCheckOut = async () => {
    if (!scanResult?.data?.booking_code) return;
    setIsProcessing(true);
    try {
      const res = await updateKunjunganStatusAction(scanResult.data.booking_code, "selesai");
      if (res.success && res.data) {
        toast.success("Kunjungan berhasil ditandai selesai (Check-out)!");
        setScanResult({
          success: true,
          type: "SUCCESS_CHECKOUT",
          message: "Check-out berhasil dicatat pada pukul " + new Date().toLocaleTimeString("id-ID") + " WIB",
          data: res.data,
        });
      } else {
        toast.error(cleanErrorMessage(res.error) || "Gagal memperbarui status");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Panel */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-5 sm:p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Pemindai Kamera QR Code
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Arahkan kamera ke QR Code pada tiket pengunjung untuk memverifikasi check-in.
              </CardDescription>
            </div>
            {scannerActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopScanner}
                className="text-xs rounded-xl"
              >
                Hentikan Kamera
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={startScanner}
                className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                Nyalakan Kamera
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6 flex flex-col items-center justify-center">
            {/* Camera View Box */}
            <div className="w-full max-w-md rounded-2xl overflow-hidden bg-slate-900 aspect-square relative flex items-center justify-center border-2 border-dashed border-slate-700">
              <div id="qr-reader" className="w-full h-full" />

              {!scannerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/80">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm">Kamera Sedang Nonaktif</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Klik tombol di bawah untuk mengaktifkan pemindaian kamera web / ponsel Anda.
                  </p>
                  <Button
                    onClick={startScanner}
                    size="sm"
                    className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Aktifkan Kamera Sekarang
                  </Button>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold z-20">
                  <div className="flex items-center space-x-2 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                    <span>Memverifikasi Kode...</span>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 max-w-md w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Fallback & Info Box */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                Input Manual Kode Tiket
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Gunakan jika kamera bermasalah atau QR tidak terbaca.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <Input
                  placeholder="Contoh: VIS-20260912-XXXX"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase text-sm"
                />
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full text-xs rounded-xl bg-slate-800 hover:bg-slate-900"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Verifikasi Kode Ini
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl bg-slate-50/70 p-5 space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Petunjuk Verifikasi
            </h4>
            <ul className="space-y-2 text-[11px] list-disc pl-4 text-slate-500 leading-relaxed">
              <li>Pastikan pencahayaan cukup dan QR Code tamu tampak jelas di layar kamera.</li>
              <li>QR code yang valid akan langsung mengubah status tamu menjadi <b>Hadir</b>.</li>
              <li>Jika tamu akan meninggalkan lokasi, scan ulang untuk tombol <b>Check-out</b>.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Verification Result Dialog */}
      <Dialog open={modalOpen} onOpenChange={handleModalClose}>
        <DialogHeader>
          <div className="flex items-center space-x-2.5">
            {scanResult?.success ? (
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : scanResult?.type === "ALREADY_CHECKED_IN" ? (
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg">
                {scanResult?.success
                  ? "Check-In Berhasil!"
                  : scanResult?.type === "ALREADY_CHECKED_IN"
                  ? "Pengunjung Sudah Hadir"
                  : "Verifikasi Gagal"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {scanResult?.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {scanResult?.data && (
          <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {scanResult.data.booking_code}
              </span>
              <Badge
                variant={
                  scanResult.data.status === "hadir"
                    ? "success"
                    : scanResult.data.status === "selesai"
                    ? "secondary"
                    : "warning"
                }
                className="capitalize"
              >
                {scanResult.data.status}
              </Badge>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900">
                    {scanResult.data.nama_pengunjung}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    {scanResult.data.instansi} ({scanResult.data.no_kontak})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[11px] block">Pegawai Tujuan:</span>
                  <span className="font-semibold text-slate-800">
                    {scanResult.data.pegawai_tujuan}{" "}
                    {scanResult.data.divisi_tujuan && `(${scanResult.data.divisi_tujuan})`}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-500 block">Keperluan:</span>
                {scanResult.data.keperluan}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {scanResult?.type === "ALREADY_CHECKED_IN" && (
            <Button
              onClick={handleCheckOut}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Check-Out (Tamu Selesai)
            </Button>
          )}

          <Button
            onClick={() => handleModalClose(false)}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            Selesai / Scan Tamu Berikutnya
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
