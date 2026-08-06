import { useState, useEffect, useCallback } from "react";
import { fetchLiveContext, type BrightDataContext } from "../services/brightDataService";

export default function BrightDataTicker() {
  const [context, setContext] = useState<BrightDataContext | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const refresh = useCallback(async () => {
    const ctx = await fetchLiveContext();
    setContext(ctx);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [refresh]);

  if (!context) return null;

  return (
    <div
      className={`ticker-ribbon relative flex items-center gap-3 rounded-lg border px-3 py-1.5 text-[11px] ${
        context.isLive
          ? "border-accent-amber/20 bg-accent-amber/5"
          : "border-glass-border bg-glass-bg/40 backdrop-blur-md"
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Live dot */}
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            context.isLive ? "bg-fatigue-red animate-pulse" : "bg-text-muted"
          }`}
        />
        <span className="hidden font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted sm:inline">
          {context.isLive ? "LIVE" : "OPS"}
        </span>
      </span>

      {/* Scrolling ticker text */}
      <div className="relative flex-1 overflow-hidden py-0.5">
        <div
          className={`whitespace-nowrap ${isPaused ? "" : "animate-ticker-scroll"}`}
          style={{ animationDuration: "25s" }}
        >
          <span className="inline-block">
            <span className="text-accent-amber font-semibold">⏺ {context.headline}</span>
            <span className="mx-4 text-text-muted">//</span>
            <span className="text-text-muted">{context.source}</span>
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-mono text-text-muted/60">{context.freshness}</span>
            <span className="mx-4 text-text-muted">//</span>
            <span className="text-text-muted">NadirPoise Operational Intelligence — NexaGlobal Air-Hub, CGK</span>
          </span>
          {/* Duplicate for seamless loop */}
          <span className="ml-8 inline-block">
            <span className="text-accent-amber font-semibold">⏺ {context.headline}</span>
            <span className="mx-4 text-text-muted">//</span>
            <span className="text-text-muted">{context.source}</span>
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-mono text-text-muted/60">{context.freshness}</span>
            <span className="mx-4 text-text-muted">//</span>
            <span className="text-text-muted">NadirPoise Operational Intelligence — NexaGlobal Air-Hub, CGK</span>
          </span>
        </div>
      </div>

      {/* Pause hint */}
      {isPaused && (
        <span className="shrink-0 text-[9px] text-text-muted/40 italic">paused</span>
      )}
    </div>
  );
}