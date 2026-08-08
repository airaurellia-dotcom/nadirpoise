import { useState, useMemo, useCallback } from "react";
import { useAppState } from "../context/AppContext";
import VoiceRecorder from "../components/VoiceRecorder";
import { ShieldCheck, Mic, AlertTriangle, CheckCircle, XCircle, Headset } from "lucide-react";
import type { PersonaVerdict } from "../types";

type GateState = "OPEN" | "CONDITIONAL" | "BLOCKED" | "OVERRIDDEN";

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

  const handleIssueOverride = useCallback(() => {
    if (!latestStressTest || !schedule || !managerNote.trim()) return;
    const ids = selectedEmployees.length > 0 ? selectedEmployees : employees.map((e) => e.id);
    const result = latestStressTest;
    addOverrideEntry(schedule, result, `${managerNote.trim()}${mitigations ? ` — Mitigations: ${mitigations}` : ""}`, ids);
    setManagerNote("");
    setMitigations("");
    setSelectedEmployees([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }, [latestStressTest, schedule, managerNote, mitigations, selectedEmployees, employees, addOverrideEntry]);

  const gateConfig = GATE_CONFIG[gateState];

  if (!schedule) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Dispatch Gate</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">Gate &amp; Voice Override</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Dispatch Gate</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">Gate &amp; Voice Override</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="stamp-badge border-chrome/40 text-chrome-dark">
            {overrideCount} Override{overrideCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Gate banner */}
      <div className={`liquid-glass flex items-center gap-4 border p-5 ${gateConfig.border} ${gateConfig.bg}`}>
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
          <p className="text-sm text-verd-approve">Override recorded and filed to the Nadir Archive</p>
        </div>
      )}

      {/* Voice Override Panel */}
      {(gateState === "BLOCKED" || gateState === "CONDITIONAL") && (
        <div className="paper-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Mic size={16} /> Voice Override
          </h2>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">Record Override Justification</label>
            <div className="flex items-start gap-3">
              <VoiceRecorder onTranscription={handleTranscription} />
              <span className="text-[10px] text-text-muted leading-relaxed pt-1">
                Speak your override justification. The transcript will appear below.
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
                  className={`rounded-sm border px-2.5 py-1 text-[10px] font-medium transition-all duration-150 ${
                    selectedEmployees.includes(emp.id)
                      ? "border-rose/40 bg-rose/5 text-rose"
                      : "border-[#334155]/15 text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleIssueOverride}
            disabled={!managerNote.trim()}
            className="btn-chrome flex items-center gap-2 rounded-sm px-5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={14} />
            Issue Override
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted/50">
        <span>NADIRPOISE v2.0 · DISPATCH GATE</span>
        <span>NEXAGLOBAL AIR-HUB · CGK</span>
      </div>
    </div>
  );
}