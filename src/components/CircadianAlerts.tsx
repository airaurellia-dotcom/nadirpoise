import { useState, useEffect, useCallback } from "react";
import { useAppState } from "../context/AppContext";
import type { ShiftType } from "../types";

const DEMO_EMPLOYEE_ID = "EMP-005";

interface CircadianAlert {
  id: string;
  type: "pre_shift" | "caffeine_cutoff" | "post_shift";
  title: string;
  message: string;
  timestamp: string;
  urgency: "low" | "medium" | "high";
  acknowledged: boolean;
}

function generateAlerts(
  todayShift: ShiftType,
  isRedZone: boolean,
  sleepDebt: number,
  consecutiveNights: number,
): CircadianAlert[] {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const alerts: CircadianAlert[] = [];

  // 1. Pre-Shift Alert (active when night shift starts in ~3h window: 19:00–22:00)
  if (todayShift === "Night" && hour >= 19 && hour <= 22) {
    const hUntil = 22 - hour;
    alerts.push({
      id: "pre-shift",
      type: "pre_shift",
      title: "Pre-Shift Light Exposure",
      message: `Night shift starts in ${hUntil > 0 ? `${hUntil}h ` : ""}— Get 20 mins of 2000+ lux light exposure now.`,
      timestamp: timeStr,
      urgency: "high",
      acknowledged: false,
    });
  }

  // 2. Caffeine Cut-off (active during night shift, before 01:30)
  if (todayShift === "Night" && hour >= 22 && hour < 26 && (hour < 1 || (hour === 1 && minute < 30))) {
    alerts.push({
      id: "caffeine-cutoff",
      type: "caffeine_cutoff",
      title: "Caffeine Window Closing",
      message: "Caffeine window closes at 01:30 — switch to water to preserve recovery sleep.",
      timestamp: timeStr,
      urgency: "medium",
      acknowledged: false,
    });
  }

  // 3. Post-Shift Recovery (active after night shift ends: 06:00–08:00)
  if (todayShift === "Night" && hour >= 6 && hour <= 8) {
    alerts.push({
      id: "post-shift",
      type: "post_shift",
      title: isRedZone ? "Critical Fatigue Alert" : "Post-Shift Recovery",
      message: isRedZone
        ? "Critical Fatigue Alert: Wear blue-blocker glasses on your commute home (06:00)."
        : "Shift complete — dim screens, hydrate, and aim for 8h core sleep.",
      timestamp: timeStr,
      urgency: "high",
      acknowledged: false,
    });
  }

  // 4. Sleep Debt Warning (always active if sleep debt is high)
  if (sleepDebt > 5 && hour >= 20 && hour <= 23) {
    alerts.push({
      id: "sleep-debt",
      type: "pre_shift",
      title: "Sleep Debt Recovery",
      message: `Sleep debt of ${sleepDebt.toFixed(1)}h — head to bed early to reduce next-shift fatigue risk.`,
      timestamp: timeStr,
      urgency: "medium",
      acknowledged: false,
    });
  }

  // 5. Consecutive Nights Warning
  if (consecutiveNights > 3 && hour >= 0 && hour <= 6) {
    alerts.push({
      id: "consec-nights",
      type: "post_shift",
      title: "Consecutive Night Risk",
      message: `${consecutiveNights} nights in a row — mandatory 48h recovery period starts after last shift.`,
      timestamp: timeStr,
      urgency: "medium",
      acknowledged: false,
    });
  }

  return alerts;
}

export default function CircadianAlerts({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { state } = useAppState();
  const { employees, schedule } = state;

  const employee = employees.find((e) => e.id === DEMO_EMPLOYEE_ID);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Derive today's shift
  const todayIdx = Math.max(0, new Date().getDay() - 1);
  const todayShift: ShiftType =
    (schedule?.days[todayIdx] && (
      ["Morning", "Afternoon", "Night", "Off"] as const
    ).find((s) => schedule.days[todayIdx]!.shifts[s]?.includes(DEMO_EMPLOYEE_ID))) ?? "Off";

  const sleepDebt = employee?.sleep_debt_hours ?? 0;
  const isRedZone = employee?.circadian_status.toLowerCase().includes("critical") ?? false;
  const consecutiveNights = employee?.consecutive_night_shifts ?? 0;

  // Regenerate alerts every 60 seconds so timestamps update
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const alerts = generateAlerts(todayShift, isRedZone, sleepDebt, consecutiveNights).filter(
    (a) => !acknowledgedIds.has(a.id),
  );

  const handleAcknowledge = useCallback((id: string) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
  }, []);

  if (alerts.length === 0 && !compact) {
    return (
      <div className="paper-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
            <path d="M8 21h8" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            Circadian Notifications
          </h3>
        </div>
        <p className="text-xs text-text-muted italic">
          No active alerts right now. New notifications will appear here based on your shift schedule.
        </p>
      </div>
    );
  }

  if (compact && alerts.length === 0) return null;

  return (
    <div className={compact ? "" : "paper-card p-4"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-amber">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
            <path d="M8 21h8" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            Circadian Alerts
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-amber text-[10px] font-bold text-white">
            {alerts.length}
          </span>
        </div>
      )}

      <div className={compact ? "space-y-2" : "space-y-2.5"}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-sm border-l-2 p-3 text-left transition-all duration-150 ${
              alert.urgency === "high"
                ? "border-l-fatigue-red bg-[#FEF2F2]"
                : "border-l-accent-amber bg-[#FFFBEB]"
            } border border-[#334155]/10 ${
              compact ? "shadow-none" : "shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]"
            }`}
          >
            {/* Header — like a Telegram receipt */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Pager-style indicator */}
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    alert.urgency === "high"
                      ? "animate-pulse bg-fatigue-red"
                      : "bg-accent-amber"
                  }`}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-primary">
                  {alert.title}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[9px] text-text-muted">
                {alert.timestamp}
              </span>
            </div>

            {/* Message body */}
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">
              {alert.message}
            </p>

            {/* Acknowledge button — vintage telegraph style */}
            <button
              onClick={() => handleAcknowledge(alert.id)}
              className="mt-2 inline-flex items-center gap-1 rounded-sm border border-[#334155]/15 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-text-muted transition-all duration-150 hover:bg-bg-hover hover:text-text-primary active:scale-[0.97]"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Acknowledge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}