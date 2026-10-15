import { useEffect, useState } from "react";

/* =====================================================
   TYPES
===================================================== */
export type ActivityEvent = {
  id: string;
  type: "request" | "donation";
  title: string;
  detail: string;
  time: string;
};

/* =====================================================
   TIME HELPERS
===================================================== */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function secondsLeft(expiresAt: string | null | undefined, now = Date.now()): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

export type Urgency = "none" | "ok" | "soon" | "critical" | "expired";

export function urgencyOf(sec: number | null): Urgency {
  if (sec === null) return "none";
  if (sec <= 0) return "expired";
  if (sec <= 3600) return "critical";
  if (sec <= 3 * 3600) return "soon";
  return "ok";
}

export const URGENCY_COLORS: Record<Urgency, { fg: string; bg: string }> = {
  none: { fg: "#4F695D", bg: "#EEF1EE" },
  ok: { fg: "#1F6B52", bg: "#E4F0E8" },
  soon: { fg: "#B36200", bg: "#FCEFD9" },
  critical: { fg: "#B3261E", bg: "#FBE4E1" },
  expired: { fg: "#7A807C", bg: "#ECEDEB" },
};

export function formatCountdown(sec: number | null): string {
  if (sec === null) return "No expiry";
  if (sec <= 0) return "Expired";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}