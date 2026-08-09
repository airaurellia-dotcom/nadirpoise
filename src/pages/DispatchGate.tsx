import { useState, useMemo, useCallback } from "react";
import { useAppState } from "../context/AppContext";
import { callOverrideAuditAI } from "../services/aiApiService";
import VoiceRecorder from "../components/VoiceRecorder";
import { ShieldCheck, Mic, AlertTriangle, CheckCircle, XCircle, Headset, FileText } from "lucide-react";
import type { PersonaVerdict, AIOverrideAuditResponse } from "../types";

type GateState = "OPEN" | "CONDITIONAL" | "BLOCKED" | "OVERRIDDEN";
type AuditPhase = "idle" | "auditing" | "verified" | "rejected";

function getGateState(verdict: PersonaVerdict | null, overrides: number): GateState {
  if (overrides > 0) return "OVERRIDDEN";
  if (!verdict) return "OPEN";
  if (verdict === "APPROVE") return "OPEN";
  if (verdict === "CAUTION") return "CONDITIONAL";
  return "BLOCKED";
}

const GATE_CONFIG: Record<GateState, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  OPEN: {
    label: "GATE OPEN — Dispatch Approved",
    icon: <CheckCircle size={20} />,
    color: "text-verd-approve",
    bg: "bg-verd-approve-bg",
    border: "border-verd-approve/30",
  },
  CONDITIONAL: {
    label: "GATE CONDITIONAL — Review Required",
    icon: <AlertTriangle size={20} />,
    color: "text-verd-caution",
    bg: "bg-verd-caution-bg",
    border: "border-verd-caution/30",
  },
  BLOCKED: {
    label: "GATE BLOCKED — Override Required",
    icon: <XCircle size={20} />,
    color: "text-verd-reject",
    bg: "bg-verd-reject-bg",
    border: "border-verd-reject/30",
  },
  OVERRIDDEN: {
    label: "GATE OVERRIDDEN — Manager Dispatch Active",
    icon: <ShieldCheck size={20} />,
    color: "text-chrome-dark",
    bg: "bg-bg-elevated",
    border: "border-chrome/30",
  },
};

