import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTanggalIndo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatWaktuIndo(timeStr: string | Date | null | undefined): string {
  if (!timeStr) return "-";
  if (typeof timeStr === "string" && timeStr.includes(":") && !timeStr.includes("T")) {
    const parts = timeStr.split(":");
    return `${parts[0]}:${parts[1]} WIB`;
  }
  const d = typeof timeStr === "string" ? new Date(timeStr) : timeStr;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d) + " WIB";
}

export function generateBookingCode(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VIS-${datePart}-${randomPart}`;
}
