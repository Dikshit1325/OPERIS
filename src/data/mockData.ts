export type Role = "SDE" | "Full Stack Engineer" | "AI/ML Engineer" | "Data Engineer";
export type BurnoutLevel = "Low" | "Medium" | "High";

export interface Employee {
  id: number;
  name: string;
  role: Role;
  tasksCompleted: number;
  hoursWorked: number;
  meetingCount: number;
  sentiment: number; // -1 to 1
  productivityScore: number;
  burnoutLevel: BurnoutLevel;
  streak: number;
}

const names = [
  "Alex Chen", "Priya Sharma", "James Wilson", "Maria Garcia", "Yuki Tanaka",
  "Omar Hassan", "Sarah Johnson", "David Kim", "Emma Davis", "Raj Patel",
  "Lisa Zhang", "Tom Brown", "Ana Martinez", "Wei Liu", "Kate Moore",
  "Chris Lee", "Nina Gupta", "Mark Taylor", "Sofia Rossi", "Ahmed Ali",
  "Rachel Green", "Mike Chang", "Laura White", "Sam Jackson", "Fatima Noor",
];

const roles: Role[] = ["SDE", "Full Stack Engineer", "AI/ML Engineer", "Data Engineer"];

function calcBurnout(hours: number, meetings: number, sentiment: number): BurnoutLevel {
  const score = (hours > 45 ? 2 : hours > 38 ? 1 : 0) +
    (meetings > 12 ? 2 : meetings > 8 ? 1 : 0) +
    (sentiment < -0.3 ? 2 : sentiment < 0.1 ? 1 : 0);
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

export const employees: Employee[] = names.map((name, i) => {
  const role = roles[i % 4];
  const hoursWorked = Math.round(32 + Math.random() * 25);
  const tasksCompleted = Math.round(5 + Math.random() * 20);
  const meetingCount = Math.round(3 + Math.random() * 15);
  const sentiment = Math.round((Math.random() * 2 - 1) * 100) / 100;
  const productivityScore = Math.round((tasksCompleted / hoursWorked) * 100) / 100;
  const burnoutLevel = calcBurnout(hoursWorked, meetingCount, sentiment);
  const streak = burnoutLevel === "Low" ? Math.round(3 + Math.random() * 12) : Math.round(Math.random() * 4);

  return {
    id: 100 + i + 1,
    name,
    role,
    tasksCompleted,
    hoursWorked,
    meetingCount,
    sentiment,
    productivityScore,
    burnoutLevel,
    streak,
  };
});

export const productivityTrend = [
  { week: "W1", sde: 0.42, fullstack: 0.38, aiml: 0.45, data: 0.40 },
  { week: "W2", sde: 0.45, fullstack: 0.41, aiml: 0.43, data: 0.42 },
  { week: "W3", sde: 0.48, fullstack: 0.44, aiml: 0.47, data: 0.39 },
  { week: "W4", sde: 0.44, fullstack: 0.46, aiml: 0.50, data: 0.43 },
  { week: "W5", sde: 0.50, fullstack: 0.43, aiml: 0.52, data: 0.45 },
  { week: "W6", sde: 0.47, fullstack: 0.48, aiml: 0.49, data: 0.47 },
  { week: "W7", sde: 0.52, fullstack: 0.45, aiml: 0.55, data: 0.44 },
  { week: "W8", sde: 0.49, fullstack: 0.50, aiml: 0.53, data: 0.48 },
];

export const meetingVsProductivity = [
  { meetings: 3, productivity: 0.55, role: "SDE" },
  { meetings: 5, productivity: 0.50, role: "Full Stack Engineer" },
  { meetings: 8, productivity: 0.45, role: "AI/ML Engineer" },
  { meetings: 10, productivity: 0.38, role: "Data Engineer" },
  { meetings: 13, productivity: 0.30, role: "SDE" },
  { meetings: 15, productivity: 0.25, role: "Full Stack Engineer" },
];

export function getKPIs() {
  const avgProd = Math.round(employees.reduce((s, e) => s + e.productivityScore, 0) / employees.length * 100) / 100;
  const highBurnout = employees.filter(e => e.burnoutLevel === "High").length;
  const avgHours = Math.round(employees.reduce((s, e) => s + e.hoursWorked, 0) / employees.length * 10) / 10;
  return { avgProd, highBurnout, avgHours, totalEmployees: employees.length };
}

export function getAlerts() {
  return employees
    .filter(e => e.burnoutLevel === "High" || e.burnoutLevel === "Medium")
    .map(e => ({
      employeeId: e.id,
      name: e.name,
      level: e.burnoutLevel,
      recommendation: e.meetingCount > 10
        ? "Reduce meeting load"
        : e.hoursWorked > 45
        ? "Rebalance workload"
        : "Monitor sentiment trends",
    }));
}

export function getBurnoutDistribution() {
  return [
    { level: "Low", count: employees.filter(e => e.burnoutLevel === "Low").length },
    { level: "Medium", count: employees.filter(e => e.burnoutLevel === "Medium").length },
    { level: "High", count: employees.filter(e => e.burnoutLevel === "High").length },
  ];
}
