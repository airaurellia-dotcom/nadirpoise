export interface StressTestPersona {
  id: string;
  name: string;
  title: string;
  icon: string; // emoji for now, swap for SVG later
  systemPrompt: string;
  focusAreas: string[];
  /** How strict this persona is (0-1). Higher = more rejections */
  strictness: number;
}

export const stressTestAgents: StressTestPersona[] = [
  {
    id: "union-rep",
    name: "Union Representative",
    title: "Employee & Union Rights Advocacy",
    icon: "🏛️",
    systemPrompt: "",
    focusAreas: ["Continuous night shift limit", "Transition intervals", "Rotation protocols", "Light-exposure protocols"],
    strictness: 0.9,
  },
  {
    id: "hr-legal",
    name: "HR & Legal Compliance",
    title: "ILO & EU Working Directive Adherence",
    icon: "📋",
    systemPrompt: "",
    focusAreas: ["Weekly hour limits", "Rest intervals", "24-hour rest day compliance"],
    strictness: 0.95,
  },
  {
    id: "cfo",
    name: "CFO & Financial Optimization",
    title: "Cost Efficiency & Resource Allocation",
    icon: "💰",
    systemPrompt: "",
    focusAreas: ["Overtime cost spikes", "Premium manpower allocation", "Cost of Quality leaks"],
    strictness: 0.8,
  },
  {
    id: "frontline",
    name: "Frontline Employee",
    title: "Night-Shift Specialist Welfare",
    icon: "🥱",
    systemPrompt: "",
    focusAreas: ["Sleep opportunity windows", "Nadir window workload", "Light/glasses protocols"],
    strictness: 0.85,
  },
  {
    id: "ops-manager",
    name: "Operations Manager",
    title: "Operational Throughput & SLA Compliance",
    icon: "🚀",
    systemPrompt: "",
    focusAreas: ["Peak inbound staffing", "Cargo departure timelines", "Conveyor belt coverage"],
    strictness: 0.85,
  },
];