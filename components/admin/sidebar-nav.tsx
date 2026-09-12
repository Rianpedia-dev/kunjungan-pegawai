"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Users,
  UserSquare2,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAdminAction } from "@/app/actions/auth";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Scan QR Kunjungan",
    href: "/admin/scan",
    icon: QrCode,
  },
  {
    title: "Rekap Pengunjung",
    href: "/admin/pengunjung",
    icon: Users,
  },
  {
    title: "Data Pegawai",
    href: "/admin/pegawai",
    icon: UserSquare2,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <Image
            src="/logo-kunjungan-pegawai.avif"
            alt="Logo Admin"
            width={32}
            height={32}
            className="h-8 w-8 object-contain rounded-lg shadow-xs"
          />
          <span className="font-bold text-slate-800 text-sm">Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <Image
            src="/logo-kunjungan-pegawai.avif"
            alt="Logo Admin"
            width={40}
            height={40}
            className="h-10 w-10 object-contain rounded-xl shadow-md bg-white/5 p-1"
          />
          <div>
            <h2 className="font-bold text-white text-sm leading-tight tracking-wide">
              ADMIN BUKU TAMU
            </h2>
            <p className="text-[11px] text-slate-400">Front Desk & Security</p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <div className="pt-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Akses Cepat
            </div>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ExternalLink className="h-4 w-4 text-slate-400" />
                <span>Halaman Tamu (Publik)</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Logout bottom */}
        <div className="p-4 border-t border-slate-800">
          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar (Logout)</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
