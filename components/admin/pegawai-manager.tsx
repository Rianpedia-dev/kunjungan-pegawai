"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Power, UserSquare2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  getAllPegawaiAdminAction,
  savePegawaiAction,
  togglePegawaiStatusAction,
  deletePegawaiAction,
} from "@/app/actions/pegawai";
import { pegawaiSchema } from "@/lib/validations/kunjungan";
import { cleanErrorMessage, extractZodFieldErrors, cn } from "@/lib/utils";
import type { Pegawai } from "@/types/database";

interface PegawaiManagerProps {
  initialData: Pegawai[];
}

export function PegawaiManager({ initialData }: PegawaiManagerProps) {
  const [data, setData] = React.useState<Pegawai[]>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  // Modal form states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [nama, setNama] = React.useState("");
  const [nip, setNip] = React.useState("");
  const [jabatan, setJabatan] = React.useState("");
  const [divisi, setDivisi] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const loadPegawai = async () => {
    setIsLoading(true);
    try {
      const res = await getAllPegawaiAdminAction();
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(cleanErrorMessage(res.error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNama("");
    setNip("");
    setJabatan("");
    setDivisi("");
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Pegawai) => {
    setEditingId(p.id);
    setNama(p.nama);
    setNip(p.nip || "");
    setJabatan(p.jabatan || "");
    setDivisi(p.divisi);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: editingId || undefined,
      nama: nama.trim(),
      nip: nip.trim() || null,
      jabatan: jabatan.trim() || null,
      divisi: divisi.trim(),
    };

    const validation = pegawaiSchema.safeParse(payload);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      const firstMessage = Object.values(newErrors)[0] || "Mohon lengkapi data pegawai dengan benar";
      toast.error(firstMessage);
      return;
    }

    setErrors({});
    toast.loading("Menyimpan data pegawai...", { id: "save-pegawai" });
    try {
      const res = await savePegawaiAction(payload);

      if (res.success && res.data) {
        toast.success("Pegawai berhasil disimpan!", { id: "save-pegawai" });
        setModalOpen(false);
        loadPegawai();
      } else {
        const cleanedMsg = cleanErrorMessage(res.error || "Gagal menyimpan pegawai");
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
        } else {
          const extracted = extractZodFieldErrors(res.error);
          if (Object.keys(extracted).length > 0) setErrors(extracted);
        }
        toast.error(cleanedMsg, { id: "save-pegawai" });
      }
    } catch (err) {
      toast.error(cleanErrorMessage(err) || "Terjadi kendala server", { id: "save-pegawai" });
    }
  };

  const handleToggleStatus = async (p: Pegawai) => {
    toast.loading("Mengubah status aktif...", { id: "toggle-status" });
    try {
      const res = await togglePegawaiStatusAction(p.id, p.is_active);
      if (res.success) {
        toast.success(`Status ${p.nama} berhasil diubah`, { id: "toggle-status" });
        setData((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, is_active: !item.is_active } : item))
        );
      } else {
        toast.error(res.error || "Gagal mengubah status", { id: "toggle-status" });
      }
    } catch {
      toast.error("Terjadi kendala server", { id: "toggle-status" });
    }
  };

  const handleDelete = async (id: string, namaPegawai: string) => {
    if (!confirm(`Hapus pegawai "${namaPegawai}"?`)) return;

    toast.loading("Menghapus pegawai...", { id: "del-pegawai" });
    try {
      const res = await deletePegawaiAction(id);
      if (res.success) {
        toast.success("Pegawai berhasil dihapus", { id: "del-pegawai" });
        setData((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error(res.error || "Gagal menghapus", { id: "del-pegawai" });
      }
    } catch {
      toast.error("Terjadi kendala server", { id: "del-pegawai" });
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-blue-600" />
            Daftar Master Pegawai Kantor
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Daftar pegawai ini muncul sebagai pilihan otomatis di formulir kunjungan tamu publik.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPegawai}
            disabled={isLoading}
            className="text-xs rounded-xl h-9"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah Pegawai
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nama Pegawai</th>
                <th className="p-3.5">NIP / ID</th>
                <th className="p-3.5">Divisi / Bagian</th>
                <th className="p-3.5">Jabatan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Belum ada data pegawai. Silakan tambah pegawai baru.
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{p.nama}</td>
                    <td className="p-3.5 font-mono text-slate-500">{p.nip || "-"}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {p.divisi}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{p.jabatan || "-"}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={p.is_active ? "success" : "secondary"}
                        className="text-[11px]"
                      >
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => handleToggleStatus(p)}
                          title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <Power className={`h-4 w-4 ${p.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Pegawai"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => handleDelete(p.id, p.nama)}
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pastikan nama dan divisi terisi dengan benar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 my-2 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              Nama Lengkap & Gelar <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Budi Santoso, S.Kom"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                clearError("nama");
              }}
              className={cn(
                errors.nama &&
                  "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
              )}
            />
            {errors.nama && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{errors.nama}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">NIP / Nomor Induk</label>
              <Input
                placeholder="Contoh: 198503152010011002"
                value={nip}
                onChange={(e) => {
                  setNip(e.target.value);
                  clearError("nip");
                }}
                className={cn(
                  errors.nip &&
                    "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                )}
              />
              {errors.nip && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.nip}</span>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                Divisi / Bagian <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Teknologi Informasi"
                value={divisi}
                onChange={(e) => {
                  setDivisi(e.target.value);
                  clearError("divisi");
                }}
                className={cn(
                  errors.divisi &&
                    "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
                )}
              />
              {errors.divisi && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.divisi}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Jabatan</label>
            <Input
              placeholder="Contoh: Kepala Sub Bagian IT"
              value={jabatan}
              onChange={(e) => {
                setJabatan(e.target.value);
                clearError("jabatan");
              }}
              className={cn(
                errors.jabatan &&
                  "border-rose-500 bg-rose-50/20 text-rose-950 focus-visible:border-rose-500 focus-visible:ring-rose-500/25"
              )}
            />
            {errors.jabatan && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{errors.jabatan}</span>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan Data
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </Card>
  );
}