export default function DispatchGate() {
  const { state, addOverrideEntry } = useAppState();
  const { schedule, archive, employees } = state;

  const [managerNote, setManagerNote] = useState("");
  const [mitigations, setMitigations] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // AI audit state
  const [auditPhase, setAuditPhase] = useState<AuditPhase>("idle");
  const [auditResult, setAuditResult] = useState<AIOverrideAuditResponse | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Latest stress test from archive
  const latestStressTest = useMemo(() => {
    const tests = archive.filter((e) => e.type === "stress_test" && e.stressTestResult);
    return tests.length > 0 ? tests[0].stressTestResult! : null;
  }, [archive]);

  // Override count
  const overrideCount = useMemo(() => {
    return archive.filter((e) => e.type === "override").length;
  }, [archive]);

  // Override log
  const overrideLog = useMemo(() => {
    return archive
      .filter((e) => e.type === "override" && e.overrideDetails)
      .slice(0, 10);
  }, [archive]);

  const currentVerdict = latestStressTest?.overallVerdict ?? null;
  const gateState = getGateState(currentVerdict, overrideCount);

  const handleTranscription = useCallback((text: string) => {
    setManagerNote((prev) => prev + " " + text);
  }, []);

  const toggleEmployee = useCallback((id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }, []);

  const handleIssueOverride = useCallback(async () => {
    if (!latestStressTest || !schedule || !managerNote.trim()) return;

    setAuditPhase("auditing");
    setAuditError(null);
    setAuditResult(null);

    try {
      const employeeNames = selectedEmployees.length > 0
        ? selectedEmployees.map((id) => employees.find((e) => e.id === id)?.name ?? id)
        : employees.map((e) => e.name);

      const result = await callOverrideAuditAI({
        managerNote: managerNote.trim(),
        selectedCrew: employeeNames,
        shiftId: schedule.weekStart,
      });

      if (result.is_valid) {
        setAuditResult(result);
        setAuditPhase("verified");

        // Proceed with override, including the AI audit data
        const ids = selectedEmployees.length > 0 ? selectedEmployees : employees.map((e) => e.id);
        addOverrideEntry(
          schedule,
          latestStressTest,
          `${managerNote.trim()}${mitigations ? ` — Mitigations: ${mitigations}` : ""}`,
          ids,
          result, // pass AI audit data
        );

        setManagerNote("");
        setMitigations("");
        setSelectedEmployees([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setAuditResult(result);
        setAuditPhase("rejected");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Audit service unavailable. Override recorded without AI verification.";
      setAuditError(message);
      // Fallback: proceed with override even without AI audit
      const ids = selectedEmployees.length > 0 ? selectedEmployees : employees.map((e) => e.id);
      addOverrideEntry(
        schedule,
        latestStressTest,
        `${managerNote.trim()}${mitigations ? ` — Mitigations: ${mitigations}` : ""}`,
        ids,
      );
      setManagerNote("");
      setMitigations("");
      setSelectedEmployees([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      setAuditPhase("idle");
    }
  }, [latestStressTest, schedule, managerNote, mitigations, selectedEmployees, employees, addOverrideEntry]);

  const gateConfig = GATE_CONFIG[gateState];

  if (!schedule) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Dispatch Gate</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">Gate &amp; AI Override Audit</p>
        </div>
        <div className="liquid-glass flex items-center justify-center p-12">
          <div className="text-center">
            <Headset size={48} className="mx-auto mb-3 text-[#334155]/30" />
            <p className="text-sm text-text-muted">Generate a schedule and run a stress test first to see dispatch gate status.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Dispatch Gate</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">Gate &amp; AI Override Audit</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="stamp-badge border-chrome/40 text-chrome-dark">
            {overrideCount} Override{overrideCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[9px] text-text-muted/50">ICAO/EASA · AIML</span>
        </div>
      </div>

      {/* Gate banner */}
      <div className={`liquid-glass flex flex-wrap items-center gap-4 border p-5 ${gateConfig.border} ${gateConfig.bg}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${gateConfig.color} opacity-80`}>
          {gateConfig.icon}
        </div>
        <div>
          <p className={`font-heading text-lg font-bold ${gateConfig.color}`}>{gateConfig.label}</p>
          {latestStressTest && (
            <p className="mt-0.5 text-xs text-text-secondary">
              Based on stress test from {new Date(latestStressTest.timestamp).toLocaleString()}
              {" · "}{latestStressTest.summary.approved} of {latestStressTest.summary.totalPersonas} personas approved
            </p>
          )}
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="animate-slide-up liquid-glass flex items-center gap-3 border-verd-approve/30 bg-verd-approve-bg p-4">
          <CheckCircle size={18} className="text-verd-approve" />
          <div>
            <p className="text-sm text-verd-approve">Override recorded and filed to the Nadir Archive</p>
            {auditResult?.cryptographic_receipt && (
              <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                Receipt: {auditResult.cryptographic_receipt.slice(0, 48)}...
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Audit Result Banner */}
      {auditPhase === "verified" && auditResult && (
        <div className="liquid-glass flex items-start gap-3 border-verd-approve/30 bg-verd-approve-bg p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-verd-approve" />
          <div>
            <p className="text-sm font-medium text-verd-approve">AI Compliance Verified</p>
            <p className="mt-1 text-xs text-text-secondary">{auditResult.compliance_summary}</p>
            <p className="mt-1 font-mono text-[10px] text-text-muted break-all">
              {auditResult.cryptographic_receipt}
            </p>
          </div>
        </div>
      )}

      {auditPhase === "rejected" && auditResult && (
        <div className="liquid-glass flex items-start gap-3 border-verd-caution/30 bg-verd-caution-bg p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-verd-caution" />
          <div>
            <p className="text-sm font-medium text-verd-caution">AI Audit — Compliance Concern</p>
            <p className="mt-1 text-xs text-text-secondary">{auditResult.compliance_summary}</p>
            <p className="mt-1 font-mono text-[10px] text-text-muted break-all">
              {auditResult.cryptographic_receipt}
            </p>
          </div>
        </div>
      )}

      {auditError && (
        <div className="liquid-glass flex items-start gap-3 border-verd-caution/30 bg-verd-caution-bg p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-verd-caution" />
          <div>
            <p className="text-sm font-medium text-verd-caution">AI Audit Unavailable</p>
            <p className="mt-1 text-xs text-text-secondary">{auditError}</p>
          </div>
        </div>
      )}

      {/* Voice Override Panel */}
      {(gateState === "BLOCKED" || gateState === "CONDITIONAL") && (
        <div className="paper-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Mic size={16} /> Voice Override — AI Audited
          </h2>

          {/* Loading state during AI audit */}
          {auditPhase === "auditing" && (
            <div className="mb-4 flex items-center gap-3 rounded-sm bg-bg-elevated p-4">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-amber border-t-transparent" />
              <span className="text-xs text-text-secondary">
                Auditing justification via AIML API (ICAO/EASA compliance check)...
              </span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">Record Override Justification</label>
            <div className="flex items-start gap-3">
              <VoiceRecorder onTranscription={handleTranscription} disabled={auditPhase === "auditing"} />
              <span className="text-[10px] text-text-muted leading-relaxed pt-1">
                Speak your override justification. The transcript will be AI-audited for ICAO/EASA compliance.
              </span>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-1">Manager Note (transcribed or typed)</label>
            <textarea
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              placeholder="Override justification..."
              className="w-full resize-none rounded-sm border border-[#334155]/20 bg-white px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rose/40 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]"
              rows={3}
              disabled={auditPhase === "auditing"}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-1">Mitigations (optional)</label>
            <input
              type="text"
              value={mitigations}
              onChange={(e) => setMitigations(e.target.value)}
              placeholder="e.g., Reduced night max to 3 consecutive, added 2h rest break"
              className="w-full rounded-sm border border-[#334155]/20 bg-white px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rose/40 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]"
              disabled={auditPhase === "auditing"}
            />
          </div>

          {/* Employee selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Affected Employees (select or leave empty for all)
            </label>
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  disabled={auditPhase === "auditing"}
                  className={`rounded-sm border px-2.5 py-1 text-[10px] font-medium transition-all duration-150 ${
                    selectedEmployees.includes(emp.id)
                      ? "border-rose/40 bg-rose/5 text-rose"
                      : "border-[#334155]/15 text-text-secondary hover:bg-bg-hover"
                  } disabled:opacity-40`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleIssueOverride}
            disabled={!managerNote.trim() || auditPhase === "auditing"}
            className="btn-chrome flex items-center gap-2 rounded-sm px-5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {auditPhase === "auditing" ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-text-muted border-t-transparent" />
                Auditing...
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                Issue Override (AI-Audited)
              </>
            )}
          </button>
        </div>
      )}

      {/* Override log */}
      <div className="paper-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <FileText size={16} /> Override Log
        </h2>
        {overrideLog.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Mic size={32} className="text-text-muted/40" />
            <p className="text-xs text-text-muted">No overrides recorded yet. Voice-record a note to open the gate.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overrideLog.map((entry) => (
              <div key={entry.id} className="rounded-sm border border-[#334155]/10 bg-bg-elevated p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-text-muted">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="stamp-badge border-chrome/40 text-chrome-dark">OVERRIDE</span>
                </div>
                <p className="text-xs text-text-primary">{entry.overrideDetails?.managerNote}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  Affected: {entry.overrideDetails?.employeeIds.length} employee(s)
                </p>
                {entry.overrideDetails?.aiAudit && (
                  <div className="mt-2 flex items-center gap-2 rounded-sm bg-verd-approve-bg px-2 py-1">
                    <ShieldCheck size={10} className="text-verd-approve" />
                    <span className="font-mono text-[9px] text-verd-approve">
                      {entry.overrideDetails.aiAudit.is_valid ? "AI VERIFIED" : "AI FLAGGED"}
                    </span>
                    <span className="text-[9px] text-text-muted truncate ml-auto">
                      {entry.overrideDetails.aiAudit.cryptographic_receipt.slice(0, 32)}...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted/50">
        <span>NADIRPOISE v2.0 · DISPATCH GATE</span>
        <span>ICAO/EASA · AIML AUDITED</span>
      </div>
    </div>
  );
}