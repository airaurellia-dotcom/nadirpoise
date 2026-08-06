import type { Employee, Schedule, FatigueReport } from "../types";
import type { PersonaVerdict, StressTestResult, StressTestPersonaResult } from "../types";
import { calculateFatigueReports } from "./fatigue";
import { stressTestAgents } from "../data/stressTestAgents";
import type { StressTestPersona } from "../data/stressTestAgents";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Simulate a full stress test against all 5 personas.
 * In production this would call an Edge Function that pings OpenRouter with each persona's system prompt.
 */
export function runStressTest(
  employees: Employee[],
  schedule: Schedule,
): StressTestResult {
  const reports = calculateFatigueReports(employees, schedule);

  const personaResults: StressTestPersonaResult[] = stressTestAgents.map((persona) =>
    simulatePersona(persona, employees, schedule, reports),
  );

  const overallVerdict: PersonaVerdict = personaResults.some((r) => r.verdict === "REJECT")
    ? "REJECT"
    : personaResults.some((r) => r.verdict === "CAUTION")
      ? "CAUTION"
      : "APPROVE";

  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    scheduleSnapshot: schedule,
    personaResults,
    overallVerdict,
    summary: {
      totalPersonas: personaResults.length,
      approved: personaResults.filter((r) => r.verdict === "APPROVE").length,
      cautioned: personaResults.filter((r) => r.verdict === "CAUTION").length,
      rejected: personaResults.filter((r) => r.verdict === "REJECT").length,
    },
  };
}

function simulatePersona(
  persona: StressTestPersona,
  employees: Employee[],
  schedule: Schedule,
  reports: FatigueReport[],
): StressTestPersonaResult {
  let result: { rejected: boolean; cautioned: boolean; findings: string[] };

  switch (persona.id) {
    case "cfo":
      result = simulateCFO(employees, schedule, reports);
      break;
    case "supervisor":
      result = simulateSupervisor(employees, schedule, reports);
      break;
    case "nightops":
      result = simulateNightOps(employees, schedule, reports);
      break;
    case "hr":
      result = simulateHR(employees, schedule, reports);
      break;
    case "regulator":
      result = simulateRegulator(employees, schedule, reports);
      break;
    default:
      result = { rejected: false, cautioned: false, findings: ["No analysis available for this persona."] };
  }

  const { rejected, cautioned, findings } = result;

  const verdict: PersonaVerdict = rejected ? "REJECT" : cautioned ? "CAUTION" : "APPROVE";

  return {
    personaId: persona.id,
    personaName: persona.name,
    personaTitle: persona.title,
    personaIcon: persona.icon,
    verdict,
    findings,
    detail: findings.join("\n"),
  };
}

// ── CFO: Safety & Circadian Compliance ──
function simulateCFO(
  employees: Employee[],
  schedule: Schedule,
  reports: FatigueReport[],
): { rejected: boolean; cautioned: boolean; findings: string[] } {
  const findings: string[] = [];
  let rejected = false;
  let cautioned = false;

  // Check Red Zone employees
  const redZoneEmployees = new Set(
    reports.filter((r) => r.redZone).map((r) => r.employeeId),
  );

  for (const empId of redZoneEmployees) {
    const emp = employees.find((e) => e.id === empId);
    const empReports = reports.filter((r) => r.employeeId === empId);
    const maxFI = Math.max(...empReports.map((r) => r.fatigueIndex));
    findings.push(`🔴 ${emp?.name ?? empId} is in RED ZONE (max FI: ${maxFI}%)`);
    rejected = true;
  }

  if (!rejected) {
    // Check for any violations of Rules 1-4
    const ruleViolations = reports.filter((r) =>
      r.violations.some((v) => ["Rule 1", "Rule 2", "Rule 3", "Rule 4"].includes(v.rule)),
    );

    if (ruleViolations.length > 0) {
      const uniqueViolations = new Set(ruleViolations.map((r) =>
        `${r.employeeId}:${r.violations.map((v) => v.rule).join(",")}`,
      ));
      findings.push(`⚠️ ${uniqueViolations.size} critical rule violation(s) detected across the roster`);
      cautioned = true;
    }

    // Check consecutive nights
    for (const emp of employees) {
      const nightDays = schedule.days.filter((d) =>
        d.shifts["Night"]?.includes(emp.id),
      ).length;
      if (nightDays > 3) {
        findings.push(`⚠️ ${emp.name} has ${nightDays} night shifts this week`);
        cautioned = true;
      }
    }
  }

  if (!rejected && !cautioned) {
    findings.push("✅ All fatigue metrics within safe thresholds. Circadian compliance confirmed.");
  }

  return { rejected, cautioned, findings };
}

