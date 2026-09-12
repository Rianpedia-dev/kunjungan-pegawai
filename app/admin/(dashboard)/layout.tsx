import { redirect } from "next/navigation";
import { getAdminUser } from "@/app/actions/auth";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { Shield } from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100">
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Portal Resepsionis & Keamanan
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 block">
                {user.email}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Admin Terautentikasi
              </span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
