import { useEffect, useState } from "react";
import { employees, getKPIs, getBurnoutDistribution, productivityTrend, getAlerts } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE } from "@/lib/api";
import { TrendingUp, AlertTriangle, Clock, Users, Radio } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const BURNOUT_COLORS = { Low: "#22C55E", Medium: "#F59E0B", High: "#EF4444" };

type LiveKpis = {
  avgProd: number;
  highBurnout: number;
  avgHours: number;
  totalEmployees: number;
  current_site?: string | null;
};

type LivePayload = {
  has_data: boolean;
  message: string | null;
  last_update: string | null;
  kpis: LiveKpis | null;
  productivity_trend: { index: number; time: string; productivity: number }[];
  burnout_distribution: { level: string; count: number }[];
  alerts: { employeeId: string; name: string; level: string; recommendation: string }[];
  live_row: {
    id: string;
    name: string;
    productivityScore: number;
    burnoutLevel: string;
    hoursWorked: number;
    current_site?: string | null;
  } | null;
};

const TOOLTIP_STYLE = { background: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#E5E7EB" };

function KPICard({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string | number; color?: string }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" style={color ? { color } : {}} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function BurnoutBadge({ level }: { level: string }) {
  const cls = level === "High" ? "bg-destructive/10 text-destructive" : level === "Medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{level}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [live, setLive] = useState<LivePayload | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch(`${API_BASE}/live`, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LivePayload = await res.json();
        if (!cancelled) {
          setLive(data);
          setLiveError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLiveError(e instanceof Error ? e.message : "Failed to reach backend");
          setLive(null);
        }
      }
    }

    fetchLive();
    const id = window.setInterval(fetchLive, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const useLive = live?.has_data === true;
  const mockKpis = getKPIs();
  const kpis = useLive && live.kpis ? live.kpis : mockKpis;
  const burnoutDist =
    useLive && live.burnout_distribution?.length ? live.burnout_distribution : getBurnoutDistribution();
  const alerts = useLive ? live!.alerts : getAlerts().filter((a) => a.level === "High").slice(0, 5);
  const liveChartData =
    useLive && live!.productivity_trend.length > 0
      ? live!.productivity_trend.map((r) => ({
          label: r.time || `T${r.index}`,
          productivity: r.productivity,
        }))
      : [];

  const roleEmployees = user?.role ? employees.filter((e) => e.role === user.role) : employees;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {useLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success border border-success/30">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Live data
              </span>
            )}
            {!useLive && !liveError && (
              <span className="text-xs text-muted-foreground">Start the Operis extension + backend to stream real metrics.</span>
            )}
            {liveError && (
              <span className="text-xs text-destructive">Backend unreachable ({liveError}). Showing demo data.</span>
            )}
            {useLive && live?.last_update && (
              <span className="text-xs text-muted-foreground">Last update: {new Date(live.last_update).toLocaleString()}</span>
            )}
            {useLive && live?.kpis?.current_site && (
              <span className="text-xs text-muted-foreground">Site: {live.kpis.current_site}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={TrendingUp} label={useLive ? "Live productivity" : "Avg Productivity"} value={kpis.avgProd} />
          <KPICard
            icon={AlertTriangle}
            label={useLive ? "Session burnout" : "High Burnout Risk"}
            value={useLive ? kpis.highBurnout : mockKpis.highBurnout}
            color="#EF4444"
          />
          <KPICard
            icon={Clock}
            label={useLive ? "Hours (session)" : "Avg Working Hours"}
            value={useLive ? `${kpis.avgHours}h` : `${mockKpis.avgHours}h`}
          />
          <KPICard icon={Users} label={useLive ? "Tracked" : "Total Employees"} value={useLive ? 1 : mockKpis.totalEmployees} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {useLive ? "Productivity (live session)" : "Productivity Trend"}
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              {useLive && liveChartData.length > 0 ? (
                <LineChart data={liveChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="productivity" stroke="#3B82F6" strokeWidth={2} dot name="Productivity %" />
                </LineChart>
              ) : (
                <LineChart data={productivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                  <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="sde" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fullstack" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="aiml" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="data" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
            {!useLive && (
              <div className="flex gap-4 mt-3 justify-center flex-wrap">
                {[
                  ["SDE", "#3B82F6"],
                  ["Full Stack", "#22C55E"],
                  ["AI/ML", "#F59E0B"],
                  ["Data", "#EF4444"],
                ].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Burnout Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={burnoutDist}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {burnoutDist.map((entry) => (
                    <Cell key={entry.level} fill={BURNOUT_COLORS[entry.level as keyof typeof BURNOUT_COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center flex-wrap">
              {burnoutDist.map((b) => (
                <div key={b.level} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full" style={{ background: BURNOUT_COLORS[b.level as keyof typeof BURNOUT_COLORS] }} />
                  {b.level}: {b.count}
                </div>
              ))}
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">High Risk Alerts</h3>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div
                  key={String(a.employeeId)}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5 border border-destructive/10"
                >
                  <span className="text-sm text-foreground">
                    {a.name} — <span className="text-muted-foreground">{"recommendation" in a ? a.recommendation : "High burnout risk"}</span>
                  </span>
                  <span className="text-xs text-destructive font-medium">High</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {useLive ? "Live session" : user?.role ? `${user.role} Employees` : "All Employees"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Productivity</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Burnout Risk</th>
                </tr>
              </thead>
              <tbody>
                {useLive && live?.live_row ? (
                  <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 text-foreground">{live.live_row.id}</td>
                    <td className="py-2.5 px-3 text-foreground">{live.live_row.name}</td>
                    <td className="py-2.5 px-3 text-foreground">{live.live_row.productivityScore}</td>
                    <td className="py-2.5 px-3">
                      <BurnoutBadge level={live.live_row.burnoutLevel} />
                    </td>
                  </tr>
                ) : (
                  roleEmployees.slice(0, 10).map((emp) => (
                    <tr key={emp.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-3 text-foreground">{emp.id}</td>
                      <td className="py-2.5 px-3 text-foreground">{emp.name}</td>
                      <td className="py-2.5 px-3 text-foreground">{emp.productivityScore}</td>
                      <td className="py-2.5 px-3">
                        <BurnoutBadge level={emp.burnoutLevel} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
