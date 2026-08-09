import { useState, useMemo } from "react";
import { useAppState } from "../context/AppContext";
import type { ArchiveEntry, ArchiveEntryType, PersonaVerdict } from "../types";
import StagIcon from "../components/StagIcon";
import { ArchiveDispatchButton } from "../components/PrintDispatchManifest";

const VERDICT_STYLES: Record<PersonaVerdict, { bg: string; text: string }> = {
  APPROVE: { bg: "bg-verd-approve-bg", text: "text-verd-approve" },
  CAUTION: { bg: "bg-verd-caution-bg", text: "text-verd-caution" },
  REJECT: { bg: "bg-verd-reject-bg", text: "text-verd-reject" },
};

export default function Archive() {
  const { state } = useAppState();
  const { archive, employees } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ArchiveEntryType>("all");
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);

  const filteredEntries = useMemo(() => {
    let entries = archive;

    if (typeFilter !== "all") {
      entries = entries.filter((e) => e.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e) => {
        const labelMatch = e.label?.toLowerCase().includes(q);
        const dateMatch = new Date(e.timestamp)
          .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          .toLowerCase()
          .includes(q);
        const verdictMatch = e.stressTestResult?.overallVerdict.toLowerCase().includes(q);
        const employeeMatch =
          e.overrideDetails?.employeeIds?.some((id) => {
            const emp = employees.find((em) => em.id === id);
            return emp?.name.toLowerCase().includes(q);
          }) ?? false;
        const noteMatch = e.overrideDetails?.managerNote?.toLowerCase().includes(q);
        return labelMatch || dateMatch || verdictMatch || employeeMatch || noteMatch;
      });
    }

    return entries;
  }, [archive, typeFilter, searchQuery, employees]);

  const typeFilterOptions: { key: "all" | ArchiveEntryType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "schedule", label: "Schedules" },
    { key: "stress_test", label: "Stress Tests" },
    { key: "override", label: "Overrides" },
  ];

  return (
    <div className="stag-watermark animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight">Nadir Archive</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">
          Browse historical schedules, stress test results, override events, and operational records
        </p>
      </div>

      {/* Search / Filter bar */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by date, employee, label, or verdict..."
            className="w-full rounded-sm border border-[#334155]/15 bg-white py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rose/40 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.08)]"
          />
        </div>
        <div className="flex gap-1 rounded-sm border border-[#334155]/15 bg-white p-0.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.08)]">
          {typeFilterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`rounded-sm px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                typeFilter === key
                  ? "bg-bg-elevated text-text-primary shadow-[1px_1px_0px_0px_rgba(30,41,59,0.08)]"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <div className="paper-card flex flex-col items-center justify-center p-12">
          <StagIcon size={56} variant="watermark" className="mb-4" />
          {archive.length === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-text-primary">No records yet</h3>
              <p className="mt-1 max-w-xs text-center text-xs text-text-muted">
                The Nadir Archive is empty. Generated schedules, stress test results, and manager overrides will appear here as museum placards.
              </p>
              <div className="mt-6 flex items-center gap-3 text-[10px] text-text-muted">
                <span className="stamp-badge border-chrome/40 text-chrome-dark">Generate</span>
                <span className="text-chrome-dark">→</span>
                <span className="stamp-badge border-chrome/40 text-chrome-dark">Stress Test</span>
                <span className="text-chrome-dark">→</span>
                <span className="stamp-badge border-chrome/40 text-chrome-dark">Archive</span>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-text-primary">No matching records</h3>
              <p className="mt-1 text-xs text-text-muted">
                Try a different search term or filter
              </p>
              <button
                onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}
                className="btn-chrome mt-3 rounded-sm px-3 py-1.5 text-xs"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Archive feed — museum placard style */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <ArchiveCard
            key={entry.id}
            entry={entry}
            employees={employees}
            isSelected={selectedEntry?.id === entry.id}
            onSelect={() =>
              setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)
            }
          />
        ))}
      </div>

      {/* Detail panel for selected entry */}
      {selectedEntry && (
        <ArchiveDetail entry={selectedEntry} employees={employees} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}

// ── Archive Card (Museum Placard Style) ──

function ArchiveCard({
  entry,
  employees: empList,
  isSelected,
  onSelect,
}: {
  entry: ArchiveEntry;
  employees: { id: string; name: string }[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const date = new Date(entry.timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  const isStressTest = entry.type === "stress_test" && entry.stressTestResult;
  const isOverride = entry.type === "override";

  // Accession number: YYYYMMDD-NNN
  const accession = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${entry.id.slice(0, 4).toUpperCase()}`;

  return (
    <button
      onClick={onSelect}
      className={`paper-card w-full border text-left transition-all duration-150 ${
        isOverride
          ? "border-verd-caution/30 hover:border-verd-caution/50"
          : "border-[#334155]/15 hover:border-[#334155]/25"
      } ${isSelected ? "border-rose/40" : ""}`}
    >
      {/* Hairline top border accent */}
      <div className={`h-[2px] w-full rounded-t-sm ${
        isOverride
          ? "bg-gradient-to-r from-verd-caution/60 via-accent-amber/30 to-transparent"
          : isStressTest
            ? "bg-gradient-to-r from-verd-reject/40 via-accent-teal/20 to-transparent"
            : "bg-gradient-to-r from-rose/40 via-chrome/40 to-transparent"
      }`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Accession number */}
          <div className="hidden shrink-0 flex-col items-center sm:flex">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.08em] text-text-muted/50">
              {accession}
            </span>
            <div className="mt-1 h-8 w-px bg-[#334155]/15" />
          </div>

          {/* Type indicator */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-sm ${
            isOverride
              ? "bg-verd-caution-bg text-verd-caution"
              : isStressTest
                ? "bg-verd-reject-bg text-verd-reject"
                : "bg-[#EFF6FF] text-accent-blue"
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOverride ? (
                <>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </>
              ) : isStressTest ? (
                <>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </>
              ) : (
                <>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </>
              )}
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {isOverride
                  ? "Manager Override"
                  : entry.label ?? (entry.type === "stress_test" ? "Stress Test" : "Schedule")}
              </span>
              {isToday && (
                <span className="stamp-badge shrink-0 border-accent-teal/40 text-accent-teal">
                  NEW
                </span>
              )}
            </div>

            {/* Small-caps metadata row */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] uppercase tracking-[0.06em] text-text-muted/70">
              <span>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="stamp-badge border-chrome/30 text-chrome-dark">
                {entry.type === "override" ? "OVERRIDE" : entry.type === "stress_test" ? "STRESS TEST" : "SCHEDULE"}
              </span>
            </div>
          </div>

          {/* Verdict badge for stress tests */}
          {isStressTest && (
            <div className={`rounded-sm border px-2.5 py-1 text-[10px] font-semibold ${
              VERDICT_STYLES[entry.stressTestResult!.overallVerdict].bg
            } border-current/30 ${VERDICT_STYLES[entry.stressTestResult!.overallVerdict].text}`}>
              {entry.stressTestResult!.overallVerdict}
            </div>
          )}

          {/* Override badge */}
          {isOverride && (
            <div className="stamp-badge border-verd-caution/40 text-verd-caution">
              OVERRIDDEN
            </div>
          )}
        </div>

        {/* Quick preview for stress test */}
        {isStressTest && (
          <div className="mt-3 flex items-center gap-2 border-t border-[#334155]/10 pt-2 text-[10px] text-text-muted">
            <span className="text-verd-approve">{entry.stressTestResult!.summary.approved} approved</span>
            <span className="text-verd-caution">{entry.stressTestResult!.summary.cautioned} caution</span>
            <span className="text-verd-reject">{entry.stressTestResult!.summary.rejected} reject</span>
          </div>
        )}

        {/* Print Dispatch — visible on schedule entries */}
        {!isStressTest && !isOverride && (
          <div className="mt-3 flex items-center justify-end border-t border-[#334155]/10 pt-2">
            <ArchiveDispatchButton schedule={entry.schedule} />
          </div>
        )}

        {/* Override preview — affected employees + note snippet */}
        {isOverride && entry.overrideDetails && (
          <div className="mt-3 space-y-2 border-t border-[#334155]/10 pt-2">
            {/* Affected employees */}
            <div className="flex flex-wrap gap-1.5">
              {entry.overrideDetails.employeeIds.slice(0, 6).map((id) => {
                const emp = empList.find((e) => e.id === id);
                return emp ? (
                  <span
                    key={id}
                    className="rounded-sm border border-[#334155]/10 bg-bg-elevated/50 px-2 py-0.5 text-[9px] font-medium text-text-secondary"
                  >
                    {emp.name}
                  </span>
                ) : null;
              })}
              {entry.overrideDetails.employeeIds.length > 6 && (
                <span className="text-[9px] text-text-muted">
                  +{entry.overrideDetails.employeeIds.length - 6} more
                </span>
              )}
            </div>
            {/* Manager note snippet */}
            <p className="line-clamp-1 text-[11px] italic text-text-muted">
              "{entry.overrideDetails.managerNote}"
            </p>
            {/* Verdict summary */}
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <span className="text-verd-approve">{entry.overrideDetails.stressTestResult.summary.approved} approved</span>
              <span className="text-verd-caution">{entry.overrideDetails.stressTestResult.summary.cautioned} caution</span>
              <span className="text-verd-reject">{entry.overrideDetails.stressTestResult.summary.rejected} reject</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Archive Detail Panel ──

function ArchiveDetail({
  entry,
  employees: empList,
  onClose,
}: {
  entry: ArchiveEntry;
  employees: { id: string; name: string }[];
  onClose: () => void;
}) {
  const isOverride = entry.type === "override";

  return (
    <div className="liquid-glass p-5 animate-slide-up">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {isOverride ? "Manager Override Details" : entry.label ?? "Archive Entry"}
        </h3>
        <button
          onClick={onClose}
          className="rounded-sm p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Schedule info */}
      <div className="mb-4 space-y-2 rounded-sm bg-bg-elevated p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-muted">
              Week starting {new Date(entry.schedule.weekStart).toLocaleDateString()}
            </p>
            <p className="text-[11px] text-text-muted">
              {entry.schedule.days.length} days · {entry.schedule.days.reduce((sum, d) =>
                sum + d.shifts.Morning.length + d.shifts.Afternoon.length + d.shifts.Night.length, 0
              )} total shift assignments
            </p>
          </div>
          <ArchiveDispatchButton schedule={entry.schedule} />
        </div>
      </div>

      {/* Override-specific details */}
      {isOverride && entry.overrideDetails && (
        <div className="mb-4 space-y-3">
          {/* Manager justification */}
          <div className="rounded-sm border border-verd-caution/20 bg-verd-caution-bg/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-verd-caution">
              Manager Justification
            </span>
            <p className="mt-1.5 text-xs text-text-primary italic">
              "{entry.overrideDetails.managerNote}"
            </p>
          </div>

          {/* Affected employees */}
          <div className="rounded-sm border border-[#334155]/10 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Affected Personnel
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.overrideDetails.employeeIds.map((id) => {
                const emp = empList.find((e) => e.id === id);
                return emp ? (
                  <span
                    key={id}
                    className="rounded-sm border border-[#334155]/10 bg-bg-elevated/30 px-2 py-0.5 text-[11px] text-text-secondary"
                  >
                    {emp.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Mitigations recorded */}
          <div className="rounded-sm border border-[#334155]/10 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Mitigations &amp; Findings
            </span>
            <ul className="mt-2 space-y-1">
              {entry.overrideDetails.mitigations.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                  <span className="mt-0.5 shrink-0 text-verd-caution">⚠</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stress test detail */}
      {entry.stressTestResult && !isOverride && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-text-secondary">Stress Test Results</h4>
          {entry.stressTestResult.personaResults.map((pr) => (
            <div key={pr.personaId} className="rounded-sm border border-[#334155]/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span>{pr.personaIcon}</span>
                <span className="text-xs font-medium text-text-primary">{pr.personaName}</span>
                <span className={`ml-auto text-[10px] font-semibold ${VERDICT_STYLES[pr.verdict].text}`}>
                  {pr.verdict}
                </span>
              </div>
              <ul className="space-y-0.5">
                {pr.findings.map((f, i) => (
                  <li key={i} className="text-[10px] text-text-muted">{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Stress test persona results shown under override too */}
      {isOverride && entry.overrideDetails && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-text-secondary">Persona Verdicts at Time of Override</h4>
          {entry.overrideDetails.stressTestResult.personaResults.map((pr) => (
            <div key={pr.personaId} className="rounded-sm border border-[#334155]/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span>{pr.personaIcon}</span>
                <span className="text-xs font-medium text-text-primary">{pr.personaName}</span>
                <span className={`ml-auto text-[10px] font-semibold ${VERDICT_STYLES[pr.verdict].text}`}>
                  {pr.verdict}
                </span>
              </div>
              <ul className="space-y-0.5">
                {pr.findings.map((f, i) => (
                  <li key={i} className="text-[10px] text-text-muted">{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-4 text-[10px] font-mono text-text-muted">
        ACCESSION {new Date(entry.timestamp).getFullYear()}
        {String(new Date(entry.timestamp).getMonth() + 1).padStart(2, "0")}
        {String(new Date(entry.timestamp).getDate()).padStart(2, "0")}-
        {entry.id.slice(0, 4).toUpperCase()} · Filed{" "}
        {new Date(entry.timestamp).toLocaleString()}
      </p>
    </div>
  );
}