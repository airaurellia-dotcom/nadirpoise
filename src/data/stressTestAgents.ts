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
    id: "chief-fatigue",
    name: "Chief Fatigue Officer",
    title: "Fatigue Risk & Circadian Oversight",
    icon: "🏛️",
    systemPrompt: "",
    focusAreas: ["Consecutive night shift limit", "48h biological reset window", "Transition interval compliance", "Sleep debt accumulation"],
    strictness: 0.95,
  },
  {
    id: "shift-supervisor",
    name: "Shift Supervisor",
    title: "Operational Coverage & Shift Integrity",
    icon: "📋",
    systemPrompt: "",
    focusAreas: ["Shift coverage continuity", "Single-point-of-failure risks", "Operational buffer adequacy", "Handover integrity"],
    strictness: 0.85,
  },
  {
    id: "graveyard-night-ops",
    name: "Graveyard Night Ops Lead",
    title: "Night-Shift Allocation & Chronotype Fit",
    icon: "🥱",
    systemPrompt: "",
    focusAreas: ["Night shift staffing levels", "Chronotype compatibility", "Nadir window workload", "Rest opportunity windows"],
    strictness: 0.9,
  },
  {
    id: "wellbeing-hr",
    name: "Wellbeing & HR Rep",
    title: "Staff Welfare & Legal Compliance",
    icon: "⚖️",
    systemPrompt: "",
    focusAreas: ["Rest window compliance", "Legal liability assessment", "ILO/EU directive adherence", "Mandatory rest day compliance"],
    strictness: 0.95,
  },
  {
    id: "compliance-auditor",
    name: "Compliance Auditor",
    title: "Regulatory & Safety Compliance Enforcement",
    icon: "🔍",
    systemPrompt: "",
    focusAreas: ["Safety hazard ratio", "ILO convention compliance", "EU Working Time Directive checks", "VETO trigger detection"],
    strictness: 0.98,
  },
];