import { Users, Clock3, CheckCircle2, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalHariIni: number;
    menunggu: number;
    hadir: number;
    selesai: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Pengunjung Hari Ini",
      value: stats.totalHariIni,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      description: "Semua pendaftaran hari ini",
    },
    {
      title: "Tamu Sedang Hadir",
      value: stats.hadir,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      description: "Tamu di dalam gedung",
    },
    {
      title: "Menunggu Kedatangan",
      value: stats.menunggu,
      icon: Clock3,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      description: "Belum melakukan check-in",
    },
    {
      title: "Kunjungan Selesai",
      value: stats.selesai,
      icon: CheckSquare,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-200",
      description: "Telah selesai (check-out)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={`border ${card.borderColor} bg-white shadow-xs rounded-2xl transition-all hover:shadow-md`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  {card.title}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {card.value}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {card.description}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0 shadow-xs`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
