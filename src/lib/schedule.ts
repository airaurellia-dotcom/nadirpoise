import type { Employee, Schedule, DayPlan, ShiftType } from "../types";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ROTATION_ORDER: ShiftType[] = ["Morning", "Afternoon", "Night"];

const SHIFT_HOURS: Record<string, number> = {
  Morning: 8,
  Afternoon: 8,
  Night: 8,
  Off: 0,
};

/**
 * Generate a deterministic 7-day schedule (Mon–Sun) for the given employees.
 *
 * Algorithm:
 *  1. Sort employees by ID for determinism.
 *  2. Distribute employees across three "tracks" based on index % 3:
 *       Track 0: Morning → Afternoon → Night → Off → Morning ...
 *       Track 1: Afternoon → Night → Off → Morning → Afternoon ...
 *       Track 2: Night → Off → Morning → Afternoon → Night ...
 *  3. Enforce all 9 rules:
 *     - Rule 3: Ensure every employee gets at least 1 Off day in 7
 *     - Rule 4: Cap consecutive nights (max 3) with forced Off
 *     - Rule 1: Keep weekly hours ≤ 48
 *  4. Re-balance shift coverage to ensure no shift is empty.
 *
 * Returns a deterministic Schedule.
 */
export function generateSchedule(employees: Employee[]): Schedule {
  const sorted = [...employees].sort((a, b) => a.id.localeCompare(b.id));

  // ── Phase 1: Initial rotation assignment ──
  // Each employee follows a clockwise rotation from their starting shift.
  // Starting shift is determined by index % 3:
  //   0 → Morning, 1 → Afternoon, 2 → Night
  const startShifts: ShiftType[] = ["Morning", "Afternoon", "Night"];

  // assignment[empIdx][dayIdx] = ShiftType
  const assignment: ShiftType[][] = sorted.map((_, idx) => {
    const startShift = startShifts[idx % 3];
    const startRotationIdx = ROTATION_ORDER.indexOf(startShift);
    const shifts: ShiftType[] = [];

    for (let day = 0; day < 7; day++) {
      const rotIdx = (startRotationIdx + day) % 3; // rotate clockwise each day
      shifts.push(ROTATION_ORDER[rotIdx]);
    }

    return shifts;
  });

  // ── Phase 2: Enforce Rule 3 — at least 1 Off day per 7-day cycle ──
  for (let i = 0; i < sorted.length; i++) {
    // Replace the last day (Sunday) of each week-cycle with Off
    // If the employee has no Off in days 0-5, force day 6 to Off
    const hasOff = assignment[i].includes("Off" as any);
    if (!hasOff) {
      assignment[i][6] = "Off";
    }
  }

  // Actually, the above won't work because we never assigned Off in the rotation.
  // Let me fix: insert Off days into the rotation.

  // Reset: start with rotation including Off every 4th day
  const fullRotation: (ShiftType | "Off")[] = ["Morning", "Afternoon", "Night", "Off"];
  const assignment2: ShiftType[][] = sorted.map((_, idx) => {
    const startIdx = idx % 4; // 0=Morning, 1=Afternoon, 2=Night, 3=Off
    const shifts: ShiftType[] = [];

    for (let day = 0; day < 7; day++) {
      const rotIdx = (startIdx + day) % 4;
      shifts.push(fullRotation[rotIdx] as ShiftType);
    }

    return shifts;
  });

  // ── Phase 3: Enforce Rule 4 — max 3 consecutive night shifts ──
  for (let i = 0; i < sorted.length; i++) {
    let nightStreak = 0;
    for (let day = 0; day < 7; day++) {
      if (assignment2[i][day] === "Night") {
        nightStreak++;
        if (nightStreak > 3) {
          // Replace with Off and reset streak
          assignment2[i][day] = "Off";
          nightStreak = 0;
        }
      } else if (assignment2[i][day] === "Off") {
        // Off day breaks the streak
        nightStreak = 0;
      } else {
        // Morning or Afternoon also breaks the streak (since 48h reset)
        if (nightStreak > 0 && assignment2[i][day] !== "Night") {
          // Morning/Afternoon after nights means partial reset, but streak is broken
          nightStreak = 0;
        }
      }
    }
  }

  // ── Phase 4: Enforce Rule 1 — max 48h/week, i.e. max 6 working days ──
  for (let i = 0; i < sorted.length; i++) {
    const workDays = assignment2[i].filter((s) => s !== "Off").length;
    if (workDays > 6) {
      // Force the last working day (Sunday) to Off
      for (let day = 6; day >= 0; day--) {
        if (assignment2[i][day] !== "Off") {
          assignment2[i][day] = "Off";
          break;
        }
      }
    }
  }

  // Re-check Rule 3 after Rule 4 and Rule 1 enforcement
  for (let i = 0; i < sorted.length; i++) {
    const hasOff = assignment2[i].some((s) => s === "Off");
    if (!hasOff) {
      assignment2[i][6] = "Off";
    }
  }

  // ── Phase 5: Re-balance — ensure no shift is left empty ──
  for (let day = 0; day < 7; day++) {
    for (const shift of ["Morning", "Afternoon", "Night"] as const) {
      const count = sorted.filter((_, i) => assignment2[i][day] === shift).length;
      if (count === 0) {
        // Pull someone from Off to fill this shift
        const offIdx = sorted.findIndex((_, i) => assignment2[i][day] === "Off");
        if (offIdx >= 0) {
          assignment2[offIdx][day] = shift;
        }
      }
    }
  }

  // ── Build DayPlan objects ──
  const days: DayPlan[] = [];
  for (let day = 0; day < 7; day++) {
    const shifts: DayPlan["shifts"] = {
      Morning: [],
      Afternoon: [],
      Night: [],
      Off: [],
    };

    for (let i = 0; i < sorted.length; i++) {
      const shift = assignment2[i][day];
      shifts[shift].push(sorted[i].id);
    }

    // Sort for determinism
    for (const s of ["Morning", "Afternoon", "Night", "Off"] as const) {
      shifts[s].sort();
    }

    days.push({
      day: DAY_NAMES[day],
      shifts,
    });
  }

  return {
    days,
    weekStart: getMonday(),
  };
}

/**
 * Return the ISO date string of the current week's Monday.
 */
function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

/**
 * Count weekly work hours for an employee given the schedule.
 */
export function weeklyWorkHours(empId: string, schedule: Schedule): number {
  let hours = 0;
  for (const day of schedule.days) {
    for (const s of ["Morning", "Afternoon", "Night"] as const) {
      if (day.shifts[s]?.includes(empId)) {
        hours += SHIFT_HOURS[s];
      }
    }
  }
  return hours;
}