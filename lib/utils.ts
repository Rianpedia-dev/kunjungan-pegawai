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

export function cleanErrorMessage(error: unknown): string {
  if (!error) return "Terjadi kesalahan";

  let raw = "";
  if (typeof error === "string") {
    raw = error.trim();
  } else if (typeof error === "object" && error !== null) {
    if ("issues" in error && Array.isArray((error as { issues: unknown[] }).issues)) {
      const messages = (
        error as { issues: Array<{ message?: string }> }
      ).issues
        .map((i) => i.message)
        .filter(Boolean);
      if (messages.length > 0) return messages.join(". ");
    }
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      raw = ((error as { message: string }).message || "").trim();
    } else {
      try {
        raw = JSON.stringify(error);
      } catch {
        return "Terjadi kesalahan sistem";
      }
    }
  }

  // Check if raw message is a serialized JSON array of Zod issues
  if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const messages = parsed
          .map((item) =>
            item && typeof item === "object" && "message" in item ? String(item.message) : null
          )
          .filter(Boolean);
        if (messages.length > 0) {
          return messages.join(". ");
        }
      } else if (parsed && typeof parsed === "object" && "message" in parsed) {
        return String(parsed.message);
      }
    } catch {
      // Fall through if not valid JSON
    }
  }

  return raw || "Terjadi kesalahan sistem";
}

export function extractZodFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!error) return fieldErrors;

  let raw = "";
  if (typeof error === "string") {
    raw = error.trim();
  } else if (typeof error === "object" && error !== null) {
    if ("issues" in error && Array.isArray((error as { issues: unknown[] }).issues)) {
      for (const issue of (
        error as { issues: Array<{ path?: (string | number)[]; message?: string }> }
      ).issues) {
        const field = issue.path?.[0];
        if (field && typeof field === "string" && issue.message && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return fieldErrors;
    }
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      raw = (error as { message: string }).message.trim();
    }
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            const field = Array.isArray(item.path) ? item.path[0] : undefined;
            if (field && typeof field === "string" && item.message && !fieldErrors[field]) {
              fieldErrors[field] = String(item.message);
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return fieldErrors;
}
