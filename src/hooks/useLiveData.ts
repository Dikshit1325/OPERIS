import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export type LiveDashboardPayload = {
  has_data: boolean;
  message: string | null;
  last_update: string | null;
  kpis: {
    avgProd: number;
    highBurnout: number;
    avgHours: number;
    totalEmployees: number;
    current_site?: string | null;
  } | null;
  productivity_trend: { index: number; time: string; productivity: number }[];
  burnout_distribution: { level: string; count: number }[];
  alerts: unknown[];
  live_row: unknown;
  meeting_productivity_series?: { meetings: number; productivity: number; time?: string }[];
};

export function useLiveData(pollMs = 4000) {
  const [live, setLive] = useState<LiveDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch(`${API_BASE}/live`, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LiveDashboardPayload = await res.json();
        if (!cancelled) {
          setLive(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to reach backend");
          setLive(null);
        }
      }
    }

    fetchLive();
    const id = window.setInterval(fetchLive, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  const useLive = live?.has_data === true;
  return { live, error, useLive };
}
