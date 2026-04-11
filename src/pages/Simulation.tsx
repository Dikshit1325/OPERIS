import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Flame, TrendingUp, Brain, Zap, Shuffle, ArrowRight } from "lucide-react";

interface SimInput {
  hours_worked: number;
  tasks_completed: number;
  tasks_assigned: number;
  meetings_count: number;
  meeting_hours: number;
  deadline_pressure: "low" | "medium" | "high";
  messages_sent: number;
  messages_received: number;
  sentiment: "positive" | "neutral" | "negative";
  breaks_taken: number;
  working_days_streak: number;
}

interface SimResult {
  productivity: number;
  taskLoad: number;
  meetingLoad: number;
  workloadScore: number;
  burnoutScore: number;
  burnoutLevel: "Low" | "Medium" | "High";
  insights: string[];
}

const defaultInput: SimInput = {
  hours_worked: 40,
  tasks_completed: 12,
  tasks_assigned: 15,
  meetings_count: 8,
  meeting_hours: 6,
  deadline_pressure: "medium",
  messages_sent: 45,
  messages_received: 60,
  sentiment: "neutral",
  breaks_taken: 3,
  working_days_streak: 5,
};

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function generateRandom(): SimInput {
  const sentiment = (["positive", "neutral", "negative"] as const)[Math.floor(Math.random() * 3)];
  const deadline = (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)];
  return {
    hours_worked: randomBetween(25, 55),
    tasks_completed: randomBetween(3, 25),
    tasks_assigned: randomBetween(8, 30),
    meetings_count: randomBetween(2, 18),
    meeting_hours: randomBetween(1, 15),
    deadline_pressure: deadline,
    messages_sent: randomBetween(10, 120),
    messages_received: randomBetween(15, 150),
    sentiment,
    breaks_taken: randomBetween(0, 6),
    working_days_streak: randomBetween(1, 15),
  };
}

const TOOLTIP_STYLE = {
  background: "#1F2937",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#E5E7EB",
};

