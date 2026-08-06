import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppContext";
import { calculateFatigueReports, fatigueBarClass, fatigueLabel } from "../lib/fatigue";
import { fetchSolarData, getDefaultDateRange, lightExposureDescription } from "../lib/nasaPower";
import type { ShiftType } from "../types";
import StagIcon from "../components/StagIcon";
import { useState, useEffect } from "react";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SHIFT_LABELS: Record<string, { color: string; bg: string; label: string }> = {
  Morning: { color: "text-shift-morning-text", bg: "bg-shift-morning", label: "Morning" },
  Afternoon: { color: "text-shift-afternoon-text", bg: "bg-shift-afternoon", label: "Afternoon" },
  Night: { color: "text-shift-night-text", bg: "bg-shift-night", label: "Night" },
  Off: { color: "text-text-muted", bg: "bg-shift-off", label: "Off" },
};

// Demo employee — Amir Hassan (EMP-005)
const DEMO_EMPLOYEE_ID = "EMP-005";

export default function EmployeeView() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { employees, schedule } = state;

  const employee = employees.find((e) => e.id === DEMO_EMPLOYEE_ID);
  const [solarCalibration, setSolarCalibration] = useState(0.5);
  const [solarDesc, setSolarDesc] = useState("Loading solar data for personalised light guidance…");

  useEffect(() => {
    const { start, end } = getDefaultDateRange();
    fetchSolarData(-6.2088, 106.8456, start, end)
      .then((data) => {
        setSolarCalibration(data.lightExposureCalibration);
        setSolarDesc(lightExposureDescription(data.lightExposureCalibration));
      })
      .catch(() => {
        setSolarCalibration(0.5);
        setSolarDesc("Standard bright-light protocol applies — calibrating with default values.");
      });
  }, []);

  const reports = useMemo(() => {
    if (!schedule) return [];
    return calculateFatigueReports(employees, schedule).filter(
      (r) => r.employeeId === DEMO_EMPLOYEE_ID,
    );
  }, [employees, schedule]);

  // Get current day's fatigue
  const todayIdx = Math.max(0, new Date().getDay() - 1);
  const todayReport = reports.find((r) => r.dayIndex === todayIdx);
  const currentFatigue = todayReport?.fatigueIndex ?? 0;
  const isRedZone = todayReport?.redZone ?? false;

  // Get 7-day shift pattern
  const weekShifts = useMemo(() => {
    if (!schedule) return [];
    return schedule.days.map((day) => {
      for (const s of ["Morning", "Afternoon", "Night", "Off"] as const) {
        if (day.shifts[s]?.includes(DEMO_EMPLOYEE_ID)) return s;
      }
      return "Off" as ShiftType;
    });
  }, [schedule]);

  // Personal stats
  const stats = useMemo(() => {
    if (!employee || !schedule) return { nightShifts: 0, workDays: 0, consecutiveNights: 0, sleepDebt: 0 };

    const nightShifts = schedule.days.filter((d) =>
      d.shifts["Night"]?.includes(DEMO_EMPLOYEE_ID),
    ).length;

    const workDays = schedule.days.filter((d) =>
      (["Morning", "Afternoon", "Night"] as const).some((s) => d.shifts[s]?.includes(DEMO_EMPLOYEE_ID)),
    ).length;

    let consecutiveNights = 0;
    let maxConsecutive = 0;
    for (const day of schedule.days) {
      if (day.shifts["Night"]?.includes(DEMO_EMPLOYEE_ID)) {
        consecutiveNights++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveNights);
      } else {
        consecutiveNights = 0;
      }
    }

    return {
      nightShifts,
      workDays,
      consecutiveNights: maxConsecutive,
      sleepDebt: employee.sleep_debt_hours,
    };
  }, [employee, schedule]);

  if (!employee) {
    return (
      <div className="stag-watermark animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-chrome rounded-sm px-3 py-1.5 text-xs"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="liquid-glass flex items-center justify-center p-12">
          <p className="text-sm text-text-muted">Employee profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="btn-chrome rounded-sm px-3 py-1.5 text-xs"
        >
          ← Dashboard
        </button>
      </div>

      {/* Profile Header — Museum Placard Style */}
      <div className="paper-card relative overflow-hidden p-6">
        {/* Decorative stamp */}
        <div className="stamp-badge absolute right-4 top-4 border-rose/40 text-rose">
          EMPLOYEE
        </div>

        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-bg-elevated text-lg font-bold text-text-secondary">
            <StagIcon size={40} variant="glyph" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary">
              {employee.name}
            </h1>
            <p className="mt-0.5 text-sm text-text-secondary">{employee.role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose/60" />
                {employee.id}
              </span>
              <span className="text-text-muted/40">|</span>
              <span>{employee.skills.join(" · ")}</span>
              <span className="text-text-muted/40">|</span>
              <span className={employee.circadian_status.includes("Red") || employee.circadian_status.includes("Critical")
                ? "text-fatigue-red" : employee.circadian_status.includes("Yellow")
                  ? "text-fatigue-amber" : "text-fatigue-green"
              }>
                {employee.circadian_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fatigue Gauge + Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Fatigue Gauge */}
        <div className="paper-card col-span-1 p-5 sm:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-text-primary">Live Fatigue Index</h2>
            {isRedZone && (
              <span className="stamp-badge border-fatigue-red/50 text-fatigue-red">
                RED ZONE
              </span>
            )}
          </div>

          {/* Circular gauge */}
          <div className="flex items-center gap-6">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              {/* Background ring */}
              <svg width="112" height="112" viewBox="0 0 112 112" className="absolute">
                <circle cx="56" cy="56" r="48" fill="none"
                  stroke="currentColor" className="text-bg-elevated"
                  strokeWidth="8"
                />
                <circle cx="56" cy="56" r="48" fill="none"
                  stroke={
                    currentFatigue >= 75 ? "var(--color-fatigue-red)" :
                    currentFatigue >= 45 ? "var(--color-fatigue-amber)" :
                    "var(--color-fatigue-green)"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - currentFatigue / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 56 56)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className={`font-mono text-2xl font-bold ${
                currentFatigue >= 75 ? "text-fatigue-red" :
                currentFatigue >= 45 ? "text-fatigue-amber" :
                "text-fatigue-green"
              }`}>
                {currentFatigue}
                <span className="text-xs text-text-muted">%</span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Risk Level:</span>
                <span className={`font-semibold ${
                  currentFatigue >= 75 ? "text-fatigue-red" :
                  currentFatigue >= 45 ? "text-fatigue-amber" :
                  "text-fatigue-green"
                }`}>{fatigueLabel(currentFatigue)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Today's Shift:</span>
                <span className={`font-semibold ${
                  SHIFT_LABELS[weekShifts[todayIdx]]?.color ?? "text-text-muted"
                }`}>
                  {weekShifts[todayIdx] ?? "Off"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Sleep Debt:</span>
                <span className={`font-mono font-semibold ${
                  stats.sleepDebt > 8 ? "text-fatigue-red" :
                  stats.sleepDebt > 5 ? "text-fatigue-amber" :
                  "text-fatigue-green"
                }`}>{stats.sleepDebt.toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Circadian:</span>
                <span className={`font-semibold ${
                  employee.circadian_status.includes("Red") || employee.circadian_status.includes("Critical")
                    ? "text-fatigue-red" : employee.circadian_status.includes("Yellow")
                      ? "text-fatigue-amber" : "text-fatigue-green"
                }`}>{employee.circadian_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-3">
          <div className="paper-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">Night Shifts</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-shift-night-text">{stats.nightShifts}</p>
            <p className="text-[10px] text-text-muted">this week</p>
          </div>
          <div className="paper-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">Work Days</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">{stats.workDays}</p>
            <p className="text-[10px] text-text-muted">of 7</p>
          </div>
          <div className="paper-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">Max Consec Nights</p>
            <p className={`mt-1 font-mono text-2xl font-semibold ${
              stats.consecutiveNights > 3 ? "text-fatigue-red" : "text-text-primary"
            }`}>{stats.consecutiveNights}</p>
            <p className="text-[10px] text-text-muted">this week</p>
          </div>
        </div>
      </div>

      {/* 7-Day Roster */}
      <div className="paper-card p-5">
        <h2 className="font-heading text-sm font-semibold text-text-primary mb-4">My 7-Day Roster</h2>
        <div className="grid grid-cols-7 gap-2">
          {schedule?.days.map((_day, idx) => {
            const shift = weekShifts[idx];
            const dayReport = reports.find((r) => r.dayIndex === idx);
            const fi = dayReport?.fatigueIndex;
            const config = SHIFT_LABELS[shift!] ?? SHIFT_LABELS.Off;
            const isToday = idx === todayIdx;

            return (
              <div
                key={idx}
                className={`rounded-sm border p-3 text-center transition-all duration-150 ${
                  isToday
                    ? "border-rose/50 bg-rose/5 shadow-[2px_2px_0px_0px_rgba(232,180,184,0.2)]"
                    : "border-[#334155]/10 bg-white shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]"
                }`}
              >
                <p className={`text-[9px] font-semibold uppercase tracking-[0.08em] ${
                  isToday ? "text-rose" : "text-text-muted"
                }`}>
                  {DAY_NAMES[idx].slice(0, 3)}
                </p>
                <div className={`mt-2 rounded-sm py-2 ${config.bg}`}>
                  <p className={`text-xs font-semibold ${config.color}`}>
                    {config.label}
                  </p>
                </div>
                {fi !== undefined && (
                  <div className="mt-2">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className={`h-full rounded-full ${fatigueBarClass(fi)}`}
                        style={{ width: `${fi}%` }}
                      />
                    </div>
                    <p className={`mt-0.5 font-mono text-[9px] ${
                      fi >= 75 ? "text-fatigue-red" : "text-text-muted"
                    }`}>
                      FI {fi}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalised Light & Recovery Guidance */}
      <div className="paper-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
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
          <h2 className="font-heading text-sm font-semibold text-text-primary">
            Light & Recovery Guidance
          </h2>
          <span className="stamp-badge border-chrome/30 text-chrome-dark">NASA POWER</span>
        </div>

        <p className="mb-4 text-xs text-text-secondary">
          {solarDesc}
        </p>

        {/* Time-blocked advice cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <GuidanceCard
            period="Pre-Shift (21:00–22:00)"
            advice="Seek bright light exposure — 2000+ lux for 20–30 min"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
              </svg>
            }
            accent="text-accent-amber"
            bg="bg-[#FFFBEB]"
            border="border-accent-amber/20"
          />
          <GuidanceCard
            period="During Shift (22:00–06:00)"
            advice="Maintain moderate lighting; avoid blue-rich light after 03:00"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            }
            accent="text-accent-blue"
            bg="bg-[#EFF6FF]"
            border="border-accent-blue/20"
          />
          <GuidanceCard
            period="Post-Commute (06:00–08:00)"
            advice="Wear blue-blocker glasses; dim screens; prepare for sleep"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            }
            accent="text-fatigue-red"
            bg="bg-[#FEF2F2]"
            border="border-fatigue-red/20"
          />
        </div>

        {/* Recovery recommendations */}
        <div className="mt-4 rounded-sm border border-[#334155]/10 bg-bg-elevated/50 p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            Recovery Protocol
          </h3>
          <ul className="space-y-1.5">
            {employee.sleep_debt_hours > 5 && (
              <li className="flex items-start gap-2 text-[11px] text-fatigue-amber">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>Sleep debt of {employee.sleep_debt_hours}h is elevated — aim for 8h+ core sleep before next shift</span>
              </li>
            )}
            {employee.circadian_status.toLowerCase().includes("critical") && (
              <li className="flex items-start gap-2 text-[11px] text-fatigue-red">
                <span className="mt-0.5 shrink-0">🔴</span>
                <span>Critical fatigue detected — consider requesting a reassignment to a non-night shift</span>
              </li>
            )}
            {stats.consecutiveNights > 3 && (
              <li className="flex items-start gap-2 text-[11px] text-fatigue-red">
                <span className="mt-0.5 shrink-0">🔴</span>
                <span>{stats.consecutiveNights} consecutive night shifts — mandatory 48h recovery period after last night shift</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-[11px] text-text-secondary">
              <span className="mt-0.5 shrink-0 text-rose">●</span>
              <span>Nadir window bright-light protocol active — follow pre-shift light exposure schedule</span>
            </li>
            <li className="flex items-start gap-2 text-[11px] text-text-secondary">
              <span className="mt-0.5 shrink-0 text-rose">●</span>
              <span>Hydration & nutrition break recommended every 4h during Nadir window operations</span>
            </li>
          </ul>
        </div>

        {/* NASA POWER calibration badge */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
          <span className="text-chrome">◆</span>
          <span>Solar calibration: {(solarCalibration * 100).toFixed(0)}% — NexaGlobal Air-Hub ({-6.2088}, {106.8456})</span>
          <span className="text-chrome">◆</span>
          <span>Powered by NASA POWER satellite data</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted/50">
        <span>NADIRPOISE v2.0 · EMPLOYEE PORTAL · {new Date().toISOString().slice(0, 10)}</span>
        <span>NEXAGLOBAL AIR-HUB · CGK</span>
      </div>
    </div>
  );
}

function GuidanceCard({
  period,
  advice,
  icon,
  accent,
  bg,
  border,
}: {
  period: string;
  advice: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-sm border p-4 ${bg} ${border} shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${accent}`}>
          {period}
        </span>
      </div>
      <p className="text-[11px] text-text-secondary">{advice}</p>
    </div>
  );
}