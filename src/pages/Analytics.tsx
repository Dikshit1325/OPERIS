import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { productivityTrend, meetingVsProductivity, getBurnoutDistribution } from "@/data/mockData";
import { useLiveData } from "@/hooks/useLiveData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Cell } from "recharts";
import { Radio } from "lucide-react";

const COLORS: Record<string, string> = {
  SDE: "#3B82F6",
  "Full Stack Engineer": "#22C55E",
  "AI/ML Engineer": "#F59E0B",
  "Data Engineer": "#EF4444",
  Live: "#A855F7",
};
const BURNOUT_COLORS = { Low: "#22C55E", Medium: "#F59E0B", High: "#EF4444" };
const ROLE_KEYS = ["SDE", "Full Stack Engineer", "AI/ML Engineer", "Data Engineer"] as const;

const TOOLTIP_STYLE = { background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E5E7EB" };

/** Mock scatter: convert ratio (0–1) to % to match live API (0–100). */
const MOCK_SCATTER = meetingVsProductivity.map((d) => ({
  meetings: d.meetings,
  productivity: Math.round(d.productivity * 100),
  role: d.role,
}));

export default function Analytics() {
  const { live, error, useLive } = useLiveData(4000);

  const mockBurnout = useMemo(() => getBurnoutDistribution(), []);

  const lineData = useMemo(() => {
    if (useLive && live?.productivity_trend?.length) {
      return live.productivity_trend.map((r) => ({
        label: r.time || `T${r.index}`,
        productivity: r.productivity,
      }));
    }
    return null;
  }, [useLive, live]);

  const burnoutData = useMemo(() => {
    if (useLive && live?.burnout_distribution?.length) return live.burnout_distribution;
    return mockBurnout;
  }, [useLive, live, mockBurnout]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Productivity trends, meeting load vs output, and burnout distribution.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {useLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-success/15 text-success border border-success/30">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Live session
              </span>
            )}
            {error && <span className="text-destructive">API: {error} — showing demo data.</span>}
            {!useLive && !error && <span className="text-muted-foreground">Extension + backend feeds live charts.</span>}
          </div>
        </div>

        {/* Productivity trends */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {useLive ? "Session productivity over time" : "Productivity trends by role"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {lineData && lineData.length > 0 ? (
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="productivity" name="Productivity %" stroke="#3B82F6" strokeWidth={2} dot />
              </LineChart>
            ) : (
              <LineChart data={productivityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="sde" name="SDE" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="fullstack" name="Full Stack" stroke="#22C55E" strokeWidth={2} />
                <Line type="monotone" dataKey="aiml" name="AI/ML" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="data" name="Data Eng" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
          {!lineData?.length && (
            <div className="flex gap-4 mt-3 justify-center flex-wrap">
              {Object.entries(COLORS)
                .filter(([k]) => k !== "Live")
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ background: v }} />
                    {k}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Meeting load vs productivity — one Scatter per role avoids Cell/rendering issues */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Meeting load vs productivity</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                <XAxis
                  type="number"
                  dataKey="meetings"
                  name="Meetings"
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  label={{ value: "Meetings (count)", position: "bottom", fill: "#9CA3AF", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="productivity"
                  name="Productivity"
                  domain={[0, 100]}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  label={{ value: "Productivity %", angle: -90, position: "insideLeft", fill: "#9CA3AF", fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
                {useLive && live?.meeting_productivity_series && live.meeting_productivity_series.length > 0 ? (
                  <Scatter name="Live" data={live.meeting_productivity_series} fill={COLORS.Live} />
                ) : (
                  ROLE_KEYS.map((role) => (
                    <Scatter
                      key={role}
                      name={role.replace(" Engineer", "").replace("Full Stack", "Full Stack")}
                      data={MOCK_SCATTER.filter((d) => d.role === role)}
                      fill={COLORS[role] ?? "#3B82F6"}
                    />
                  ))
                )}
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              {useLive ? "Points accumulate as the extension sends samples." : "Demo points by role (sample data)."}
            </p>
          </div>

          {/* Burnout distribution */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Burnout risk distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={burnoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                <XAxis dataKey="level" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {burnoutData.map((b) => (
                    <Cell key={b.level} fill={BURNOUT_COLORS[b.level as keyof typeof BURNOUT_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