// ── Supervisor: Operational Coverage ──
function simulateSupervisor(
  employees: Employee[],
  schedule: Schedule,
  _reports: FatigueReport[],
): { rejected: boolean; cautioned: boolean; findings: string[] } {
  const findings: string[] = [];
  let rejected = false;
  let cautioned = false;

  for (let i = 0; i < schedule.days.length; i++) {
    const day = schedule.days[i];
    const dayName = DAY_NAMES[i];

    for (const shift of ["Morning", "Afternoon", "Night"] as const) {
      const count = day.shifts[shift]?.length ?? 0;

      if (count === 0) {
        findings.push(`🔴 ${dayName} ${shift}: CRITICALLY UNDERSTAFFED (0 employees)`);
        rejected = true;
      } else if (count < 3) {
        findings.push(`⚠️ ${dayName} ${shift}: Low headcount (${count} employees, min 3 recommended)`);
        cautioned = true;
      }

      // Check senior staff on night shift
      if (shift === "Night" && count > 0) {
        const nightEmpIds = day.shifts["Night"] ?? [];
        const hasSenior = nightEmpIds.some((id) => {
          const emp = employees.find((e) => e.id === id);
          return emp?.role?.toLowerCase().includes("senior") || emp?.role?.toLowerCase().includes("supervisor") || emp?.role?.toLowerCase().includes("lead");
        });
        if (!hasSenior && count > 0) {
          findings.push(`⚠️ ${dayName} Night: No senior/lead staff assigned`);
          cautioned = true;
        }
      }
    }
  }

  if (!rejected && !cautioned) {
    findings.push("✅ All shifts adequately staffed. Operational coverage confirmed.");
  }

  return { rejected, cautioned, findings };
}

// ── Night Ops Lead ──
function simulateNightOps(
  employees: Employee[],
  schedule: Schedule,
  _reports: FatigueReport[],
): { rejected: boolean; cautioned: boolean; findings: string[] } {
  const findings: string[] = [];
  let rejected = false;
  let cautioned = false;

  for (const emp of employees) {
    let consecutiveNights = 0;
    let maxConsecutive = 0;

    for (const day of schedule.days) {
      if (day.shifts["Night"]?.includes(emp.id)) {
        consecutiveNights++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveNights);
      } else {
        consecutiveNights = 0;
      }
    }

    if (maxConsecutive > 3) {
      findings.push(`🔴 ${emp.name}: ${maxConsecutive} consecutive night shifts (max 3)`);
      rejected = true;
    }

    // Check night → morning transition (dangerous)
    for (let i = 1; i < schedule.days.length; i++) {
      const prevNight = schedule.days[i - 1].shifts["Night"]?.includes(emp.id);
      const currMorning = schedule.days[i].shifts["Morning"]?.includes(emp.id);
      if (prevNight && currMorning) {
        findings.push(`🔴 ${emp.name}: Night→Morning transition on ${DAY_NAMES[i-1]}→${DAY_NAMES[i]} (insufficient rest)`);
        rejected = true;
      }
    }
  }

  // Night headcount check
  for (let i = 0; i < schedule.days.length; i++) {
    const nightCount = schedule.days[i].shifts["Night"]?.length ?? 0;
    if (nightCount === 0) {
      findings.push(`🔴 ${DAY_NAMES[i]} Night: No night staff scheduled!`);
      rejected = true;
    } else if (nightCount < 3) {
      findings.push(`⚠️ ${DAY_NAMES[i]} Night: Only ${nightCount} staff (ideally 4+)`);
      cautioned = true;
    }
  }

  if (!rejected && !cautioned) {
    findings.push("✅ Night operations are safe. All turnarounds and headcounts acceptable.");
  }

  return { rejected, cautioned, findings };
}

