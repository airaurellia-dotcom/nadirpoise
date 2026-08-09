import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  ShieldAlert,
  Sun,
  Mic,
  Smartphone,
  ShieldCheck,
  User,
  ClipboardCheck,
  LogIn,
  LayoutDashboard,
  Zap,
  Printer,
  Moon,
  AlertTriangle,
  Activity,
  CheckCircle2,
} from "lucide-react";
import StagIcon from "../components/StagIcon";
import { PERSONA_LABELS } from "../types";
import type { Persona } from "../types";

const PERSONA_LIST: Persona[] = ["shift_manager", "employee", "auditor"];

const PERSONA_ICONS: Record<Persona, React.ReactNode> = {
  shift_manager: <ShieldCheck size={14} />,
  employee: <User size={14} />,
  auditor: <ClipboardCheck size={14} />,
};

const WORKFLOW_STEPS = [
  {
    number: "1",
    label: "Scan Fleet Roster",
    icon: <LayoutDashboard size={20} />,
    desc: "Review live fatigue metrics across all personnel and identify red-zone crew members instantly.",
  },
  {
    number: "2",
    label: "Run 5-Persona AI Stress Test",
    icon: <Zap size={20} />,
    desc: "Simulate operational scenarios across shift manager, employee, and auditor personas to verify resilience.",
  },
  {
    number: "3",
    label: "Voice Justification & Override",
    icon: <Mic size={20} />,
    desc: "Manager records voice override via Speechmatics with mandatory two-step dispatch countersigns.",
  },
  {
    number: "4",
    label: "Print Dispatch Manifest",
    icon: <Printer size={20} />,
    desc: "Signed, proof-carrying dispatch sheet with NASA POWER receipts for full compliance and audit readiness.",
  },
];

