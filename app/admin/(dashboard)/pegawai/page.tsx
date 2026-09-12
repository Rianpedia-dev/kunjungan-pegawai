import { PegawaiManager } from "@/components/admin/pegawai-manager";
import { getAllPegawaiAdminAction } from "@/app/actions/pegawai";

export const revalidate = 0;

export const metadata = {
  title: "Master Data Pegawai | Admin",
};

export default async function AdminPegawaiPage() {
  const { data: pegawaiList } = await getAllPegawaiAdminAction();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Master Data Pegawai Kantor
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kelola daftar pegawai dan divisi yang menjadi tujuan kunjungan para tamu.
        </p>
      </div>

      <PegawaiManager initialData={pegawaiList || []} />
    </div>
  );
}
