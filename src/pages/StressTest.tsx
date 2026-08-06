import { useState, useMemo, useCallback } from "react";
import { useAppState } from "../context/AppContext";
import { runStressTest } from "../lib/stressTestSimulator";
import type { PersonaVerdict, StressTestResult, StressTestPersonaResult } from "../types";

const VERDICT_CONFIG: Record<PersonaVerdict, { label: string; bg: string; text: string; icon: string }> = {
  APPROVE: {
    label: "APPROVED",
    bg: "bg-verd-approve-bg",
    text: "text-verd-approve",
    icon: "✅",
  },
  CAUTION: {
    label: "CAUTION",
    bg: "bg-verd-caution-bg",
    text: "text-verd-caution",
    icon: "⚠️",
  },
  REJECT: {
    label: "REJECTED",
    bg: "bg-verd-reject-bg",
    text: "text-verd-reject",
    icon: "🔴",
  },
};

export default function StressTest() {
  const { state, addStressTestResult, addOverrideEntry } = useAppState();
  const { schedule, archive, employees } = state;

  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<StressTestResult | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [managerNote, setManagerNote] = useState("");
  const [overrideRecorded, setOverrideRecorded] = useState(false);

  // Check if there are any rejections
  const hasRejection = currentResult?.personaResults.some((r) => r.verdict === "REJECT");

  // Latest stress test from archive (for reference)
  const pastResults = useMemo(() => {
    return archive
      .filter((e) => e.type === "stress_test" && e.stressTestResult)
      .slice(0, 5)
      .map((e) => e.stressTestResult!);
  }, [archive]);

  const handleRunTest = useCallback(async () => {
    if (!schedule) return;
    setIsRunning(true);

    // Simulate async delay for the "thinking" effect
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = runStressTest(employees, schedule);
    setCurrentResult(result);
    addStressTestResult(schedule, result);
    setIsRunning(false);

    // Show override modal if any REJECT
    if (result.personaResults.some((r) => r.verdict === "REJECT")) {
      setShowOverrideModal(true);
    }
  }, [schedule, employees, addStressTestResult]);

  // Employees implicated in non-approve findings (matched by name in the finding text)
  const involvedEmployeeIds = useMemo(() => {
    if (!currentResult) return [];
    const text = currentResult.personaResults
      .filter((r) => r.verdict === "REJECT" || r.verdict === "CAUTION")
      .flatMap((r) => r.findings)
      .join(" ");
    return employees
      .filter((emp) => text.includes(emp.name))
      .map((emp) => emp.id);
  }, [currentResult, employees]);

  const handleOverride = useCallback(() => {
    if (!currentResult || !schedule) return;
    const ids =
      involvedEmployeeIds.length > 0
        ? involvedEmployeeIds
        : schedule.days.flatMap((d) => [
            ...d.shifts.Morning,
            ...d.shifts.Afternoon,
            ...d.shifts.Night,
          ]);
    addOverrideEntry(schedule, currentResult, managerNote.trim(), Array.from(new Set(ids)));
    setShowOverrideModal(false);
    setManagerNote("");
    setOverrideRecorded(true);
    setTimeout(() => setOverrideRecorded(false), 4000);
  }, [currentResult, schedule, managerNote, involvedEmployeeIds, addOverrideEntry]);

  const handleDismissOverride = useCallback(() => {
    setShowOverrideModal(false);
    setManagerNote("");
  }, []);

  if (!schedule) {
    return (
      <div className="stag-watermark animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rollout Stress Test</h1>
          <p className="text-sm text-text-secondary mt-1">
            Simulate operational scenarios and test roster resilience
          </p>
        </div>
        <div className="liquid-glass flex items-center justify-center rounded-xl p-12">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 100 100" className="mx-auto mb-3 text-accent-teal/40">
              <path d="M50 8L56 28L72 18L62 34L80 32L66 42L84 50L64 50L74 62L54 52L54 72L46 72L46 52L26 62L36 50L16 50L34 42L20 32L38 34L28 18L44 28Z" fill="currentColor"/>
            </svg>
            <p className="text-sm text-text-muted">
              Generate a schedule first, then run the stress test
            </p>
            <p className="mt-2 text-xs text-text-muted">
              The test evaluates your roster against 5 operational personas
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
          <h1 className="text-xl font-semibold tracking-tight">Rollout Stress Test</h1>
          <p className="text-sm text-text-secondary mt-1">
            Evaluate this week's roster against 5 operational personas
          </p>
        </div>
        <button
          onClick={handleRunTest}
          disabled={isRunning}
          className="liquid-glass rounded-lg px-5 py-2 text-sm font-medium text-text-primary transition-all duration-150 active:scale-[0.97] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-text-muted border-t-transparent" />
              Analysing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Run Stress Test
            </span>
          )}
        </button>
      </div>

      {/* Current result (or empty state) */}
      {!currentResult && (
        <div className="liquid-glass rounded-xl p-8 text-center">
          <p className="text-sm text-text-muted">
            Ready to test. Click "Run Stress Test" to evaluate this roster against all 5 personas.
          </p>
        </div>
      )}

      {/* Persona result cards */}
      {currentResult && (
        <div className="space-y-4">
          {/* Overall verdict banner */}
          <div className={`rounded-xl border p-4 ${
            currentResult.overallVerdict === "APPROVE"
              ? "border-verd-approve/30 bg-verd-approve-bg"
              : currentResult.overallVerdict === "CAUTION"
                ? "border-verd-caution/30 bg-verd-caution-bg"
                : "border-verd-reject/30 bg-verd-reject-bg"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Overall Verdict</p>
                <p className={`text-lg font-bold ${
                  currentResult.overallVerdict === "APPROVE"
                    ? "text-verd-approve"
                    : currentResult.overallVerdict === "CAUTION"
                      ? "text-verd-caution"
                      : "text-verd-reject"
                }`}>
                  {VERDICT_CONFIG[currentResult.overallVerdict].icon}{" "}
                  {currentResult.overallVerdict}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-verd-approve">{currentResult.summary.approved} Approved</span>
                <span className="text-xs text-verd-caution">{currentResult.summary.cautioned} Cautioned</span>
                <span className="text-xs text-verd-reject">{currentResult.summary.rejected} Rejected</span>
              </div>
            </div>
          </div>

          {/* Persona cards */}
          {currentResult.personaResults.map((persona) => (
            <PersonaCard
              key={persona.personaId}
              result={persona}
              isExpanded={expandedPersona === persona.personaId}
              onToggle={() =>
                setExpandedPersona(
                  expandedPersona === persona.personaId ? null : persona.personaId,
                )
              }
            />
          ))}

          {/* Override confirmation */}
          {overrideRecorded && (
            <div className="animate-slide-up flex items-center gap-3 rounded-xl border border-verd-approve/30 bg-verd-approve-bg p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verd-approve/20 text-sm">
                ✅
              </span>
              <div>
                <p className="text-sm font-medium text-verd-approve">Override recorded</p>
                <p className="text-xs text-text-secondary">
                  Filed to the Nadir Archive with your justification, verdict snapshot, and mitigations.
                </p>
              </div>
            </div>
          )}

          {/* Override CTA if rejected */}
          {hasRejection && !showOverrideModal && (
            <div className="rounded-xl border border-verd-reject/20 bg-verd-reject-bg/30 p-4">
              <p className="text-sm text-text-secondary">
                This schedule was <span className="font-semibold text-verd-reject">REJECTED</span> by one or more personas.
                A Manager Override is required to proceed with this roster.
              </p>
              <button
                onClick={() => setShowOverrideModal(true)}
                className="mt-3 rounded-lg border border-verd-reject/40 px-4 py-2 text-xs font-medium text-verd-reject transition-all duration-150 hover:bg-verd-reject-bg active:scale-[0.97]"
              >
                Open Manager Override
              </button>
            </div>
          )}
        </div>
      )}

      {/* Past results */}
      {pastResults.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary">Recent Stress Tests</h3>
          <div className="space-y-2">
            {pastResults.slice(1).map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentResult(r)}
                className={`liquid-glass w-full rounded-xl p-3 text-left transition-all duration-150 ${
                  currentResult?.id === r.id ? "ring-1 ring-accent-teal/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {new Date(r.timestamp).toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium ${
                    r.overallVerdict === "APPROVE"
                      ? "text-verd-approve"
                      : r.overallVerdict === "CAUTION"
                        ? "text-verd-caution"
                        : "text-verd-reject"
                  }`}>
                    {r.overallVerdict}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manager Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="liquid-glass mx-4 w-full max-w-lg rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-verd-reject-bg text-lg">
                ⚠️
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Manager Override Required</h2>
                <p className="text-xs text-text-muted">
                  This schedule was rejected. You can override with a management note.
                </p>
              </div>
            </div>

            {/* Rejection summary */}
            <div className="mb-4 space-y-2">
              {currentResult?.personaResults
                .filter((r) => r.verdict === "REJECT" || r.verdict === "CAUTION")
                .map((r) => (
                  <div key={r.personaId} className="rounded-lg bg-bg-hover p-3">
                    <div className="flex items-center gap-2">
                      <span>{r.personaIcon}</span>
                      <span className="text-xs font-medium text-text-primary">{r.personaName}</span>
                      <span className={`ml-auto text-xs font-medium ${
                        r.verdict === "REJECT" ? "text-verd-reject" : "text-verd-caution"
                      }`}>
                        {r.verdict}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {r.findings.slice(0, 2).map((f, i) => (
                        <li key={i} className="text-[10px] text-text-muted">{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>

            {/* Manager note */}
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              placeholder="Enter override justification (required)..."
              className="w-full rounded-lg border border-glass-border bg-bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal/40 resize-none"
              rows={3}
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={handleDismissOverride}
                className="rounded-lg px-4 py-2 text-xs font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!managerNote.trim()}
                className="rounded-lg bg-verd-reject px-4 py-2 text-xs font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Override & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaCard({
  result,
  isExpanded,
  onToggle,
}: {
  result: StressTestPersonaResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = VERDICT_CONFIG[result.verdict];

  return (
    <div className={`liquid-glass overflow-hidden rounded-xl transition-all duration-200`}>
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-bg-hover/30"
      >
        <span className="text-lg">{result.personaIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{result.personaName}</p>
          <p className="text-[11px] text-text-muted">{result.personaTitle}</p>
        </div>
        <div className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${config.bg} ${config.text}`}>
          {config.icon} {config.label}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded findings */}
      {isExpanded && (
        <div className="border-t border-glass-border px-4 pb-4 pt-3">
          <ul className="space-y-1.5">
            {result.findings.map((finding, i) => {
              const isWarning = finding.startsWith("⚠️");
              const isCritical = finding.startsWith("🔴");
              const isPositive = finding.startsWith("✅");
              return (
                <li
                  key={i}
                  className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                    isCritical
                      ? "bg-verd-reject-bg/20 text-verd-reject"
                      : isWarning
                        ? "bg-verd-caution-bg/20 text-verd-caution"
                        : isPositive
                          ? "bg-verd-approve-bg/20 text-verd-approve"
                          : "text-text-secondary"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{finding.slice(0, 2)}</span>
                  <span>{finding.slice(2)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}