const USP_CARDS = [
  {
    icon: <ShieldAlert size={24} />,
    title: "Real-Time Nadir Detection",
    desc: "Biological risk engine that automatically pinpoints high-risk shift windows and halts unsafe dispatches before incidents happen.",
  },
  {
    icon: <Sun size={24} />,
    title: "NASA POWER Proof Receipts",
    desc: "Live geographic solar irradiance & light calibration data creating 100% auditable, tamper-proof compliance evidence.",
  },
  {
    icon: <Mic size={24} />,
    title: "Speechmatics Voice Override",
    desc: "Manager voice justification gate protected by mandatory two-step dispatch countersigns for human-in-the-loop control.",
  },
  {
    icon: <Smartphone size={24} />,
    title: "Safe Scheduling in Your Pocket",
    desc: "Delivers personalized circadian recovery windows, light-exposure guides, and shift alerts directly to frontline workers' devices.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const scrollToWorkflow = () => {
    document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePersonaSelect = (p: Persona) => {
    setDropdownOpen(false);
    navigate("/login", { state: { preselectedPersona: p } });
  };

  return (
    <div className="min-h-screen bg-bg-base font-sans">
      {/* ── Top Brand Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#334155]/10 bg-bg-base/70 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <StagIcon size={22} className="shrink-0 text-sage-dark" />
            <span className="font-heading text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              NadirPoise
            </span>
            <span className="ml-1 hidden items-center gap-1.5 rounded-sm border border-[#334155]/15 bg-white/70 px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.06em] text-text-muted sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-green" />
              </span>
              NexaGlobal Terminal · 24/7
            </span>
          </div>
        </div>
      </header>

      {/* ── Floating Profile Switcher (top-right) ── */}
      <div ref={dropdownRef} className="fixed right-4 top-4 z-50">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="btn-chrome flex items-center gap-2 rounded-sm px-3 py-2 text-[11px] font-medium"
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-bg-elevated text-xs">
            <User size={13} />
          </span>
          <span>Profile</span>
          <ChevronDown
            size={12}
            className={`shrink-0 text-text-muted transition-transform duration-150 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-[280px] animate-fade-in rounded-sm border border-[#334155]/15 bg-white py-1 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]"
          >
            <p className="px-3 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Select Perspective
            </p>
            {PERSONA_LIST.map((p) => (
              <button
                key={p}
                role="menuitem"
                onClick={() => handlePersonaSelect(p)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors duration-150 hover:bg-bg-hover"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#334155]/15 bg-white text-xs">
                  {PERSONA_ICONS[p]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{PERSONA_LABELS[p]}</p>
                  <p className="text-[10px] text-text-muted">
                    {p === "shift_manager"
                      ? "Full operational access"
                      : p === "employee"
                        ? "Personal circadian view"
                        : "Archive & compliance"}
                  </p>
                </div>
              </button>
            ))}
            <div className="mt-1 border-t border-[#334155]/10 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/login");
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-text-secondary transition-colors duration-150 hover:bg-bg-hover hover:text-text-primary"
              >
                <LogIn size={14} />
                <span className="font-medium">Log In / Sign In</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1: HERO
          ══════════════════════════════════════════ */}
      <section className="cream-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-12">
        {/* ── Subtle pastel gradient overlay (pink → purple → blue) ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            background: 'radial-gradient(circle at 50% -10%, rgba(244, 114, 182, 0.12) 0%, rgba(168, 85, 247, 0.10) 30%, rgba(59, 130, 246, 0.08) 55%, rgba(248, 246, 240, 0.95) 80%, #F8F6F0 100%)',
          }}
        />
        {/* Decorative stag watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <StagIcon size={320} variant="watermark" className="text-chrome/20" />
        </div>

        {/* Ambient brand watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
        >
          <span className="hero-brand-watermark">NADIRPOISE</span>
        </div>

        {/* Header Badge */}
        <span className="stamp-badge border-rose/40 text-rose mb-6">
          ICAO & EASA Compliance Engine — Proof-Carrying Circadian Safety
        </span>

        {/* Headline */}
        <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl text-center max-w-4xl leading-tight">
          Smarter Scheduling.{" "}
          <span className="font-serif italic font-normal text-text-secondary">
            Zero Hallucinations.
          </span>{" "}
          Confident Compliance.
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-3xl text-center text-sm text-text-secondary leading-relaxed sm:text-base">
          Eliminating 24/7 workforce fatigue, microsleep risks, and AI hallucinations
          with verifiable NASA POWER solar data.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="btn-chrome flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-medium"
          >
            <span>Launch Operations Portal</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={scrollToWorkflow}
            className="flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-bg-hover hover:text-text-primary active:scale-[0.97]"
          >
            <span>Explore Demo Workflow</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* ── Hero Visual: Fleet Fatigue Score Card ── */}
        <div className="relative mt-16 w-full max-w-lg animate-slide-up">
          {/* Floating glass chips */}
          <div className="glass-chip absolute -left-3 -top-3 z-10 rotate-[-3deg] md:-left-6">
            <Moon size={10} />
            <span>02:00–05:00 NADIR LOCKED</span>
          </div>
          <div className="glass-chip absolute -bottom-2 -right-2 z-10 rotate-[2deg] md:-bottom-3 md:-right-4">
            <CheckCircle2 size={10} className="text-accent-green" />
            <span>EASA AUDIT READY</span>
          </div>

          {/* The mock score card */}
          <div className="hero-score-card p-5 md:p-6">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-[#334155]/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-chrome-dark" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-text-muted">
                  NadirPoise · Fleet Fatigue Score
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-accent-green">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" />
                LIVE
              </span>
            </div>

            {/* Score display */}
            <div className="flex items-end gap-4 py-4">
              <div className="flex flex-col">
                <span className="font-heading text-5xl font-bold leading-none text-text-primary md:text-6xl">
                  78%
                </span>
                <span className="mt-1 text-xs font-mono font-semibold uppercase tracking-[0.08em] text-accent-green">
                  Safe / Compliant
                </span>
              </div>
              {/* Mini gauge bars */}
              <div className="flex flex-1 flex-col gap-1.5 pb-2">
                <div className="h-1.5 w-full rounded-full bg-bg-elevated">
                  <div className="h-full w-[78%] rounded-full bg-accent-green transition-all" />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-text-muted">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 border-t border-[#334155]/10 pt-3">
              <div className="text-center">
                <span className="block text-[11px] font-mono font-bold text-text-primary">12</span>
                <span className="block text-[9px] font-mono text-text-muted">CREW ACTIVE</span>
              </div>
              <div className="text-center">
                <span className="block text-[11px] font-mono font-bold text-accent-green">0</span>
                <span className="block text-[9px] font-mono text-text-muted">RED-ZONE</span>
              </div>
              <div className="text-center">
                <span className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-accent-green">
                  <CheckCircle2 size={10} />
                  VERIFIED
                </span>
                <span className="block text-[9px] font-mono text-text-muted">NASA POWER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2: THE PROBLEM (THE NADIR WINDOW CRISIS)
          ══════════════════════════════════════════ */}
      <section className="sage-section px-4 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          {/* Section label */}
          <span className="stamp-badge border-rose/40 text-rose mb-4 block w-fit">THE PROBLEM</span>

          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl max-w-2xl">
            High-Stakes Night Shifts Are Broken by Fatigue
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card A: The Human Toll */}
            <div className="paper-card p-6 md:p-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-verd-reject-bg text-verd-reject">
                <Moon size={22} />
              </div>
              <span className="stamp-badge border-verd-reject/40 text-verd-reject mb-2 block w-fit">
                THE HUMAN TOLL
              </span>
              <h3 className="font-heading text-xl font-bold text-text-primary">
                The 02:00–05:00 AM Nadir Window
              </h3>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                Biological circadian dips drop cognitive performance by up to 40%, creating
                critical microsleep hazards during high-stakes logistics operations. The
                human body's nadir window turns experienced crew into liability risks — with
                reaction times comparable to 0.08% BAC impairment.
              </p>
              {/* Impact highlight */}
              <div className="mt-4 rounded-sm border border-verd-reject/20 bg-verd-reject-bg/40 px-3 py-2">
                <span className="text-[11px] font-mono font-semibold text-verd-reject">
                  ↓ 40% COGNITIVE PERFORMANCE
                </span>
              </div>
            </div>

            {/* Card B: The Compliance Gap */}
            <div className="paper-card p-6 md:p-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-verd-caution-bg text-verd-caution">
                <AlertTriangle size={22} />
              </div>
              <span className="stamp-badge border-verd-caution/40 text-verd-caution mb-2 block w-fit">
                THE COMPLIANCE GAP
              </span>
              <h3 className="font-heading text-xl font-bold text-text-primary">
                Unverifiable Schedules &amp; AI Hallucinations
              </h3>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                Standard scheduling algorithms ignore live solar exposure and biological
                recovery, leaving operations vulnerable to audit failures and safety
                breaches. Black-box AI fatigue models generate plausible-looking but
                unverifiable risk scores — impossible to defend in ICAO or EASA audits.
              </p>
              {/* Impact highlight */}
              <div className="mt-4 rounded-sm border border-verd-caution/20 bg-verd-caution-bg/40 px-3 py-2">
                <span className="text-[11px] font-mono font-semibold text-verd-caution">
                  <AlertTriangle size={11} className="inline-block mr-1 -mt-0.5" />
                  ZERO AUDIT TRAIL
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3: THE SOLVING USPs (4 CORE VALUE PROPOSITIONS)
          ══════════════════════════════════════════ */}
      <section className="bg-bg-base px-4 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          {/* Section label */}
          <span className="stamp-badge border-chrome-dark/40 text-chrome-dark mb-4 block w-fit">
            THE SOLUTION
          </span>

          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl max-w-2xl">
            Four Pillars of Circadian Safety
          </h2>
          <p className="mt-3 max-w-lg text-sm text-text-secondary">
            From detection to documentation — every layer is designed for verifiable, human-in-the-loop compliance.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {USP_CARDS.map((usp, idx) => (
              <div key={idx} className="glass-sage group p-6 md:p-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-white/60 text-sage-dark shadow-sm transition-transform duration-200 group-hover:scale-105">
                  {usp.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {usp.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {usp.desc}
                </p>
                {/* Decorative hairline */}
                <div className="mt-4 h-px bg-gradient-to-r from-sage-light/60 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4: INTERACTIVE 4-STEP WORKFLOW PREVIEW
          ══════════════════════════════════════════ */}
      <section id="workflow" className="sage-section px-4 py-24 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Section label */}
          <span className="stamp-badge border-rose/40 text-rose mb-4">WORKFLOW</span>

          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Interactive 4-Step Workflow Preview
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm text-text-secondary">
            From roster scan to signed dispatch manifest — in four verifiable steps.
            Click any step to explore the demo workflow.
          </p>

          {/* Flow diagram */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={step.number} className="relative group">
                <button
                  onClick={() => navigate("/login")}
                  className="glass-sage flex w-full flex-col items-center p-6 text-center cursor-pointer transition-all duration-200"
                >
                  {/* Number ring */}
                  <div className="stamp-badge border-sage/40 text-sage mb-3">{step.number}</div>

                  {/* Icon */}
                  <div className="flex h-13 w-13 items-center justify-center rounded-sm bg-white/60 text-sage-dark shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:text-sage">
                    {step.icon}
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-text-primary">{step.label}</h3>
                  <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{step.desc}</p>

                  {/* Arrow indicator */}
                  <span className="mt-3 flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-[0.08em] text-sage opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Click to explore <ArrowRight size={10} />
                  </span>
                </button>

                {/* Arrow connector (desktop) */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-sage-dark/25 lg:block">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <button
            onClick={() => navigate("/login")}
            className="btn-chrome mt-12 inline-flex items-center gap-2 rounded-sm px-8 py-3 text-sm font-medium"
          >
            <span>Launch Operations Portal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#334155]/15 px-4 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[10px] font-mono text-text-muted/50">
          <span>NADIRPOISE v2.0 · ICAO &amp; EASA COMPLIANCE</span>
          <span>NEXAGLOBAL AIR-HUB · CGK</span>
        </div>
      </footer>
    </div>
  );
}