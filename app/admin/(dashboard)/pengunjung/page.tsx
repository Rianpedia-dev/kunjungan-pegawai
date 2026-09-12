import { VisitorTable } from "@/components/admin/visitor-table";
import { getAllKunjunganAction } from "@/app/actions/kunjungan";

export const revalidate = 0;

export const metadata = {
  title: "Rekap Data Kunjungan | Admin",
};

export default async function AdminPengunjungPage() {
  const { data: visitors } = await getAllKunjunganAction();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Data & Rekapitulasi Kunjungan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kelola data riwayat semua pengunjung kantor, filter berdasarkan tanggal/status, dan ekspor ke Excel.
        </p>
      </div>

      <VisitorTable initialData={visitors || []} />
    </div>
  );
}
