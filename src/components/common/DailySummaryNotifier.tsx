import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";

const LAST_KEY = "rx-daily-summary-last";

async function showSummary(userId: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const [jobsRes, paysRes] = await Promise.all([
    (supabase as any)
      .from("repair_jobs")
      .select("id,status", { count: "exact" })
      .eq("user_id", userId)
      .eq("deleted", false)
      .in("status", ["Received", "In Progress", "Ready"]),
    (supabase as any)
      .from("payments")
      .select("amount")
      .eq("user_id", userId)
      .gte("created_at", start),
  ]);

  const pending = jobsRes.count ?? jobsRes.data?.length ?? 0;
  const todayRevenue = (paysRes.data || []).reduce(
    (s: number, p: any) => s + Number(p.amount || 0),
    0,
  );

  new Notification("RepairXpert — Daily Summary", {
    body: `📋 ${pending} pending jobs · 💰 ₹${todayRevenue.toFixed(0)} today`,
    icon: "/favicon.ico",
    tag: "rx-daily-summary",
  });
}

/**
 * Asks once for notification permission; shows a daily summary push
 * the first time the user opens the app each day.
 */
export function DailySummaryNotifier() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !("Notification" in window)) return;

    // Ask permission opportunistically (non-blocking)
    if (Notification.permission === "default") {
      // Delay so we don't ambush new users on first paint
      const t = window.setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 10_000);
      return () => clearTimeout(t);
    }

    if (Notification.permission !== "granted") return;

    const today = new Date().toDateString();
    const last = localStorage.getItem(LAST_KEY);
    if (last === today) return;

    const t = window.setTimeout(() => {
      showSummary(user.id)
        .then(() => localStorage.setItem(LAST_KEY, today))
        .catch(() => {});
    }, 5_000);
    return () => clearTimeout(t);
  }, [user]);

  return null;
}
