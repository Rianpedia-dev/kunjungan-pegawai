"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Eye,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  getAllKunjunganAction,
  updateKunjunganStatusAction,
  deleteKunjunganAction,
} from "@/app/actions/kunjungan";
import { formatTanggalIndo, formatWaktuIndo } from "@/lib/utils";
import type { Kunjungan, StatusKunjungan } from "@/types/database";

interface VisitorTableProps {
  initialData: Kunjungan[];
}

export function VisitorTable({ initialData }: VisitorTableProps) {
  const [data, setData] = React.useState<Kunjungan[]>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");
  const [customDate, setCustomDate] = React.useState<string>("");

  // Detail Modal
  const [selectedVisitor, setSelectedVisitor] = React.useState<Kunjungan | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const loadData = async () => {
    setIsLoading(true);
    let filterDate: string | undefined = undefined;

    if (dateFilter === "today") {
      filterDate = new Date().toISOString().slice(0, 10);
    } else if (dateFilter === "custom" && customDate) {
      filterDate = customDate;
    }

    try {
      const res = await getAllKunjunganAction({
        tanggal: filterDate,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setData(res.data);
      } else {
        toast.error("Gagal memuat data: " + res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter, customDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdateStatus = async (bookingCode: string, newStatus: StatusKunjungan) => {
    toast.loading("Memperbarui status...", { id: "update-status" });
    try {
      const res = await updateKunjunganStatusAction(bookingCode, newStatus);
      if (res.success && res.data) {
        toast.success(`Status berhasil diubah ke: ${newStatus}`, { id: "update-status" });
        setData((prev) =>
          prev.map((item) => (item.booking_code === bookingCode ? res.data! : item))
        );
        if (selectedVisitor?.booking_code === bookingCode) {
          setSelectedVisitor(res.data);
        }
      } else {
        toast.error(res.error || "Gagal mengubah status", { id: "update-status" });
      }
    } catch {
      toast.error("Terjadi kendala server", { id: "update-status" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data kunjungan ini?")) return;

    toast.loading("Menghapus data...", { id: "delete-item" });
    try {
      const res = await deleteKunjunganAction(id);
      if (res.success) {
        toast.success("Data kunjungan berhasil dihapus", { id: "delete-item" });
        setData((prev) => prev.filter((item) => item.id !== id));
        setDetailOpen(false);
      } else {
        toast.error(res.error || "Gagal menghapus", { id: "delete-item" });
      }
    } catch {
      toast.error("Terjadi kendala server", { id: "delete-item" });
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast.info("Tidak ada data untuk diekspor");
      return;
    }

    const excelRows = data.map((item, idx) => ({
      No: idx + 1,
      "Kode Booking": item.booking_code,
      "Nama Pengunjung": item.nama_pengunjung,
      "No Kontak": item.no_kontak,
      Instansi: item.instansi,
      "Pegawai Tujuan": item.pegawai_tujuan,
      "Divisi Tujuan": item.divisi_tujuan || "-",
      "Tanggal Kunjungan": item.tanggal_kunjungan,
      "Jam Rencana": item.jam_rencana || "-",
      "Jumlah Tamu": item.jumlah_tamu,
      Keperluan: item.keperluan,
      Status: item.status.toUpperCase(),
      "Waktu Check-In": item.checkin_at ? formatWaktuIndo(item.checkin_at) : "-",
      "Waktu Check-Out": item.checkout_at ? formatWaktuIndo(item.checkout_at) : "-",
      "Didaftarkan Pada": formatTanggalIndo(item.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kunjungan");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `rekap-kunjungan-${dateStr}.xlsx`);
    toast.success("File Excel berhasil diunduh!");
  };

  const getStatusBadge = (status: StatusKunjungan) => {
    switch (status) {
      case "menunggu":
        return (
          <Badge variant="warning" className="text-[11px] font-medium">
            Menunggu
          </Badge>
        );
      case "hadir":
        return (
          <Badge variant="success" className="text-[11px] font-medium bg-emerald-100 text-emerald-800 border-emerald-300">
            Hadir
          </Badge>
        );
      case "selesai":
        return (
          <Badge variant="secondary" className="text-[11px] font-medium">
            Selesai
          </Badge>
        );
      case "batal":
        return (
          <Badge variant="destructive" className="text-[11px] font-medium">
            Batal
          </Badge>
        );
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900">
            Rekap Data Kunjungan Tamu
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Total {data.length} data kunjungan tercatat dalam sistem.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs rounded-xl h-9"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={exportToExcel}
            className="text-xs rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Ekspor Excel
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, instansi, pegawai, atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </form>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="hadir">Hadir</option>
              <option value="selesai">Selesai</option>
              <option value="batal">Batal</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="custom">Pilih Tanggal</option>
            </select>

            {dateFilter === "custom" && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 w-36 text-xs rounded-xl"
              />
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Kode & Tanggal</th>
                <th className="p-3.5">Nama Pengunjung</th>
                <th className="p-3.5">Instansi</th>
                <th className="p-3.5">Pegawai Dituju</th>
                <th className="p-3.5">Keperluan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada data kunjungan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-900 block">
                        {item.booking_code}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.tanggal_kunjungan} {item.jam_rencana ? `• ${item.jam_rencana.slice(0, 5)}` : ""}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900 block">
                        {item.nama_pengunjung}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.no_kontak}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-800">{item.instansi}</span>
                      {item.jumlah_tamu > 1 && (
                        <span className="text-[10px] text-slate-400 block">
                          ({item.jumlah_tamu} orang)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 block">
                        {item.pegawai_tujuan}
                      </span>
                      {item.divisi_tujuan && (
                        <span className="text-[11px] text-slate-400">{item.divisi_tujuan}</span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs truncate" title={item.keperluan}>
                      {item.keperluan}
                    </td>
                    <td className="p-3.5">{getStatusBadge(item.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedVisitor(item);
                            setDetailOpen(true);
                          }}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {item.status === "menunggu" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-[11px] rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleUpdateStatus(item.booking_code, "hadir")}
                          >
                            Hadir
                          </Button>
                        )}

                        {item.status === "hadir" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-[11px] rounded-lg text-slate-600 hover:bg-slate-100"
                            onClick={() => handleUpdateStatus(item.booking_code, "selesai")}
                          >
                            Selesai
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Visitor Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedVisitor && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Detail Informasi Tamu</DialogTitle>
                  <DialogDescription className="font-mono text-xs text-blue-600">
                    {selectedVisitor.booking_code}
                  </DialogDescription>
                </div>
                <div>{getStatusBadge(selectedVisitor.status)}</div>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Nama Tamu</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedVisitor.nama_pengunjung}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nomor WhatsApp / HP</span>
                  <span className="font-medium text-slate-800">{selectedVisitor.no_kontak}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Asal Instansi</span>
                  <span className="font-medium text-slate-800">{selectedVisitor.instansi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jumlah Tamu</span>
                  <span className="font-medium text-slate-800">
                    {selectedVisitor.jumlah_tamu} Orang
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Pegawai yang Dituju</span>
                  <span className="font-bold text-slate-900">{selectedVisitor.pegawai_tujuan}</span>
                  {selectedVisitor.divisi_tujuan && (
                    <span className="text-slate-500 block text-[11px]">
                      Divisi: {selectedVisitor.divisi_tujuan}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Jadwal Tanggal & Waktu</span>
                  <span className="font-medium text-slate-800">
                    {formatTanggalIndo(selectedVisitor.tanggal_kunjungan)}
                  </span>
                  {selectedVisitor.jam_rencana && (
                    <span className="text-slate-500 block text-[11px]">
                      Jam: {selectedVisitor.jam_rencana.slice(0, 5)} WIB
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block">Keperluan / Agenda:</span>
                <p className="text-slate-800 leading-relaxed">{selectedVisitor.keperluan}</p>
              </div>

              {(selectedVisitor.checkin_at || selectedVisitor.checkout_at) && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[11px]">
                  <div>
                    <span className="text-blue-600 font-medium block">Waktu Check-In:</span>
                    <span>{formatWaktuIndo(selectedVisitor.checkin_at)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium block">Waktu Check-Out:</span>
                    <span>{formatWaktuIndo(selectedVisitor.checkout_at)}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="destructive"
                size="sm"
                className="text-xs rounded-xl"
                onClick={() => handleDelete(selectedVisitor.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus Data
              </Button>

              <div className="flex items-center space-x-2">
                {selectedVisitor.status === "menunggu" && (
                  <Button
                    size="sm"
                    className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleUpdateStatus(selectedVisitor.booking_code, "hadir")}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Konfirmasi Hadir
                  </Button>
                )}
                {selectedVisitor.status === "hadir" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl"
                    onClick={() => handleUpdateStatus(selectedVisitor.booking_code, "selesai")}
                  >
                    <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                    Tandai Selesai
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs rounded-xl"
                  onClick={() => setDetailOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </Card>
  );
}
