export type ShiftType = "Morning" | "Afternoon" | "Night" | "Off";

export interface Employee {
  id: string;
  name: string;
  role: string;
  skills: string[];
  current_weekly_hours: number;
  consecutive_night_shifts: number;
  circadian_status: string;
  sleep_debt_hours: number;
  avatarInitials: string;
}

export interface DayPlan {
  day: string; // 'Monday' -> 'Sunday'
  shifts: Record<Exclude<ShiftType, "Off">, string[]> & { Off: string[] };
}

export interface Schedule {
  days: DayPlan[];
  weekStart: string; // ISO date string
}

export interface FatigueViolation {
  rule: string;
  message: string;
}

export interface FatigueReport {
  employeeId: string;
  dayIndex: number;
  shift: ShiftType;
  fatigueIndex: number;
  redZone: boolean;
  alert: boolean;
  violations: FatigueViolation[];
}

export interface AppConstraints {
  minHeadcount: number;
  maxConsecutiveNights: number;
  seniorStaffPerNight: number;
}

// ── Fatigue Config (live-wired thresholds) ──

export interface FatigueConfig {
  alertThreshold?: number;      // default 70
  hardRejectThreshold?: number; // default 85
  enforceILO48h?: boolean;      // default true
  enforce11hRest?: boolean;     // default true
}

// ── User (from landing-and-auth PRD) ──

export interface User {
  persona: Persona;
  displayName: string;
  role: string;
  email: string;
}

// ── App Settings ──

export interface AppSettings {
  thresholds: {
    alertThreshold: number;
    hardRejectThreshold: number;
    enforceILO48h: boolean;
    enforce11hRest: boolean;
  };
  station: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  thresholds: {
    alertThreshold: 70,
    hardRejectThreshold: 85,
    enforceILO48h: true,
    enforce11hRest: true,
  },
  station: {
    id: "CGK",
    name: "NexaGlobal Air-Hub · CGK",
    lat: -6.2088,
    lon: 106.8456,
  },
};

// ── AI Stress Test Types ──

/** Raw response from the ai-stress-test Edge Function */
export interface AIStressTestResponse {
  status: "APPROVED" | "CAUTION" | "REJECT";
  risk_score: number;
  overall_risk_score?: number;
  nadir_violations: number;
  persona_feedback: AIStressTestPersonaFeedback[];
  persona_evaluations?: Array<{ persona: string; finding: string }>;
  recommendations?: string[];
}

export interface AIStressTestPersonaFeedback {
  persona: string;
  finding: string;
}

/** Raw response from the ai-override-audit Edge Function */
export interface AIOverrideAuditResponse {
  is_valid: boolean;
  compliance_summary: string;
  cryptographic_receipt: string;
}

// ── Stress Test Types ──

export type PersonaVerdict = "APPROVE" | "REJECT" | "CAUTION";

export interface StressTestPersonaResult {
  personaId: string;
  personaName: string;
  personaTitle: string;
  personaIcon: string;
  verdict: PersonaVerdict;
  findings: string[];
  detail: string;
}

export interface StressTestResult {
  id: string;
  timestamp: string;
  scheduleSnapshot: Schedule;
  personaResults: StressTestPersonaResult[];
  overallVerdict: PersonaVerdict;
  summary: {
    totalPersonas: number;
    approved: number;
    cautioned: number;
    rejected: number;
  };
  /** AI audit data from the live AIML API call */
  aiRaw?: AIStressTestResponse;
}

// ── Archive Types ──

export type ArchiveEntryType = "schedule" | "stress_test" | "override";

export interface OverrideDetails {
  managerNote: string;
  stressTestResult: StressTestResult;
  mitigations: string[];
  employeeIds: string[];
  /** AI compliance audit result (from ai-override-audit Edge Function) */
  aiAudit?: AIOverrideAuditResponse;
}

export interface ArchiveEntry {
  id: string;
  timestamp: string;
  type: ArchiveEntryType;
  schedule: Schedule;
  stressTestResult?: StressTestResult;
  overrideDetails?: OverrideDetails;
  label?: string;
}

// ── Persona Switcher ──

export type Persona = "shift_manager" | "employee" | "auditor";

export const PERSONA_LABELS: Record<Persona, string> = {
  shift_manager: "Shift Manager (NexaGlobal Air-Hub)",
  employee: "Frontline Employee (Amir Hassan)",
  auditor: "Safety Compliance Auditor",
};

export const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  shift_manager: "Full operational access",
  employee: "Personal circadian view",
  auditor: "Archive & compliance",
};

export const PERSONA_DEFAULT_ROUTE: Record<Persona, string> = {
  shift_manager: "/dashboard",
  employee: "/employee",
  auditor: "/dashboard",
};

// ── App State ──

export type AppAction =
  | { type: "SET_EMPLOYEES"; payload: Employee[] }
  | { type: "GENERATE_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_CONSTRAINTS"; payload: Partial<AppConstraints> }
  | { type: "ADD_ARCHIVE_ENTRY"; payload: ArchiveEntry }
  | { type: "CLEAR_ARCHIVE" }
  | { type: "ADD_STRESS_TEST_RESULT"; payload: { schedule: Schedule; result: StressTestResult } }
  | { type: "ADD_OVERRIDE_ENTRY"; payload: { schedule: Schedule; result: StressTestResult; managerNote: string; employeeIds: string[]; aiAudit?: AIOverrideAuditResponse } }
  | { type: "SET_PERSONA"; payload: Persona }
  | { type: "SET_USER"; payload: User }
  | { type: "CLEAR_USER" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> };

export interface AppState {
  employees: Employee[];
  schedule: Schedule | null;
  constraints: AppConstraints;
  archive: ArchiveEntry[];
  persona: Persona;
  user: User | null;
  settings: AppSettings;
}