import { QrScanner } from "@/components/admin/qr-scanner";

export const metadata = {
  title: "Scan QR Kunjungan | Admin",
};

export default function AdminScanPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Scan QR Code Kedatangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Arahkan kamera ke tiket QR pengunjung untuk memverifikasi keabsahan dan mencatat check-in otomatis.
        </p>
      </div>

      <QrScanner />
    </div>
  );
}
