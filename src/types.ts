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
  violations: FatigueViolation[];
}

export interface AppConstraints {
  minHeadcount: number;
  maxConsecutiveNights: number;
  seniorStaffPerNight: number;
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
}

// ── Archive Types ──

export type ArchiveEntryType = "schedule" | "stress_test" | "override";

export interface OverrideDetails {
  managerNote: string;
  stressTestResult: StressTestResult;
  mitigations: string[];
  employeeIds: string[];
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

// ── App State ──

export type AppAction =
  | { type: "SET_EMPLOYEES"; payload: Employee[] }
  | { type: "GENERATE_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_CONSTRAINTS"; payload: Partial<AppConstraints> }
  | { type: "ADD_ARCHIVE_ENTRY"; payload: ArchiveEntry }
  | { type: "CLEAR_ARCHIVE" }
  | { type: "ADD_STRESS_TEST_RESULT"; payload: { schedule: Schedule; result: StressTestResult } }
  | { type: "ADD_OVERRIDE_ENTRY"; payload: { schedule: Schedule; result: StressTestResult; managerNote: string; employeeIds: string[] } };

export interface AppState {
  employees: Employee[];
  schedule: Schedule | null;
  constraints: AppConstraints;
  archive: ArchiveEntry[];
}