import Link from "next/link";
import { QrCode, Users, Plus, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCards } from "@/components/admin/stats-cards";
import { getDashboardStatsAction, getAllKunjunganAction } from "@/app/actions/kunjungan";
import { formatTanggalIndo, formatWaktuIndo } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStatsAction();
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayVisitors } = await getAllKunjunganAction({ tanggal: today });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-linear-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
            {formatTanggalIndo(today)}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard Manajemen Kunjungan
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Pantau arus kedatangan tamu, verifikasi check-in via QR Code, dan kelola arsip kunjungan kantor secara efisien.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            asChild
            size="lg"
            className="rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md"
          >
            <Link href="/admin/scan">
              <QrCode className="mr-2 h-5 w-5 text-blue-700" />
              Scan QR Tamu
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <StatsCards stats={stats} />

      {/* Today's Visitors Quick Section */}
      <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Antrean & Kunjungan Hari Ini
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daftar tamu yang dijadwalkan hadir pada hari ini.
            </CardDescription>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Link href="/admin/pengunjung">
              Lihat Semua Data
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Kode Booking</th>
                  <th className="p-3.5">Nama Tamu</th>
                  <th className="p-3.5">Instansi</th>
                  <th className="p-3.5">Pegawai Tujuan</th>
                  <th className="p-3.5">Perkiraan Jam</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Waktu Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada pengunjung yang terdaftar untuk hari ini.
                    </td>
                  </tr>
                ) : (
                  todayVisitors.slice(0, 8).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {item.booking_code}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {item.nama_pengunjung}
                      </td>
                      <td className="p-3.5">{item.instansi}</td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {item.pegawai_tujuan}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {item.jam_rencana ? `${item.jam_rencana.slice(0, 5)} WIB` : "-"}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            item.status === "hadir"
                              ? "success"
                              : item.status === "selesai"
                              ? "secondary"
                              : item.status === "batal"
                              ? "destructive"
                              : "warning"
                          }
                          className="capitalize text-[11px]"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {item.checkin_at ? formatWaktuIndo(item.checkin_at) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
