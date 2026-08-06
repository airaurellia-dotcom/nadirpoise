import { useState, useMemo } from "react";
import { useAppState } from "../context/AppContext";
import type { ArchiveEntry, ArchiveEntryType, PersonaVerdict } from "../types";
import StagIcon from "../components/StagIcon";

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
        // Search by label
        const labelMatch = e.label?.toLowerCase().includes(q);
        // Search by date
        const dateMatch = new Date(e.timestamp)
          .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          .toLowerCase()
          .includes(q);
        // Search by verdict
        const verdictMatch = e.stressTestResult?.overallVerdict.toLowerCase().includes(q);
        // Search by employee name (override entries)
        const employeeMatch =
          e.overrideDetails?.employeeIds?.some((id) => {
            const emp = employees.find((em) => em.id === id);
            return emp?.name.toLowerCase().includes(q);
          }) ?? false;
        // Search by manager note
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
        <h1 className="text-xl font-semibold tracking-tight">Nadir Archive</h1>
        <p className="text-sm text-text-secondary mt-1">
          Browse historical schedules, stress test results, override events, and operational records
        </p>
      </div>

      {/* Search / Filter bar */}
      <div className="flex items-center gap-3">
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
            className="w-full rounded-lg border border-glass-border bg-glass-bg py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/40 backdrop-blur-md"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-glass-border bg-glass-bg p-0.5 backdrop-blur-md">
          {typeFilterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                typeFilter === key
                  ? "bg-bg-elevated text-text-primary"
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
        <div className="paper-card flex flex-col items-center justify-center rounded-xl p-12">
          <StagIcon size={56} variant="watermark" className="mb-4" />
          {archive.length === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-text-primary">No records yet</h3>
              <p className="mt-1 max-w-xs text-center text-xs text-text-muted">
                The Nadir Archive is empty. Generated schedules, stress test results, and manager overrides will appear here as museum placards.
              </p>
              <div className="mt-6 flex items-center gap-3 text-[10px] text-text-muted">
                <span className="stamp-badge border-chrome/20 text-chrome/50">Generate</span>
                <span className="text-chrome/40">→</span>
                <span className="stamp-badge border-chrome/20 text-chrome/50">Stress Test</span>
                <span className="text-chrome/40">→</span>
                <span className="stamp-badge border-chrome/20 text-chrome/50">Archive</span>
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
                className="btn-chrome mt-3 rounded-lg px-3 py-1.5 text-xs"
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
      className={`paper-card w-full rounded-xl border text-left transition-all duration-150 ${
        isOverride
          ? "border-verd-caution/25 hover:border-verd-caution/40"
          : "border-glass-border hover:border-glass-border/70"
      } ${isSelected ? "ring-1 ring-accent-teal/30" : ""}`}
    >
      {/* Hairline top border accent */}
      <div className={`h-[2px] w-full rounded-t-xl ${
        isOverride
          ? "bg-gradient-to-r from-verd-caution/50 via-accent-amber/30 to-transparent"
          : isStressTest
            ? "bg-gradient-to-r from-verd-reject/30 via-accent-teal/20 to-transparent"
            : "bg-gradient-to-r from-accent-teal/30 via-glass-shine to-transparent"
      }`} />

      <div className="p-4">
        {/* Museum placard styling */}
        <div className="flex items-start gap-3">
          {/* Accession number — hairline, small caps */}
          <div className="hidden shrink-0 flex-col items-center sm:flex">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.08em] text-text-muted/50">
              {accession}
            </span>
            <div className="mt-1 h-8 w-px bg-glass-border" />
          </div>

          {/* Type indicator */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
            isOverride
              ? "bg-verd-caution-bg/30"
              : isStressTest
                ? "bg-verd-reject-bg/20"
                : "bg-accent-blue/15"
          }`}>
            {isOverride ? "⚡" : isStressTest ? "🧪" : "📋"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary truncate">
                {isOverride
                  ? "Manager Override"
                  : entry.label ?? (entry.type === "stress_test" ? "Stress Test" : "Schedule")}
              </span>
              {isToday && (
                <span className="shrink-0 rounded-full bg-accent-teal/15 px-2 py-0.5 text-[9px] font-semibold text-accent-teal">
                  NEW
                </span>
              )}
            </div>

            {/* Small-caps metadata row */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] uppercase tracking-[0.06em] text-text-muted/70">
              <span>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="rounded border border-glass-border/50 px-1.5 py-[1px] text-[9px]">
                {entry.type === "override" ? "OVERRIDE" : entry.type === "stress_test" ? "STRESS TEST" : "SCHEDULE"}
              </span>
            </div>
          </div>

          {/* Verdict badge for stress tests */}
          {isStressTest && (
            <div className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
              VERDICT_STYLES[entry.stressTestResult!.overallVerdict].bg
            } ${VERDICT_STYLES[entry.stressTestResult!.overallVerdict].text}`}>
              {entry.stressTestResult!.overallVerdict}
            </div>
          )}

          {/* Override badge */}
          {isOverride && (
            <div className="rounded-lg bg-verd-caution-bg/20 px-2.5 py-1 text-[10px] font-semibold text-verd-caution">
              OVERRIDDEN
            </div>
          )}
        </div>

        {/* Quick preview for stress test */}
        {isStressTest && (
          <div className="mt-3 flex items-center gap-2 border-t border-glass-border/40 pt-2 text-[10px] text-text-muted">
            <span className="text-verd-approve">{entry.stressTestResult!.summary.approved} ✅</span>
            <span className="text-verd-caution">{entry.stressTestResult!.summary.cautioned} ⚠️</span>
            <span className="text-verd-reject">{entry.stressTestResult!.summary.rejected} 🔴</span>
          </div>
        )}

        {/* Override preview — affected employees + note snippet */}
        {isOverride && entry.overrideDetails && (
          <div className="mt-3 space-y-2 border-t border-glass-border/40 pt-2">
            {/* Affected employees */}
            <div className="flex flex-wrap gap-1.5">
              {entry.overrideDetails.employeeIds.slice(0, 6).map((id) => {
                const emp = empList.find((e) => e.id === id);
                return emp ? (
                  <span
                    key={id}
                    className="rounded-md border border-glass-border/50 bg-bg-surface/50 px-2 py-0.5 text-[9px] font-medium text-text-secondary"
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
              <span className="text-verd-approve">{entry.overrideDetails.stressTestResult.summary.approved} ✅</span>
              <span className="text-verd-caution">{entry.overrideDetails.stressTestResult.summary.cautioned} ⚠️</span>
              <span className="text-verd-reject">{entry.overrideDetails.stressTestResult.summary.rejected} 🔴</span>
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
    <div className="liquid-glass rounded-xl p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {isOverride ? "Manager Override Details" : entry.label ?? "Archive Entry"}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Schedule info */}
      <div className="mb-4 space-y-2 rounded-lg bg-bg-hover p-3">
        <p className="text-[11px] text-text-muted">
          Week starting {new Date(entry.schedule.weekStart).toLocaleDateString()}
        </p>
        <p className="text-[11px] text-text-muted">
          {entry.schedule.days.length} days · {entry.schedule.days.reduce((sum, d) =>
            sum + d.shifts.Morning.length + d.shifts.Afternoon.length + d.shifts.Night.length, 0
          )} total shift assignments
        </p>
      </div>

      {/* Override-specific details — museum placard detail */}
      {isOverride && entry.overrideDetails && (
        <div className="mb-4 space-y-3">
          {/* Manager justification */}
          <div className="rounded-lg border border-verd-caution/20 bg-verd-caution-bg/10 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-verd-caution">
              Manager Justification
            </span>
            <p className="mt-1.5 text-xs text-text-primary italic">
              "{entry.overrideDetails.managerNote}"
            </p>
          </div>

          {/* Affected employees */}
          <div className="rounded-lg border border-glass-border p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Affected Personnel
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.overrideDetails.employeeIds.map((id) => {
                const emp = empList.find((e) => e.id === id);
                return emp ? (
                  <span
                    key={id}
                    className="rounded-md border border-glass-border bg-bg-surface/50 px-2 py-0.5 text-[11px] text-text-secondary"
                  >
                    {emp.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Mitigations recorded */}
          <div className="rounded-lg border border-glass-border p-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Mitigations & Findings
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
            <div key={pr.personaId} className="rounded-lg border border-glass-border p-3">
              <div className="flex items-center gap-2 mb-2">
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
            <div key={pr.personaId} className="rounded-lg border border-glass-border p-3">
              <div className="flex items-center gap-2 mb-2">
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