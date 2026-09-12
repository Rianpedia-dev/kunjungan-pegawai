"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  Mail,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  getAllAdminUsersAction,
  saveAdminUserAction,
  deleteAdminUserAction,
  toggleDemoAccountsSettingAction,
} from "@/app/actions/admin-users";
import { formatTanggalIndo, formatWaktuIndo, cleanErrorMessage, cn } from "@/lib/utils";
import type { AdminUser } from "@/types/database";

interface AdminUserManagerProps {
  initialUsers: AdminUser[];
  initialDemoSetting: boolean;
  currentUserId?: string;
}

export function AdminUserManager({
  initialUsers,
  initialDemoSetting,
  currentUserId,
}: AdminUserManagerProps) {
  const [users, setUsers] = React.useState<AdminUser[]>(initialUsers);
  const [demoEnabled, setDemoEnabled] = React.useState<boolean>(initialDemoSetting);
  const [isTogglingDemo, setIsTogglingDemo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Modal form states
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [nama, setNama] = React.useState("");
  const [role, setRole] = React.useState("Administrator");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getAllAdminUsersAction();
      if (res.success) {
        setUsers(res.data);
      } else {
        toast.error(cleanErrorMessage(res.error || "Gagal memuat daftar admin"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemo = async () => {
    const nextState = !demoEnabled;
    setIsTogglingDemo(true);
    try {
      const res = await toggleDemoAccountsSettingAction(nextState);
      if (res.success) {
        setDemoEnabled(nextState);
        toast.success(
          nextState
            ? "Tombol Akun Demo di halaman login diaktifkan!"
            : "Tombol Akun Demo di halaman login dinonaktifkan (disembunyikan)!"
        );
      } else {
        toast.error(cleanErrorMessage(res.error || "Gagal mengubah pengaturan"));
      }
    } catch (err) {
      toast.error(cleanErrorMessage(err) || "Terjadi kendala jaringan");
    } finally {
      setIsTogglingDemo(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setEmail("");
    setNama("");
    setRole("Administrator");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEmail(user.email);
    setNama(user.nama || "");
    setRole(user.role || "Administrator");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Masukkan alamat email yang valid";
    }

    if (!editingId && (!password || password.trim().length < 6)) {
      newErrors.password = "Kata sandi wajib diisi minimal 6 karakter";
    } else if (editingId && password && password.trim().length < 6) {
      newErrors.password = "Kata sandi baru minimal 6 karakter";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setErrors({});
    toast.loading(editingId ? "Memperbarui akun admin..." : "Membuat akun admin baru...", {
      id: "save-admin",
    });

    try {
      const res = await saveAdminUserAction({
        id: editingId || undefined,
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        nama: nama.trim() || undefined,
        role: role.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Akun admin berhasil disimpan!", { id: "save-admin" });
        setModalOpen(false);
        loadUsers();
      } else {
        toast.error(cleanErrorMessage(res.error || "Gagal menyimpan akun admin"), {
          id: "save-admin",
        });
      }
    } catch (err) {
      toast.error(cleanErrorMessage(err) || "Terjadi kendala server", { id: "save-admin" });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (currentUserId && currentUserId === user.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.");
      return;
    }

    if (!confirm(`Hapus akun admin "${user.email}" (${user.nama})?`)) return;

    toast.loading("Menghapus akun admin...", { id: "delete-admin" });
    try {
      const res = await deleteAdminUserAction(user.id);
      if (res.success) {
        toast.success("Akun admin berhasil dihapus", { id: "delete-admin" });
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        toast.error(cleanErrorMessage(res.error || "Gagal menghapus akun admin"), {
          id: "delete-admin",
        });
      }
    } catch (err) {
      toast.error(cleanErrorMessage(err) || "Terjadi kendala server", { id: "delete-admin" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pengaturan Akun Demo Card */}
      <Card className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-linear-to-r from-slate-50 to-blue-50/30">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Visibilitas Akun Demo di Halaman Login
                </h3>
                <Badge
                  variant={demoEnabled ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-2 py-0.5",
                    demoEnabled
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {demoEnabled ? "● Aktif (Tampil)" : "○ Nonaktif (Disembunyikan)"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Bila dinonaktifkan, tombol pintas <em>Akun Demo 1</em> dan <em>Akun Demo 2</em> pada
                halaman login admin publik (<code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded">/admin/login</code>)
                akan disembunyikan sepenuhnya.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              disabled={isTogglingDemo}
              onClick={handleToggleDemo}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer border",
                demoEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              )}
            >
              {demoEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  <span>Akun Demo Aktif</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  <span>Akun Demo Nonaktif</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Daftar Akun Administrator
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Pengguna yang terdaftar memiliki hak akses penuh ke dashboard admin, verifikasi QR code tamu, dan rekapitulasi data.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={isLoading}
              className="rounded-xl text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
              Segarkan
            </Button>

            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Admin Baru
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Akun & Email</th>
                  <th className="py-3.5 px-4">Nama / Label</th>
                  <th className="py-3.5 px-4">Role Akses</th>
                  <th className="py-3.5 px-4">Terakhir Masuk</th>
                  <th className="py-3.5 px-4">Tanggal Dibuat</th>
                  <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada akun admin yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isCurrent = currentUserId === u.id;
                    const isDemo1 = u.email === "admin@kunjungan.test";
                    const isDemo2 = u.email === "admin2@kunjungan.test";

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{u.email}</span>
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-medium">
                                    Akun Anda
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                {isDemo1 && <span className="text-amber-600 font-medium">Akun Demo 1</span>}
                                {isDemo2 && <span className="text-amber-600 font-medium">Akun Demo 2</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {u.nama || "Administrator"}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[11px]">
                            {u.role || "Admin"}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {u.last_sign_in_at ? formatWaktuIndo(u.last_sign_in_at) : "Belum pernah"}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {formatTanggalIndo(u.created_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              onClick={() => handleOpenEdit(u)}
                              title="Edit Akun Admin"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={isCurrent}
                              onClick={() => handleDelete(u)}
                              title={isCurrent ? "Tidak dapat menghapus akun sendiri" : "Hapus Akun Admin"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah / Edit Admin */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>{editingId ? "Edit Akun Administrator" : "Tambah Akun Administrator Baru"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {editingId
              ? "Perbarui identitas admin atau masukkan kata sandi baru jika ingin mengubah kata sandi."
              : "Masukkan email dan kata sandi untuk akun administrator baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 my-2 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">
              Email Administrator <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="nama@instansi.go.id"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Nama Lengkap / Label</label>
              <Input
                placeholder="Contoh: Rian Pratama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Role / Bagian</label>
              <Input
                placeholder="Contoh: Admin Resepsionis"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Kata Sandi {editingId ? "(Opsional)" : <span className="text-red-500">*</span>}
              </label>
              {editingId && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Kosongkan bila tidak diubah
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editingId ? "•••••••• (Biarkan kosong jika tetap)" : "Minimal 6 karakter"}
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>{errors.password}</span>
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
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {editingId ? "Perbarui Akun" : "Buat Akun Admin"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
