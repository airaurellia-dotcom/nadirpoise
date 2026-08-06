import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppContext";
import { type Schedule, type DayPlan, type ShiftType } from "../types";
import { calculateFatigueReports, fatigueBarClass } from "../lib/fatigue";
import { generateSchedule } from "../lib/schedule";
import {
  fetchSolarData,
  getDefaultDateRange,
  lightExposureDescription,
  type SolarData,
} from "../lib/nasaPower";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS: ShiftType[] = ["Morning", "Afternoon", "Night"];

// NexaGlobal Air-Hub demo location (Jakarta, Indonesia)
const AIRHUB_LAT = -6.2088;
const AIRHUB_LON = 106.8456;

interface ScheduleViolation {
  employeeId: string;
  employeeName: string;
  day: string;
  shift: ShiftType;
  rule: string;
  fatigueIndex?: number;
  redZone?: boolean;
}

export default function ScheduleGenerator() {
  const { state, setSchedule, setCurrentSchedule } = useAppState();
  const { employees, schedule } = state;
  const navigate = useNavigate();

  const [violations, setViolations] = useState<ScheduleViolation[]>([]);
  const [showViolationPanel, setShowViolationPanel] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  // ── NASA POWER light-exposure calibration ──
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [solarLoading, setSolarLoading] = useState(true);
  const [solarError, setSolarError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { start, end } = getDefaultDateRange();
    fetchSolarData(AIRHUB_LAT, AIRHUB_LON, start, end)
      .then((data) => {
        if (!cancelled) {
          setSolarData(data);
          setSolarError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSolarError("Couldn't reach the NASA POWER solar data service.");
        }
      })
      .finally(() => {
        if (!cancelled) setSolarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute all reports when schedule changes
  const reportsByDay = useMemo(() => {
    if (!schedule) return [];
    const reports = calculateFatigueReports(employees, schedule);
    const byDay: Map<number, typeof reports> = new Map();
    for (const r of reports) {
      const existing = byDay.get(r.dayIndex) ?? [];
      existing.push(r);
      byDay.set(r.dayIndex, existing);
    }
    return schedule.days.map((_, idx) => byDay.get(idx) ?? []);
  }, [employees, schedule]);

  // Derive violations
  useEffect(() => {
    if (!schedule) {
      setViolations([]);
      return;
    }
    const allViolations: ScheduleViolation[] = [];
    for (const dayPlan of schedule.days) {
      for (const shiftType of SHIFTS) {
        const empIds = dayPlan.shifts[shiftType] ?? [];
        for (const empId of empIds) {
          const emp = employees.find((e) => e.id === empId);
          const dayReports = reportsByDay[schedule.days.indexOf(dayPlan)];
          const empReports = dayReports.filter((r) => r.employeeId === empId);
          for (const r of empReports) {
            for (const v of r.violations) {
              allViolations.push({
                employeeId: empId,
                employeeName: emp?.name ?? empId,
                day: DAY_NAMES[r.dayIndex],
                shift: shiftType,
                rule: v.rule,
                fatigueIndex: r.fatigueIndex,
                redZone: r.redZone,
              });
            }
          }
        }
      }
    }
    setViolations(allViolations);
  }, [schedule, employees, reportsByDay]);

  const handleGenerate = useCallback(() => {
    const newSchedule = generateSchedule(employees);
    setSchedule(newSchedule);
    setCurrentSchedule(newSchedule);

    // Scroll to schedule
    setTimeout(() => {
      scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [employees, setSchedule, setCurrentSchedule]);

  const handleRunStressTest = useCallback(() => {
    navigate("/stress-test");
  }, [navigate]);

  // Toggle employee in a shift
  const handleToggleEmployeeInShift = useCallback(
    (dayIdx: number, shiftType: ShiftType, employeeId: string) => {
      if (!schedule) return;
      const newDays = schedule.days.map((day, idx) => {
        if (idx !== dayIdx) return day;
        const shifts = { ...day.shifts };
        for (const s of SHIFTS) {
          const list = [...(shifts[s] ?? [])];
          if (s === shiftType) {
            const existingIdx = list.indexOf(employeeId);
            if (existingIdx >= 0) {
              list.splice(existingIdx, 1);
            } else {
              for (const otherS of SHIFTS) {
                if (otherS !== s) {
                  const oIdx = shifts[otherS]?.indexOf(employeeId);
                  if (oIdx != null && oIdx >= 0) {
                    shifts[otherS] = [...(shifts[otherS] ?? [])];
                    shifts[otherS]?.splice(oIdx, 1);
                  }
                }
              }
              list.push(employeeId);
            }
          }
          shifts[s] = list;
        }
        return { ...day, shifts };
      });
      const newSchedule: Schedule = { ...schedule, days: newDays };
      setCurrentSchedule(newSchedule);
      setSchedule(newSchedule);
    },
    [schedule, setSchedule, setCurrentSchedule],
  );

  // Group violations by employee
  const violationsByEmployee = useMemo(() => {
    const map = new Map<string, ScheduleViolation[]>();
    for (const v of violations) {
      const list = map.get(v.employeeId) ?? [];
      list.push(v);
      map.set(v.employeeId, list);
    }
    return map;
  }, [violations]);

  if (!schedule) {
    return (
      <div className="stag-watermark animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Schedule Generator</h1>
            <p className="text-sm text-text-secondary mt-1">
              Generate and manually adjust weekly shift rosters
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="liquid-glass rounded-lg px-4 py-2 text-sm font-medium text-text-primary transition-all duration-150 active:scale-[0.97] hover:brightness-110"
          >
            Generate Schedule
          </button>
        </div>
        <div className="liquid-glass flex items-center justify-center rounded-xl p-12">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 100 100" className="mx-auto mb-3 text-accent-teal/40">
              <path d="M50 8L56 28L72 18L62 34L80 32L66 42L84 50L64 50L74 62L54 52L54 72L46 72L46 52L26 62L36 50L16 50L34 42L20 32L38 34L28 18L44 28Z" fill="currentColor"/>
            </svg>
            <p className="text-sm text-text-muted">No schedule generated yet. Click "Generate Schedule" to start.</p>
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
          <h1 className="text-xl font-semibold tracking-tight">Schedule Generator</h1>
          <p className="text-sm text-text-secondary mt-1">
            Click any cell to toggle an employee — changes apply immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {violations.length > 0 && (
            <button
              onClick={() => setShowViolationPanel(!showViolationPanel)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                showViolationPanel
                  ? "bg-fatigue-red text-white"
                  : "border border-fatigue-red/40 bg-fatigue-red/10 text-fatigue-red"
              }`}
            >
              ⚠ {violations.length} Violation{violations.length !== 1 ? "s" : ""}
            </button>
          )}
          {/* Run Stress Test button — always visible when schedule exists */}
          <button
            onClick={handleRunStressTest}
            className="liquid-glass rounded-lg px-4 py-2 text-sm font-medium text-accent-teal transition-all duration-150 active:scale-[0.97] hover:brightness-110"
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Run Stress Test
            </span>
          </button>
          <button
            onClick={handleGenerate}
            className="liquid-glass rounded-lg px-4 py-2 text-sm font-medium text-text-primary transition-all duration-150 active:scale-[0.97] hover:brightness-110"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Violation panel */}
      {showViolationPanel && (
        <div className="rounded-xl border border-fatigue-red/30 bg-fatigue-red/5 p-4">
          <h3 className="text-sm font-semibold text-fatigue-red">Schedule Violations / Red Zone Flags</h3>
          <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
            {violations.map((v, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-text-primary">
                <span className="shrink-0 font-medium text-text-secondary">{v.employeeName}</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{v.day}</span>
                <span className="text-text-muted">·</span>
                <span className="text-shift-night-text">{v.shift}</span>
                <span className="text-fatigue-amber">⚠ {v.rule}</span>
                {v.redZone && (
                  <span className="rounded bg-fatigue-red/20 px-1.5 py-0.5 text-[10px] font-bold text-fatigue-red">
                    RED ZONE (FI: {v.fatigueIndex}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Light exposure calibration panel — NASA POWER */}
      <div className="rounded-xl border border-glass-border bg-glass-bg/40 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M6.34 17.66l-1.41 1.41" />
                <path d="M19.07 4.93l-1.41 1.41" />
              </svg>
              Light Exposure Calibration
              <span className="rounded border border-glass-border/60 px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wider text-text-muted">
                NASA POWER
              </span>
            </h3>
            <p className="mt-0.5 text-[10px] text-text-muted">
              Solar radiation data for NexaGlobal Air-Hub ({AIRHUB_LAT}, {AIRHUB_LON})
            </p>
          </div>

          {/* Status badge */}
          {solarLoading && (
            <span className="flex items-center gap-1.5 rounded-lg border border-glass-border px-2.5 py-1 text-[10px] text-text-muted">
              <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-text-muted border-t-transparent" />
              Fetching solar data…
            </span>
          )}
          {!solarLoading && solarError && (
            <span className="rounded-lg border border-fatigue-amber/30 bg-fatigue-amber/10 px-2.5 py-1 text-[10px] text-fatigue-amber">
              Offline — using default calibration
            </span>
          )}
          {!solarLoading && solarData && (
            <span className="rounded-lg border border-glass-border bg-bg-surface/50 px-2.5 py-1 text-[10px] font-mono text-text-secondary">
              ☀ {solarData.averageRadiation.toFixed(1)} MJ/m²/day
            </span>
          )}
        </div>

        {/* Calibrated recommendation */}
        <div className="mt-3 rounded-lg border border-accent-amber/20 bg-accent-amber/5 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                Light Index
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-hover">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-amber/40 to-accent-amber transition-all duration-500"
                  style={{ width: `${solarData ? Math.round(solarData.lightExposureCalibration * 100) : 50}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-accent-amber">
                {solarData ? Math.round(solarData.lightExposureCalibration * 100) : "—"}%
              </span>
            </div>
            <p className="flex-1 min-w-[200px] text-[11px] text-text-secondary">
              {solarData
                ? lightExposureDescription(solarData.lightExposureCalibration)
                : solarError
                  ? "Live calibration unavailable — showing standard bright-light protocol (Rule 6)."
                  : "Waiting for solar radiation data to calibrate light-exposure guidance…"}
            </p>
          </div>
        </div>

        {/* Per-day solar radiation strip */}
        {solarData && solarData.days.length > 0 && (
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {solarData.days.slice(0, 7).map((day, i) => {
              const rad = day.solarRadiation;
              const pct = rad !== null ? Math.min(100, Math.round((rad / 25) * 100)) : 0;
              return (
                <div key={day.date} className="rounded-lg border border-glass-border/50 bg-bg-surface/40 p-1.5 text-center">
                  <p className="text-[9px] font-medium uppercase tracking-wide text-text-muted">
                    {DAY_NAMES[i]?.slice(0, 3)}
                  </p>
                  <div className="mx-auto mt-1 h-8 w-1.5 overflow-hidden rounded-full bg-bg-hover">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${
                        pct >= 60 ? "bg-accent-amber" : pct >= 30 ? "bg-accent-amber/50" : "bg-text-muted/40"
                      }`}
                      style={{ height: `${pct}%`, alignSelf: "flex-end" }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-text-muted">
                    {rad !== null ? `${rad.toFixed(1)}` : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule grid */}
      <div ref={scheduleRef} className="overflow-x-auto rounded-xl border border-glass-border bg-glass-bg backdrop-blur-md">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-glass-border bg-bg-surface/80 px-3 py-2 text-xs font-semibold text-text-secondary backdrop-blur-md">
                Employee
              </th>
              {DAY_NAMES.map((day) => (
                <th
                  key={day}
                  className="border-b border-glass-border bg-bg-surface/80 px-2 py-2 text-center text-xs font-semibold text-text-secondary backdrop-blur-md"
                >
                  <div>{day.slice(0, 3)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const empViolations = violationsByEmployee.get(emp.id) ?? [];
              const violationCount = empViolations.length;
              return (
                <tr key={emp.id} className="group border-b border-glass-border last:border-0 hover:bg-bg-hover/20">
                  <td className="sticky left-0 z-10 border-r border-glass-border bg-bg-surface/60 px-3 py-2 backdrop-blur-sm group-hover:bg-bg-hover/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">{emp.name}</span>
                      {violationCount > 0 && (
                        <span className="shrink-0 rounded-full bg-fatigue-amber/20 px-1.5 text-[10px] font-bold text-fatigue-amber">
                          {violationCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted">{emp.role}</div>
                  </td>
                  {schedule.days.map((day, dayIdx) => (
                    <td key={dayIdx} className="border-r border-glass-border p-1 last:border-r-0">
                      <ShiftCell
                        day={day}
                        employeeId={emp.id}
                        reports={reportsByDay[dayIdx]?.filter((r) => r.employeeId === emp.id) ?? []}
                        onToggle={(shiftType) => handleToggleEmployeeInShift(dayIdx, shiftType, emp.id)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-shift-morning" />
          Morning
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-shift-afternoon" />
          Afternoon
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-shift-night" />
          Night
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-glass-border bg-transparent" />
          Off
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-fatigue-red" />
          Red Zone (≥75% FI)
        </span>
      </div>
    </div>
  );
}

/** Individual shift cell */
function ShiftCell({
  day,
  employeeId,
  reports,
  onToggle,
}: {
  day: DayPlan;
  employeeId: string;
  reports: { fatigueIndex: number; redZone: boolean; violations: { rule: string }[] }[];
  onToggle: (shiftType: ShiftType) => void;
}) {
  const assignedShift = (["Morning", "Afternoon", "Night", "Off"] as const).find(
    (s) => day.shifts[s]?.includes(employeeId),
  );
  const fatigueVal = reports.length > 0 ? reports[0].fatigueIndex : undefined;
  const isRedZone = reports.some((r) => r.redZone);
  const hasViolations = reports.some((r) => r.violations.length > 0);

  if (!assignedShift || assignedShift === "Off") {
    return (
      <div className="flex h-16 w-full items-center justify-center">
        <span className="text-[10px] text-text-muted">—</span>
      </div>
    );
  }

  const bgMap: Record<string, string> = {
    Morning: "bg-shift-morning/20",
    Afternoon: "bg-shift-afternoon/20",
    Night: "bg-shift-night/20",
  };

  return (
    <div
      className={`relative flex h-16 w-full flex-col justify-center rounded-lg px-2 py-1 transition-all duration-150 ${bgMap[assignedShift] ?? ""} cursor-pointer hover:brightness-110 active:scale-[0.97]`}
      onClick={() => onToggle(assignedShift)}
      title="Click to remove from this shift"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle(assignedShift);
      }}
    >
      <span className="text-[11px] font-medium text-text-primary">{assignedShift}</span>
      {fatigueVal != null && (
        <div className="mt-0.5 flex items-center gap-1">
          <div className="h-1 w-full max-w-[40px] overflow-hidden rounded-full bg-bg-hover">
            <div
              className={`h-full rounded-full ${fatigueBarClass(fatigueVal)}`}
              style={{ width: `${fatigueVal}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono ${fatigueVal >= 75 ? "text-fatigue-red" : "text-text-muted"}`}>
            {fatigueVal}
          </span>
        </div>
      )}
      {(isRedZone || hasViolations) && (
        <div className="mt-0.5 flex items-center gap-1">
          {isRedZone && <span className="rounded bg-fatigue-red/20 px-1 text-[9px] font-bold text-fatigue-red">RZ</span>}
          {hasViolations && <span className="text-[9px] text-fatigue-amber">⚠</span>}
        </div>
      )}
    </div>
  );
}