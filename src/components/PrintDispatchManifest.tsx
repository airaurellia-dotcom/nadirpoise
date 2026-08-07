import { useCallback } from "react";
import { useAppState } from "../context/AppContext";
import { calculateFatigueReports } from "../lib/fatigue";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const AIRHUB_LAT = -6.2088;
const AIRHUB_LON = 106.8456;

export default function PrintDispatchManifest() {
  const { state } = useAppState();
  const { employees, schedule } = state;

  const reports = schedule
    ? calculateFatigueReports(employees, schedule)
    : [];

  const getEmployeeReport = (empId: string, dayIdx: number) =>
    reports.find((r) => r.employeeId === empId && r.dayIndex === dayIdx);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!schedule) return null;

  const today = new Date();
  const dateStamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const accessionCode = `DISPATCH-${dateStamp}`;

  const weekStart = new Date(schedule.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <>
      {/* Print Trigger Button */}
      <button
        onClick={handlePrint}
        className="btn-chrome rounded-sm px-3 py-2 text-xs font-medium"
      >
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Dispatch Manifest
        </span>
      </button>

      {/* Hidden Print Layout — only visible during @media print */}
      <div className="print-only-dispatch">
        {/* Letterhead */}
        <div className="dispatch-letterhead">
          <div className="dispatch-letterhead-left">
            <h1 className="dispatch-title">NEXAGLOBAL AIR-HUB</h1>
            <p className="dispatch-subtitle">Flight &amp; Crew Dispatch Sheet</p>
          </div>
          <div className="dispatch-letterhead-right">
            <div className="dispatch-stamp-box">
              <span className="dispatch-stamp-text">OFFICIAL DISPATCH APPROVED</span>
            </div>
          </div>
        </div>

        {/* Accession & Metadata Row */}
        <div className="dispatch-meta">
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Accession Code</span>
            <span className="dispatch-mono">{accessionCode}</span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Date Stamp</span>
            <span className="dispatch-mono">
              {today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Coordinates</span>
            <span className="dispatch-mono">
              {AIRHUB_LAT}, {AIRHUB_LON}
            </span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Week</span>
            <span className="dispatch-mono">
              {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
              {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Hairline Divider */}
        <hr className="dispatch-hr" />

        {/* Roster Matrix — 7-Day Grid */}
        <table className="dispatch-table">
          <thead>
            <tr>
              <th className="dispatch-th dispatch-th-employee">Employee</th>
              {DAY_NAMES.map((day) => (
                <th key={day} className="dispatch-th">{day.slice(0, 3)}</th>
              ))}
              <th className="dispatch-th dispatch-th-notes">Notes</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const totalViolations = reports.filter((r) => r.employeeId === emp.id).reduce(
                (sum, r) => sum + r.violations.length, 0,
              );
              const hasRedZone = reports.some((r) => r.employeeId === emp.id && r.redZone);
              const mitigationNotes: string[] = [];
              if (hasRedZone) mitigationNotes.push(`🔴 RED ZONE — ${emp.name}`);
              if (emp.circadian_status.toLowerCase().includes("critical")) {
                mitigationNotes.push("Critical fatigue");
              }
              if (emp.sleep_debt_hours > 5) {
                mitigationNotes.push(`Sleep debt ${emp.sleep_debt_hours}h`);
              }

              return (
                <tr key={emp.id}>
                  <td className="dispatch-td dispatch-td-employee">
                    <div className="dispatch-emp-name">{emp.name}</div>
                    <div className="dispatch-emp-role">{emp.role}</div>
                  </td>
                  {schedule!.days.map((day, idx) => {
                    const assignedShift = (["Morning", "Afternoon", "Night", "Off"] as const).find(
                      (s) => day.shifts[s]?.includes(emp.id),
                    );
                    const rep = getEmployeeReport(emp.id, idx);
                    const fi = rep?.fatigueIndex;

                    if (!assignedShift || assignedShift === "Off") {
                      return <td key={idx} className="dispatch-td dispatch-td-off">—</td>;
                    }

                    const shiftLabel = assignedShift === "Morning" ? "M" : assignedShift === "Afternoon" ? "A" : "N";
                    const fiDisplay = fi != null ? `${fi}` : "";

                    return (
                      <td key={idx} className={`dispatch-td dispatch-td-${assignedShift.toLowerCase()}`}>
                        <div className="dispatch-shift-code">{shiftLabel}</div>
                        {fiDisplay && (
                          <div className={`dispatch-fi ${fi != null && fi >= 75 ? "dispatch-fi-red" : fi != null && fi >= 45 ? "dispatch-fi-amber" : ""}`}>
                            {fiDisplay}%
                          </div>
                        )}
                        {rep?.redZone && <div className="dispatch-rz-dot">!</div>}
                      </td>
                    );
                  })}
                  <td className="dispatch-td dispatch-td-notes">
                    {mitigationNotes.length > 0 && (
                      <div className="dispatch-mitigation">
                        {mitigationNotes.slice(0, 2).map((n, i) => (
                          <span key={i} className="dispatch-mitigation-item">{n}</span>
                        ))}
                      </div>
                    )}
                    {totalViolations > 0 && (
                      <span className="dispatch-violation-count">{totalViolations} violation{totalViolations !== 1 ? "s" : ""}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr className="dispatch-hr" />

        {/* Fatigue Legend */}
        <div className="dispatch-legend">
          <span className="dispatch-legend-item">
            <span className="dispatch-legend-swatch dispatch-legend-green" /> Low (&lt;45%)
          </span>
          <span className="dispatch-legend-item">
            <span className="dispatch-legend-swatch dispatch-legend-amber" /> Medium (45–74%)
          </span>
          <span className="dispatch-legend-item">
            <span className="dispatch-legend-swatch dispatch-legend-red" /> High (≥75%)
          </span>
          <span className="dispatch-legend-item">M = Morning</span>
          <span className="dispatch-legend-item">A = Afternoon</span>
          <span className="dispatch-legend-item">N = Night</span>
        </div>

        {/* Supervisor Approval Line */}
        <div className="dispatch-approval">
          <div className="dispatch-approval-line">
            <span className="dispatch-approval-label">Supervisor Approval</span>
            <span className="dispatch-approval-underscore">_____________________________</span>
          </div>
          <div className="dispatch-approval-line">
            <span className="dispatch-approval-label">Date / Time</span>
            <span className="dispatch-approval-underscore">_____________________________</span>
          </div>
        </div>

        {/* Official Stamp — bottom right */}
        <div className="dispatch-official-stamp">
          <div className="dispatch-stamp-inner">
            <span className="dispatch-stamp-line1">OFFICIAL</span>
            <span className="dispatch-stamp-line2">DISPATCH</span>
            <span className="dispatch-stamp-line3">APPROVED</span>
          </div>
        </div>

        {/* Footer */}
        <div className="dispatch-footer">
          <span className="dispatch-mono">NADIRPOISE v2.0 · FATIGUE-AWARE DISPATCH SYSTEM</span>
          <span className="dispatch-mono">NEXAGLOBAL AIR-HUB · CGK</span>
        </div>
      </div>
    </>
  );
}

/** B/W minimal print layout for the archive — renders a DispatchSheet from stored data */
export function ArchiveDispatchButton({ schedule: storedSchedule }: { schedule: import("../types").Schedule }) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const today = new Date();
  const dateStamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const accessionCode = `DISPATCH-${dateStamp}`;

  const weekStart = new Date(storedSchedule.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <>
      <button
        onClick={handlePrint}
        className="btn-chrome rounded-sm px-2.5 py-1.5 text-[10px] font-medium"
      >
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Dispatch
        </span>
      </button>

      <div className="print-only-dispatch">
        <div className="dispatch-letterhead">
          <div className="dispatch-letterhead-left">
            <h1 className="dispatch-title">NEXAGLOBAL AIR-HUB</h1>
            <p className="dispatch-subtitle">Flight &amp; Crew Dispatch Sheet</p>
          </div>
          <div className="dispatch-letterhead-right">
            <div className="dispatch-stamp-box">
              <span className="dispatch-stamp-text">OFFICIAL DISPATCH APPROVED</span>
            </div>
          </div>
        </div>

        <div className="dispatch-meta">
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Accession Code</span>
            <span className="dispatch-mono">{accessionCode}</span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Date Stamp</span>
            <span className="dispatch-mono">
              {today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Coordinates</span>
            <span className="dispatch-mono">{AIRHUB_LAT}, {AIRHUB_LON}</span>
          </div>
          <div className="dispatch-meta-col">
            <span className="dispatch-meta-label">Week</span>
            <span className="dispatch-mono">
              {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
              {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        <hr className="dispatch-hr" />

        {/* Schedule summary overview */}
        <div style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: "7.5pt", marginBottom: "6px" }}>
          <p style={{ fontWeight: 700, marginBottom: "4px" }}>SCHEDULE OVERVIEW (ARCHIVE REFERENCE)</p>
          <table className="dispatch-table">
            <thead>
              <tr>
                <th className="dispatch-th">Day</th>
                <th className="dispatch-th">Morning</th>
                <th className="dispatch-th">Afternoon</th>
                <th className="dispatch-th">Night</th>
                <th className="dispatch-th">Off</th>
              </tr>
            </thead>
            <tbody>
              {storedSchedule.days.map((day, idx) => (
                <tr key={idx}>
                  <td className="dispatch-td" style={{ fontWeight: 600 }}>{DAY_NAMES[idx]?.slice(0, 3)}</td>
                  <td className="dispatch-td dispatch-td-morning" style={{ textAlign: "center" }}>{day.shifts.Morning.length}</td>
                  <td className="dispatch-td dispatch-td-afternoon" style={{ textAlign: "center" }}>{day.shifts.Afternoon.length}</td>
                  <td className="dispatch-td dispatch-td-night" style={{ textAlign: "center" }}>{day.shifts.Night.length}</td>
                  <td className="dispatch-td" style={{ textAlign: "center" }}>{day.shifts.Off.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: "4px", color: "#475569" }}>
            Total assignments: {storedSchedule.days.reduce((s, d) => s + d.shifts.Morning.length + d.shifts.Afternoon.length + d.shifts.Night.length, 0)}
          </p>
        </div>

        <hr className="dispatch-hr" />

        <div className="dispatch-approval">
          <div className="dispatch-approval-line">
            <span className="dispatch-approval-label">Supervisor Approval</span>
            <span className="dispatch-approval-underscore">_____________________________</span>
          </div>
          <div className="dispatch-approval-line">
            <span className="dispatch-approval-label">Date / Time</span>
            <span className="dispatch-approval-underscore">_____________________________</span>
          </div>
        </div>

        <div className="dispatch-official-stamp">
          <div className="dispatch-stamp-inner">
            <span className="dispatch-stamp-line1">OFFICIAL</span>
            <span className="dispatch-stamp-line2">DISPATCH</span>
            <span className="dispatch-stamp-line3">APPROVED</span>
          </div>
        </div>

        <div className="dispatch-footer">
          <span className="dispatch-mono">NADIRPOISE v2.0 · FATIGUE-AWARE DISPATCH SYSTEM</span>
          <span className="dispatch-mono">NEXAGLOBAL AIR-HUB · CGK</span>
        </div>
      </div>
    </>
  );
}