function BurnoutBadgeLarge({ level, score }: { level: string; score: number }) {
  const cls =
    level === "High"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : level === "Medium"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-success/15 text-success border-success/30";
  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl border ${cls}`}>
      <Flame className="h-8 w-8 mb-2" />
      <span className="text-3xl font-bold">{score}</span>
      <span className="text-sm font-medium mt-1">{level} Risk</span>
    </div>
  );
}

export default function Simulation() {
  const [input, setInput] = useState<SimInput>(defaultInput);
  const [result, setResult] = useState<SimResult | null>(null);

  const update = <K extends keyof SimInput>(key: K, value: SimInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const handlePredict = async (currentInput: SimInput = input) => {
    const sentimentMap = { positive: 0, neutral: 0.5, negative: 1 };

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours_worked: currentInput.hours_worked,
          meetings_count: currentInput.meetings_count,
          tasks_completed: currentInput.tasks_completed,
          sentiment: sentimentMap[currentInput.sentiment],
        }),
      });

      if (!response.ok) {
        throw new Error(`Prediction request failed (${response.status})`);
      }

      const apiResult: any = await response.json();
      const risk = apiResult.burnout_risk ?? apiResult.burnout_label ?? "Low";
      const normalized = String(risk).toLowerCase();
      const burnoutLevel: "Low" | "Medium" | "High" = normalized.includes("high")
        ? "High"
        : normalized.includes("medium")
          ? "Medium"
          : normalized.includes("burnout")
            ? "High"
            : "Low";

      const burnoutScore = burnoutLevel === "High" ? 80 : burnoutLevel === "Medium" ? 50 : 20;
      const meetingLoad =
        currentInput.hours_worked > 0 ? currentInput.meeting_hours / currentInput.hours_worked : 0;

      setResult({
        burnoutLevel,
        productivity: apiResult.productivity_score ?? 0,
        burnoutScore,
        workloadScore: 50,
        meetingLoad,
        taskLoad: currentInput.tasks_assigned - currentInput.tasks_completed,
        insights: ["Generated from ML model"],
      });
    } catch (error) {
      console.error("Prediction error:", error);
      setResult(null);
    }
  };

  const handleSimulate = async () => {
    const randomized = generateRandom();
    setInput(randomized);
    await handlePredict(randomized);
  };

  const numberField = (label: string, key: keyof SimInput, min = 0, max = 200) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={input[key] as number}
        onChange={(e) => update(key, Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
        className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );

  const selectField = (label: string, key: keyof SimInput, options: string[]) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <select
        value={input[key] as string}
        onChange={(e) => update(key, e.target.value as any)}
        className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-card">
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );

  const productivityBarData = result
    ? [
      { name: "Productivity", value: Math.round(result.productivity * 100) },
      { name: "Meeting Load", value: Math.round(result.meetingLoad * 100) },
      { name: "Workload", value: result.workloadScore },
      { name: "Burnout", value: result.burnoutScore },
    ]
    : [];

  const workloadPieData = result
    ? [
      { name: "Tasks Done", value: input.tasks_completed },
      { name: "Task Backlog", value: result.taskLoad > 0 ? result.taskLoad : 0 },
      { name: "Meeting Hours", value: input.meeting_hours },
      {
        name: "Available",
        value: Math.max(0, input.hours_worked - input.meeting_hours - input.tasks_completed * 2),
      },
    ]
    : [];

  const radarData = result
    ? [
      { metric: "Productivity", value: Math.min(100, Math.round(result.productivity * 200)) },
      { metric: "Workload", value: result.workloadScore },
      { metric: "Burnout", value: result.burnoutScore },
      { metric: "Communication", value: Math.min(100, Math.round((input.messages_sent + input.messages_received) / 3)) },
      { metric: "Meeting Load", value: Math.min(100, Math.round(result.meetingLoad * 200)) },
      { metric: "Task Completion", value: Math.round((input.tasks_completed / Math.max(input.tasks_assigned, 1)) * 100) },
    ]
    : [];

  const PIE_COLORS = [
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--primary))",
    "hsl(var(--muted-foreground))",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Simulation Tool</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simulate employee data and predict burnout risk
            </p>
          </div>
          <button
            onClick={handleSimulate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            Simulate Employee Data
          </button>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Employee Simulation / Input Panel</h3>

          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Basic Work Data
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {numberField("Hours Worked", "hours_worked", 0, 80)}
                {numberField("Tasks Completed", "tasks_completed", 0, 50)}
                {numberField("Tasks Assigned", "tasks_assigned", 0, 50)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
                <Brain className="h-3.5 w-3.5" /> Workload Signals
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {numberField("Meetings Count", "meetings_count", 0, 30)}
                {numberField("Meeting Hours", "meeting_hours", 0, 40)}
                {selectField("Deadline Pressure", "deadline_pressure", ["low", "medium", "high"])}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" /> Communication Activity
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {numberField("Messages Sent", "messages_sent", 0, 200)}
                {numberField("Messages Received", "messages_received", 0, 200)}
                {selectField("Sentiment", "sentiment", ["positive", "neutral", "negative"])}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Optional</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {numberField("Breaks Taken", "breaks_taken", 0, 10)}
                {numberField("Working Days Streak", "working_days_streak", 1, 30)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => handlePredict()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Analyze & Predict
            </button>
            <button
              onClick={() => {
                setInput(defaultInput);
                setResult(null);
              }}
              className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <BurnoutBadgeLarge level={result.burnoutLevel} score={result.burnoutScore} />
              <div className="p-5 rounded-xl bg-card border border-border flex flex-col items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-foreground">{result.productivity}</span>
                <span className="text-xs text-muted-foreground mt-1">Productivity Score</span>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border flex flex-col items-center justify-center">
                <Brain className="h-6 w-6 text-warning mb-2" />
                <span className="text-2xl font-bold text-foreground">{result.workloadScore}</span>
                <span className="text-xs text-muted-foreground mt-1">Workload Score</span>
              </div>
              <div className="p-5 rounded-xl bg-card border border-border flex flex-col items-center justify-center">
                <Zap className="h-6 w-6 text-success mb-2" />
                <span className="text-2xl font-bold text-foreground">{Math.round(result.meetingLoad * 100)}%</span>
                <span className="text-xs text-muted-foreground mt-1">Meeting Load</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">Metrics Overview</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={productivityBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,17%,20%)" />
                    <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {productivityBarData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--warning))", "hsl(var(--destructive))"][i]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">Workload Distribution</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={workloadPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {workloadPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {workloadPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Burnout Risk Profile</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220,17%,20%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Insights</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.insights.map((insight, i) => {
                  const isRisk =
                    insight.toLowerCase().includes("risk") ||
                    insight.toLowerCase().includes("excessive") ||
                    insight.toLowerCase().includes("negative");
                  const isWarning =
                    insight.toLowerCase().includes("high") ||
                    insight.toLowerCase().includes("low productivity") ||
                    insight.toLowerCase().includes("insufficient");
                  const cls = isRisk
                    ? "border-destructive/20 bg-destructive/5"
                    : isWarning
                      ? "border-warning/20 bg-warning/5"
                      : "border-success/20 bg-success/5";
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${cls}`}>
                      <p className="text-sm text-foreground">{insight}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
