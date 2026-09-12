import Link from "next/link";
import { ArrowLeft, AlertCircle, Building } from "lucide-react";
import { getKunjunganByCodeAction } from "@/app/actions/kunjungan";
import { TicketCard } from "@/components/public/ticket-card";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

interface TicketPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const resolvedParams = await params;
  const { code } = resolvedParams;

  const res = await getKunjunganByCodeAction(code);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md no-print">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">
              Sistem Kunjungan Pegawai
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            + Buat Kunjungan Baru
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        {res.success && res.data ? (
          <TicketCard initialData={res.data} />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Tiket Tidak Ditemukan</h2>
            <p className="text-sm text-slate-500">
              Kode booking <span className="font-mono font-bold text-slate-800">{code}</span> tidak terdaftar dalam sistem atau telah kadaluarsa.
            </p>
            <div className="pt-2">
              <Button asChild className="rounded-xl">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Formulir
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
