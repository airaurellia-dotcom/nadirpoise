import { useMemo } from "react";
import { useAppState } from "../context/AppContext";
import { calculateFatigueReports, fatigueBarClass, fatigueLabel } from "../lib/fatigue";
import type { ShiftType } from "../types";
import BrightDataTicker from "../components/BrightDataTicker";

const ROLE_COLORS: Record<string, string> = {
  "Senior Operator": "bg-role-senior text-white",
  Operator: "bg-role-operator text-black",
  "Shift Lead": "bg-role-lead text-black",
};

const SHIFT_COLORS: Record<string, string> = {
  Morning: "bg-shift-morning text-shift-morning-text border border-shift-morning-text/30",
  Afternoon: "bg-shift-afternoon text-shift-afternoon-text border border-shift-afternoon-text/30",
  Night: "bg-shift-night text-shift-night-text border border-shift-night-text/30",
  Off: "bg-shift-off text-text-muted",
};

export default function Dashboard() {
  const { state } = useAppState();
  const { employees, schedule, archive } = state;

  // Calculate fatigue reports for the schedule
  const reports = useMemo(() => {
    if (!schedule) return [];
    return calculateFatigueReports(employees, schedule);
  }, [employees, schedule]);

  // Today's index
  const todayIdx = new Date().getDay() - 1;
  const todayIndex = todayIdx < 0 ? 0 : todayIdx;

  // Summary calculations
  const summary = useMemo(() => {
    if (!schedule || reports.length === 0) {
      return { avgFatigue: 0, shiftCounts: { Morning: 0, Afternoon: 0, Night: 0, Off: 0 } };
    }
    const todayReports = reports.filter((r) => r.dayIndex === todayIndex);
    const avgFatigue = todayReports.length
      ? Math.round(todayReports.reduce((sum, r) => sum + r.fatigueIndex, 0) / todayReports.length)
      : 0;
    const todayDay = schedule.days[todayIndex];
    const shiftCounts = {
      Morning: todayDay?.shifts["Morning"]?.length ?? 0,
      Afternoon: todayDay?.shifts["Afternoon"]?.length ?? 0,
      Night: todayDay?.shifts["Night"]?.length ?? 0,
      Off: todayDay?.shifts["Off"]?.length ?? 0,
    };
    return { avgFatigue, shiftCounts };
  }, [schedule, reports, todayIndex]);

  const employeeFatigue = useMemo(() => {
    const map = new Map<string, number>();
    const todayReports = reports.filter((r) => r.dayIndex === todayIndex);
    for (const r of todayReports) {
      map.set(r.employeeId, r.fatigueIndex);
    }
    return map;
  }, [reports, todayIndex]);

  const employeeViolations = useMemo(() => {
    const map = new Map<string, string[]>();
    const todayReports = reports.filter((r) => r.dayIndex === todayIndex);
    for (const r of todayReports) {
      if (r.violations.length > 0) {
        map.set(r.employeeId, r.violations.map((v) => v.rule));
      }
    }
    return map;
  }, [reports, todayIndex]);

  const redZoneEmployees = useMemo(() => {
    const set = new Set<string>();
    const todayReports = reports.filter((r) => r.dayIndex === todayIndex);
    for (const r of todayReports) {
      if (r.redZone) set.add(r.employeeId);
    }
    return set;
  }, [reports, todayIndex]);

  const getTodayShift = (employeeId: string): ShiftType => {
    if (!schedule) return "Off";
    const today = schedule.days[todayIndex];
    if (!today) return "Off";
    for (const s of ["Morning", "Afternoon", "Night", "Off"] as const) {
      if (today.shifts[s]?.includes(employeeId)) return s;
    }
    return "Off";
  };

  const getConsecutiveNights = (employeeId: string): number => {
    if (!schedule) return 0;
    let count = 0;
    for (let i = todayIndex; i >= 0; i--) {
      if (schedule.days[i]?.shifts["Night"]?.includes(employeeId)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  // Latest stress test result from archive
  const latestStressTest = useMemo(() => {
    const stressTests = archive.filter((e) => e.type === "stress_test" && e.stressTestResult);
    return stressTests.length > 0 ? stressTests[0].stressTestResult! : null;
  }, [archive]);

  if (!schedule) {
    return (
      <div className="stag-watermark animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time fatigue metrics and employee status
          </p>
        </div>
        <div className="liquid-glass flex items-center justify-center rounded-xl p-12">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 100 100" className="mx-auto mb-3 text-accent-teal/40">
              <path d="M50 8L56 28L72 18L62 34L80 32L66 42L84 50L64 50L74 62L54 52L54 72L46 72L46 52L26 62L36 50L16 50L34 42L20 32L38 34L28 18L44 28Z" fill="currentColor"/>
            </svg>
            <p className="text-sm text-text-muted">
              Generate a schedule first to see dashboard metrics
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stag-watermark animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time fatigue metrics and employee status
          </p>
        </div>
        {latestStressTest && (
          <div className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            latestStressTest.overallVerdict === "APPROVE"
              ? "bg-verd-approve-bg text-verd-approve"
              : latestStressTest.overallVerdict === "CAUTION"
                ? "bg-verd-caution-bg text-verd-caution"
                : "bg-verd-reject-bg text-verd-reject"
          }`}>
            Last Stress Test: {latestStressTest.overallVerdict}
          </div>
        )}
      </div>

      {/* Bright Data Operational Context Ticker */}
      <BrightDataTicker />

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Avg Fatigue Index"
          value={`${summary.avgFatigue}%`}
          sub="across all employees"
        />
        <SummaryCard
          label="Morning"
          value={summary.shiftCounts.Morning.toString()}
          sub="employees"
          accent="text-shift-morning-text"
        />
        <SummaryCard
          label="Afternoon"
          value={summary.shiftCounts.Afternoon.toString()}
          sub="employees"
          accent="text-shift-afternoon-text"
        />
        <SummaryCard
          label="Night"
          value={summary.shiftCounts.Night.toString()}
          sub="employees"
          accent="text-shift-night-text"
        />
      </div>

      {/* Employee cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {employees.map((emp) => {
          const fatigueVal = employeeFatigue.get(emp.id) ?? 0;
          const violations = employeeViolations.get(emp.id) ?? [];
          const isRedZone = redZoneEmployees.has(emp.id);
          const todayShift = getTodayShift(emp.id);
          const consecutiveNights = getConsecutiveNights(emp.id);

          return (
            <div
              key={emp.id}
              className="group liquid-glass rounded-xl p-4"
            >
              {/* Top row: avatar + name + role */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    ROLE_COLORS[emp.role] ?? "bg-bg-hover text-text-primary"
                  }`}
                >
                  {emp.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {emp.name}
                    </span>
                    {isRedZone && (
                      <span className="shrink-0 rounded bg-fatigue-red/20 px-1.5 py-0.5 text-[10px] font-semibold text-fatigue-red">
                        RED
                      </span>
                    )}
                    {violations.length > 0 && (
                      <span className="shrink-0 rounded bg-fatigue-amber/20 px-1.5 py-0.5 text-[10px] font-semibold text-fatigue-amber"
                            title={violations.join(", ")}>
                        ⚠
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted">{emp.role}</span>
                </div>
              </div>

              {/* Shift chip + consecutive nights */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    SHIFT_COLORS[todayShift] ?? ""
                  }`}
                >
                  {todayShift}
                </span>
                {todayShift === "Night" && (
                  <span className="text-[10px] text-text-muted">
                    {consecutiveNights}n
                  </span>
                )}
              </div>

              {/* Fatigue bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Fatigue</span>
                  <span className={`font-mono font-medium ${fatigueBarClass(fatigueVal).replace("bg-", "text-")}`}>
                    {fatigueVal}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${fatigueBarClass(fatigueVal)}`}
                    style={{ width: `${fatigueVal}%` }}
                  />
                </div>
                <span className="mt-0.5 block text-[10px] text-text-muted">
                  {fatigueLabel(fatigueVal)}
                </span>
              </div>

              {/* Violation flags */}
              {violations.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {violations.map((v, vi) => (
                    <p key={vi} className="text-[10px] text-fatigue-amber">
                      {v}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="liquid-glass rounded-xl p-4">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${accent ?? "text-text-primary"}`}>
        {value}
      </p>
      <p className="text-[10px] text-text-muted">{sub}</p>
    </div>
  );
}