import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, User, ShieldCheck, ClipboardCheck } from "lucide-react";
import { useAppState } from "../context/AppContext";
import { DEMO_CREDENTIALS } from "../constants/config";
import { PERSONA_DEFAULT_ROUTE } from "../types";
import type { Persona } from "../types";

const PERSONA_BUTTONS: { persona: Persona; label: string; icon: React.ReactNode; accent: string }[] = [
  {
    persona: "shift_manager",
    label: "Log In as Shift Manager",
    icon: <ShieldCheck size={16} />,
    accent: "border-rose/40 text-rose",
  },
  {
    persona: "employee",
    label: "Log In as Frontline Staff (Amir Hassan)",
    icon: <User size={16} />,
    accent: "border-chrome-dark/40 text-chrome-dark",
  },
  {
    persona: "auditor",
    label: "Log In as Safety Auditor",
    icon: <ClipboardCheck size={16} />,
    accent: "border-brass/40 text-brass",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppState();
  const [selectedPersona, setSelectedPersona] = useState<Persona>("shift_manager");

  const handleQuickLogin = useCallback(
    (persona: Persona) => {
      setSelectedPersona(persona);
      login(persona);
      navigate(PERSONA_DEFAULT_ROUTE[persona]);
    },
    [login, navigate],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      login(selectedPersona);
      navigate(PERSONA_DEFAULT_ROUTE[selectedPersona]);
    },
    [login, selectedPersona, navigate],
  );

  const creds = DEMO_CREDENTIALS[selectedPersona];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base">
      {/* Organic sage green curves — decorative background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle at 30% 70%, #E2EAD8 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle at 70% 30%, #1D3B2A 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 h-[300px] w-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle at 50% 50%, #C5D5B0 0%, transparent 60%)" }}
        />
      </div>

      {/* Back to Landing */}
      <button
        onClick={() => navigate("/")}
        className="absolute left-6 top-6 z-10 flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
      >
        <ArrowLeft size={14} />
        <span>Back to Landing Page</span>
      </button>

      {/* Glass Card */}
      <div className="glass-panel relative z-10 mx-4 w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-xl font-bold tracking-tight text-text-primary">
            NadirPoise Operations Terminal
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            NexaGlobal Air-Hub Gate
          </p>
        </div>

        {/* One-click demo account switcher */}
        <div className="mb-6 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Quick Login
          </p>
          {PERSONA_BUTTONS.map((btn) => (
            <button
              key={btn.persona}
              onClick={() => handleQuickLogin(btn.persona)}
              className={`flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-left text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                selectedPersona === btn.persona
                  ? `${btn.accent} bg-white shadow-[2px_2px_0px_0px_rgba(30,41,59,0.1)]`
                  : "border-[#334155]/15 bg-white/80 text-text-secondary hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)]"
              }`}
            >
              <span className="shrink-0">{btn.icon}</span>
              <span className="flex-1">{btn.label}</span>
              {selectedPersona === btn.persona && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#334155]/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white/80 px-2 text-[9px] text-text-muted">OR</span>
          </div>
        </div>

        {/* Standard sign-in form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              value={creds.email}
              readOnly
              className="w-full rounded-sm border border-[#334155]/20 bg-white/80 px-3 py-2 text-xs text-text-primary shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)] focus:outline-none focus:border-rose/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={creds.password}
              readOnly
              className="w-full rounded-sm border border-[#334155]/20 bg-white/80 px-3 py-2 text-xs text-text-primary shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)] focus:outline-none focus:border-rose/40"
            />
          </div>
          <button
            type="submit"
            className="btn-chrome flex w-full items-center justify-center gap-2 rounded-sm px-4 py-3 text-sm font-medium"
          >
            <LogIn size={14} />
            <span>Sign In to Terminal</span>
          </button>
        </form>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-text-muted">
          Demo portal — no real authentication required
        </p>
      </div>
    </div>
  );
}