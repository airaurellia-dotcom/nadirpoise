import type { Employee, Schedule, FatigueReport, ShiftType } from "../types";

/**
 * Calculate Fatigue Index and violations for every employee across a 7-day schedule.
 *
 * Compliance Rules checked:
 *   Rule 1 — Max 48 hours work per employee per week
 *   Rule 2 — Minimum 11 continuous hours rest per 24-hour period
 *   Rule 3 — Minimum 1 full 24-hour rest day per 7-day cycle
 *   Rule 4 — Max 3 consecutive night shifts before mandatory 48-hour reset
 *   Rule 5 — Prefer clockwise rotation (Morning -> Afternoon -> Night)
 *   Rule 6 — Mandatory bright-light exposure flag at night-shift start
 *   Rule 7 — Blue-light blocking / dim light recommendation flag on commute home
 *
 * Fatigue Index formula (Rule 8):
 *   Base: Night=30, Afternoon=10, Morning=5, Off=-15
 *   +25% per consecutive night shift without 48h reset (Rule 8)
 *   Fatigue carries forward: current_day * 0.6 + base * 0.4
 *
 * Rule 9 — Fatigue Index >= 75% triggers Red Zone flag
 */
export function calculateFatigueReports(
  employees: Employee[],
  schedule: Schedule,
): FatigueReport[] {
  const reports: FatigueReport[] = [];

  for (const emp of employees) {
    // Track consecutive nights for Rule 4 / Rule 8
    let consecutiveNights = 0;
    let lastNightShiftDay = -99; // day index of last night shift

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const day = schedule.days[dayIdx];
      let shift: ShiftType = "Off";

      for (const s of ["Morning", "Afternoon", "Night", "Off"] as const) {
        if (day.shifts[s]?.includes(emp.id)) {
          shift = s;
          break;
        }
      }

      // ── Consecutive night tracking (Rule 4 / Rule 8) ──
      if (shift === "Night") {
        consecutiveNights++;
        lastNightShiftDay = dayIdx;
      } else {
        // Reset consecutive nights after a 48-hour break (2+ days without Night)
        if (dayIdx - lastNightShiftDay >= 2) {
          consecutiveNights = 0;
        }
      }

      // ── Fatigue Index (Rule 8) ──
      let base =
        shift === "Night" ? 30 :
        shift === "Afternoon" ? 10 :
        shift === "Morning" ? 5 :
        -15;

      // +25% per consecutive night shift without 48h reset (Rule 8)
      if (shift === "Night" && consecutiveNights > 1) {
        const multiplier = 1 + (consecutiveNights - 1) * 0.25;
        base = Math.round(base * multiplier);
      }

      // Fatigue carries forward (smoothing)
      let fatigueIndex = base;
      if (dayIdx > 0) {
        const prev = reports.find(
          (r) => r.employeeId === emp.id && r.dayIndex === dayIdx - 1,
        );
        if (prev) {
          fatigueIndex = Math.round(prev.fatigueIndex * 0.6 + base * 0.4);
        }
      }

      // Clamp 0–100
      fatigueIndex = Math.max(0, Math.min(100, fatigueIndex));

      // Rule 9 — Red Zone if >= 75%
      const redZone = fatigueIndex >= 75;

      // ── Determine violations ──
      const violations: { rule: string; message: string }[] = [];

      // Rule 1 — Max 48h/week
      if (dayIdx === 6) {
        // On the last day, check total weekly hours
        const totalHours = countWeeklyHours(emp.id, schedule, 0, 6);
        if (totalHours > 48) {
          violations.push({
            rule: "Rule 1",
            message: `Exceeds 48h/week (${totalHours}h scheduled)`,
          });
        }
      }

      // Rule 2 — Minimum 11h rest between shifts
      if (dayIdx > 0) {
        const prevDay = schedule.days[dayIdx - 1];
        const prevShift = findEmployeeShift(emp.id, prevDay);
        if (
          (prevShift === "Night" && (shift === "Morning" || shift === "Afternoon")) ||
          (prevShift === "Afternoon" && shift === "Morning")
        ) {
          violations.push({
            rule: "Rule 2",
            message: `Less than 11h rest: ${prevShift}→${shift}`,
          });
        }
      }

      // Rule 3 — Minimum 1 rest day per 7-day cycle
      if (dayIdx === 6) {
        const hasOffDay = schedule.days.some((d) =>
          d.shifts["Off"]?.includes(emp.id),
        );
        if (!hasOffDay) {
          violations.push({
            rule: "Rule 3",
            message: "No full 24h rest day in this 7-day cycle",
          });
        }
      }

      // Rule 4 — Max 3 consecutive nights without 48h reset
      if (shift === "Night" && consecutiveNights > 3) {
        violations.push({
          rule: "Rule 4",
          message: `${consecutiveNights} consecutive night shifts — mandatory 48h reset required`,
        });
      }

      // Rule 5 — Clockwise rotation preference (advisory)
      if (dayIdx > 0) {
        const prevDay = schedule.days[dayIdx - 1];
        const prevShift = findEmployeeShift(emp.id, prevDay);
        if (prevShift && prevShift !== "Off" && shift !== "Off") {
          const rotationOrder: ShiftType[] = ["Morning", "Afternoon", "Night"];
          const prevIdx = rotationOrder.indexOf(prevShift as any);
          const currIdx = rotationOrder.indexOf(shift as any);
          if (prevIdx >= 0 && currIdx >= 0 && currIdx < prevIdx) {
            // Counter-clockwise (e.g., Night → Afternoon, Afternoon → Morning)
            violations.push({
              rule: "Rule 5",
              message: `Counter-clockwise rotation: ${prevShift}→${shift}`,
            });
          }
        }
      }

      // Rule 6 — Bright-light exposure at night-shift start
      if (shift === "Night") {
        violations.push({
          rule: "Rule 6",
          message: "Bright-light exposure recommended at night-shift start",
        });
      }

      // Rule 7 — Dim-light / blue-light blocking recommendation for post-night commute
      if (dayIdx > 0 && (shift === "Morning" || shift === "Afternoon")) {
        const prevDay = schedule.days[dayIdx - 1];
        if (prevDay.shifts["Night"]?.includes(emp.id)) {
          violations.push({
            rule: "Rule 7",
            message: "Blue-light blocking / dim light recommended for post-night-shift commute home",
          });
        }
      }

      reports.push({
        employeeId: emp.id,
        dayIndex: dayIdx,
        shift,
        fatigueIndex,
        redZone,
        violations,
      });
    }
  }

  return reports;
}