// ── HR / Wellbeing Rep ──
function simulateHR(
  employees: Employee[],
  schedule: Schedule,
  _reports: FatigueReport[],
): { rejected: boolean; cautioned: boolean; findings: string[] } {
  const findings: string[] = [];
  let rejected = false;
  let cautioned = false;

  for (const emp of employees) {
    // Consecutive workdays
    let workStreak = 0;
    let maxStreak = 0;
    let offDays = 0;

    for (const day of schedule.days) {
      const isOff = day.shifts["Off"]?.includes(emp.id);
      if (isOff) {
        offDays++;
        workStreak = 0;
      } else {
        workStreak++;
        maxStreak = Math.max(maxStreak, workStreak);
      }
    }

    if (maxStreak > 5) {
      findings.push(`🔴 ${emp.name}: ${maxStreak} consecutive workdays (max 5 for wellbeing)`);
      rejected = true;
    } else if (maxStreak === 5) {
      findings.push(`⚠️ ${emp.name}: ${maxStreak} consecutive workdays (at limit)`);
      cautioned = true;
    }

    if (offDays < 2) {
      findings.push(`⚠️ ${emp.name}: Only ${offDays} off day(s) this week (2 recommended)`);
      cautioned = true;
    }

    // Sleep debt check
    if (emp.sleep_debt_hours > 8) {
      findings.push(`🔴 ${emp.name}: Critical sleep debt (${emp.sleep_debt_hours}h) — must not be on duty`);
      rejected = true;
    } else if (emp.sleep_debt_hours > 5) {
      findings.push(`⚠️ ${emp.name}: High sleep debt (${emp.sleep_debt_hours}h) — wellbeing concern`);
      cautioned = true;
    }

    // Check if circadian is critical with night shift
    if (emp.circadian_status?.toLowerCase().includes("critical") || emp.circadian_status?.toLowerCase().includes("red zone")) {
      const onNight = schedule.days.some((d) => d.shifts["Night"]?.includes(emp.id));
      if (onNight) {
        findings.push(`🔴 ${emp.name}: Critical fatigue status AND assigned night shifts — immediate welfare risk`);
        rejected = true;
      }
    }
  }

  // Fair night distribution
  const nightCounts = new Map<string, number>();
  for (const emp of employees) {
    const count = schedule.days.filter((d) =>
      d.shifts["Night"]?.includes(emp.id),
    ).length;
    if (count > 0) nightCounts.set(emp.id, count);
  }
  const maxNight = Math.max(...nightCounts.values(), 0);
  const minNight = Math.min(...nightCounts.values(), 0);
  if (maxNight - minNight > 2 && nightCounts.size > 0) {
    findings.push(`⚠️ Uneven night distribution: some staff work ${maxNight} nights while others work ${minNight}`);
    cautioned = true;
  }

  if (!rejected && !cautioned) {
    findings.push("✅ Schedule meets wellbeing standards. Work-life balance is respected.");
  }

  return { rejected, cautioned, findings };
}

// ── Regulator / Compliance Auditor ──
function simulateRegulator(
  employees: Employee[],
  _schedule: Schedule,
  reports: FatigueReport[],
): { rejected: boolean; cautioned: boolean; findings: string[] } {
  const findings: string[] = [];
  let rejected = false;
  let cautioned = false;

  // Check ALL reports for any violations of Rules 1-4
  const reportViolations = reports.filter((r) =>
    r.violations.some((v) => ["Rule 1", "Rule 2", "Rule 3", "Rule 4"].includes(v.rule)),
  );

  if (reportViolations.length > 0) {
    for (const rv of reportViolations) {
      const emp = employees.find((e) => e.id === rv.employeeId);
      for (const v of rv.violations) {
        if (["Rule 1", "Rule 2", "Rule 3", "Rule 4"].includes(v.rule)) {
          findings.push(`🔴 ${emp?.name ?? rv.employeeId} — ${v.rule}: ${v.message}`);
          rejected = true;
        }
      }
    }
  }

  // Check Rule 5-7 violations (CAUTION)
  const advisoryViolations = reports.filter((r) =>
    r.violations.some((v) => ["Rule 5", "Rule 6", "Rule 7"].includes(v.rule)),
  );

  if (advisoryViolations.length > 0) {
    const uniqueAdvisories = new Set(
      advisoryViolations.map((r) =>
        `${r.employeeId}:${r.violations.filter((v) => ["Rule 5", "Rule 6", "Rule 7"].includes(v.rule)).map((v) => v.rule).join(",")}`,
      ),
    );
    findings.push(`⚠️ ${uniqueAdvisories.size} advisory violation(s) (Rules 5-7) — best practice flags`);
    cautioned = true;
  }

  // Red Zone check
  const redZoneCount = reports.filter((r) => r.redZone).length;
  if (redZoneCount > 0) {
    findings.push(`🔴 ${redZoneCount} Red Zone fatigue occurrence(s) detected — non-compliant`);
    rejected = true;
  }

  if (!rejected && !cautioned) {
    findings.push("✅ Full regulatory compliance. All rules verified — zero violations.");
  }

  return { rejected, cautioned, findings };
}