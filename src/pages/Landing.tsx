import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ShieldAlert, Sun, Mic, LayoutDashboard, Zap, ShieldCheck, Printer } from "lucide-react";
import StagIcon from "../components/StagIcon";

const WORKFLOW_STEPS = [
  {
    number: "1",
    label: "Scan Fleet Roster",
    icon: <LayoutDashboard size={20} />,
    desc: "Review live fatigue metrics across all personnel",
  },
  {
    number: "2",
    label: "Run 5-Persona AI Stress Test",
    icon: <Zap size={20} />,
    desc: "Simulate operational scenarios and verify resilience",
  },
  {
    number: "3",
    label: "Voice Justification & Override",
    icon: <Mic size={20} />,
    desc: "Manager records voice override via Speechmatics",
  },
  {
    number: "4",
    label: "Print Dispatch Manifest",
    icon: <Printer size={20} />,
    desc: "Signed, proof-carrying dispatch sheet for compliance",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const scrollToWorkflow = () => {
    document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ── Block 1: Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        {/* Decorative stag watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <StagIcon size={320} variant="watermark" className="text-chrome/20" />
        </div>

        {/* Badge tag */}
        <span className="stamp-badge border-rose/40 text-rose mb-6">
          ICAO & EASA Compliance Engine
        </span>

        {/* Headline */}
        <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl text-center max-w-3xl leading-tight">
          NadirPoise{" "}
          <span className="font-serif italic font-normal text-text-secondary">
            — Proof-Carrying Circadian Safety Engine
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-2xl text-center text-sm text-text-secondary leading-relaxed sm:text-base">
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
            <span>3-Min Demo Workflow</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </section>

      {/* ── Block 2: Value Propositions ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: The Problem */}
            <div className="paper-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-verd-reject-bg text-verd-reject">
                <ShieldAlert size={20} />
              </div>
              <span className="stamp-badge border-verd-reject/40 text-verd-reject mb-2">PROBLEM</span>
              <h3 className="font-heading text-lg font-bold text-text-primary">The Nadir Window Crisis</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                High-stakes night shifts (02:00–05:00) cause cognitive drop-offs and
                dispatch errors. Traditional fatigue management relies on self-reporting
                — unreliable and non-auditable.
              </p>
            </div>

            {/* Card 2: NASA POWER USP */}
            <div className="paper-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-verd-approve-bg text-verd-approve">
                <Sun size={20} />
              </div>
              <span className="stamp-badge border-accent-amber/40 text-accent-amber mb-2">ZERO HALLUCINATION</span>
              <h3 className="font-heading text-lg font-bold text-text-primary">NASA POWER Proof Receipts</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Live geographic solar irradiance &amp; light calibration with 100%
                auditable evidence logs. No AI guesswork — verifiable satellite data.
              </p>
            </div>

            {/* Card 3: Voice Override */}
            <div className="paper-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-[#EFF6FF] text-accent-blue">
                <Mic size={20} />
              </div>
              <span className="stamp-badge border-accent-blue/40 text-accent-blue mb-2">HUMAN-IN-THE-LOOP</span>
              <h3 className="font-heading text-lg font-bold text-text-primary">Speechmatics Voice Override</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Manager voice justifications with mandatory two-step dispatch
                countersigns. Every override is archived with a verified transcript.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Block 3: Workflow Preview ── */}
      <section id="workflow" className="px-4 pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="stamp-badge border-chrome/40 text-chrome-dark mb-4">WORKFLOW</span>
          <h2 className="font-heading text-2xl font-bold text-text-primary">
            3-Min Demo Workflow
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            From roster scan to signed dispatch manifest — in four steps.
          </p>

          {/* Flow diagram */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={step.number} className="relative">
                <div className="liquid-glass flex flex-col items-center p-6 text-center">
                  <div className="stamp-badge border-rose/40 text-rose mb-3">{step.number}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-bg-elevated text-text-secondary">
                    {step.icon}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-text-primary">{step.label}</h3>
                  <p className="mt-1 text-[11px] text-text-muted">{step.desc}</p>
                </div>
                {/* Arrow connector (desktop) */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-chrome-dark/40 lg:block">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <button
            onClick={() => navigate("/login")}
            className="btn-chrome mt-10 inline-flex items-center gap-2 rounded-sm px-8 py-3 text-sm font-medium"
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#334155]/15 px-4 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[10px] font-mono text-text-muted/50">
          <span>NADIRPOISE v2.0 · ICAO &amp; EASA COMPLIANCE</span>
          <span>NEXAGLOBAL AIR-HUB · CGK</span>
        </div>
      </footer>
    </div>
  );
}