/** Count total weekly work hours for an employee (each shift = 8h). */
function countWeeklyHours(
  empId: string,
  schedule: Schedule,
  startDay: number,
  endDay: number,
): number {
  let hours = 0;
  for (let i = startDay; i <= endDay; i++) {
    const day = schedule.days[i];
    for (const s of ["Morning", "Afternoon", "Night"] as const) {
      if (day.shifts[s]?.includes(empId)) {
        hours += 8;
      }
    }
  }
  return hours;
}

/** Find which shift an employee is assigned on a given day. */
function findEmployeeShift(empId: string, day: { shifts: Record<string, string[]> }): ShiftType | null {
  for (const s of ["Morning", "Afternoon", "Night", "Off"] as const) {
    if (day.shifts[s]?.includes(empId)) return s;
  }
  return null;
}

/**
 * Get a Tailwind-compatible class for the fatigue bar.
 */
export function fatigueBarClass(value: number): string {
  if (value <= 33) return "bg-fatigue-green";
  if (value <= 66) return "bg-fatigue-amber";
  return "bg-fatigue-red";
}

/**
 * Get a human-readable label for a fatigue value.
 */
export function fatigueLabel(value: number): string {
  if (value <= 33) return "Low";
  if (value <= 66) return "Moderate";
  return "High";
}

/**
 * Get a Tailwind text color class for a fatigue value.
 */
export function fatigueTextClass(value: number): string {
  if (value <= 33) return "text-fatigue-green";
  if (value <= 66) return "text-fatigue-amber";
  return "text-fatigue-red";
}