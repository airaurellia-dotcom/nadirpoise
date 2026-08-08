import { useState } from "react";
import { useAppState } from "../context/AppContext";
import { SUPABASE_URL, NASA_POWER_ENDPOINT, SPEECHMATICS_SECRET_NAME } from "../constants/config";
import { Sun, Database, Server, RefreshCw } from "lucide-react";
import type { AppSettings } from "../types";

type TabKey = "api" | "thresholds" | "station";

const TABS: { key: TabKey; label: string }[] = [
  { key: "api", label: "API & Integrations" },
  { key: "thresholds", label: "Circadian Thresholds & Rules Engine" },
  { key: "station", label: "Airport & Station Configuration" },
];

const AIRHUB_PRESETS = [
  { id: "CGK", name: "NexaGlobal Air-Hub · CGK", lat: -6.2088, lon: 106.8456 },
  { id: "SIN", name: "NexaGlobal Cargo · SIN", lat: 1.3521, lon: 103.8198 },
  { id: "DXB", name: "NexaGlobal Regional · DXB", lat: 25.2048, lon: 55.2708 },
];

export default function Settings() {
  const { state, updateSettings } = useAppState();
  const { settings } = state;
  const [activeTab, setActiveTab] = useState<TabKey>("api");

  const handleSlider = (key: "alertThreshold" | "hardRejectThreshold", value: number) => {
    updateSettings({
      thresholds: { ...settings.thresholds, [key]: value },
    } as Partial<AppSettings>);
  };

  const handleToggle = (key: "enforceILO48h" | "enforce11hRest") => {
    updateSettings({
      thresholds: { ...settings.thresholds, [key]: !settings.thresholds[key] },
    } as Partial<AppSettings>);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-text-primary">
          System Settings
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.06em] text-text-muted">
          Configure API integrations, circadian thresholds, and station parameters
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#334155]/15 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-sm px-4 py-2 text-xs font-medium transition-all duration-150 ${
              activeTab === tab.key
                ? "bg-bg-elevated text-text-primary shadow-[1px_1px_0px_0px_rgba(30,41,59,0.08)]"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab A: API & Integrations */}
      {activeTab === "api" && (
        <div className="space-y-4">
          {/* Speechmatics */}
          <div className="paper-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-verd-approve-bg text-verd-approve">
                  <MicIcon />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Speechmatics API</h3>
                  <p className="text-[10px] text-text-muted">Real-time voice transcription</p>
                </div>
              </div>
              <span className="stamp-badge border-verd-approve/50 text-verd-approve">
                Configured via Supabase Secrets
              </span>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              Secret name: <code className="rounded-sm bg-bg-elevated px-1 font-mono text-[10px]">{SPEECHMATICS_SECRET_NAME}</code>
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-fatigue-green" />
              <span>Speechmatics Demo Mode: Active</span>
            </div>
          </div>

          {/* NASA POWER */}
          <div className="paper-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#FFFBEB] text-accent-amber">
                  <Sun size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">NASA POWER API</h3>
                  <p className="text-[10px] text-text-muted">Solar irradiance &amp; light calibration</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-fatigue-green/30 bg-verd-approve-bg px-2.5 py-1 text-[10px] font-medium text-verd-approve">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-fatigue-green" />
                Operational
              </span>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              Endpoint: <code className="rounded-sm bg-bg-elevated px-1 font-mono text-[10px]">{NASA_POWER_ENDPOINT}</code>
            </p>
          </div>

          {/* Supabase */}
          <div className="paper-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#EFF6FF] text-accent-blue">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Supabase Database</h3>
                  <p className="text-[10px] text-text-muted">Application state &amp; metadata</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-fatigue-green/30 bg-verd-approve-bg px-2.5 py-1 text-[10px] font-medium text-verd-approve">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-fatigue-green" />
                Connected
              </span>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              URL: <code className="rounded-sm bg-bg-elevated px-1 font-mono text-[10px]">{SUPABASE_URL}</code>
            </p>
          </div>

          {/* OpenRouter */}
          <div className="paper-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-bg-elevated text-text-muted">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">OpenRouter / AI-ML</h3>
                  <p className="text-[10px] text-text-muted">Supplementary AI model routing</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#334155]/20 bg-white px-2.5 py-1 text-[10px] font-medium text-text-muted">
                Demo placeholder
              </span>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              Key: <code className="rounded-sm bg-bg-elevated px-1 font-mono text-[10px]">sk-••••••••</code> (demo, not wired)
            </p>
          </div>
        </div>
      )}

      {/* Tab B: Circadian Thresholds */}
      {activeTab === "thresholds" && (
        <div className="space-y-4">
          <div className="paper-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Fatigue Safety Limits</h3>
            <p className="mb-4 text-[10px] text-text-muted">
              Changes apply instantly across Dashboard, Stress Test &amp; Schedule views.
            </p>

            {/* Alert Threshold */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-secondary">
                  Fatigue Alert Threshold
                </label>
                <span className="font-mono text-sm font-semibold text-fatigue-amber">
                  {settings.thresholds.alertThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={settings.thresholds.alertThreshold}
                onChange={(e) => handleSlider("alertThreshold", Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-[10px] text-text-muted">
                Fatigue index above this value triggers an amber ALERT badge.
              </p>
            </div>

            {/* Hard Reject Threshold */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-secondary">
                  Hard Reject Threshold
                </label>
                <span className="font-mono text-sm font-semibold text-fatigue-red">
                  {settings.thresholds.hardRejectThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={settings.thresholds.hardRejectThreshold}
                onChange={(e) => handleSlider("hardRejectThreshold", Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-[10px] text-text-muted">
                Fatigue index at or above this value marks the employee RED ZONE.
              </p>
            </div>
          </div>

          {/* Toggle rules */}
          <div className="paper-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Labour Compliance Rules</h3>
            <p className="mb-4 text-[10px] text-text-muted">
              Toggle rules on/off to demonstrate compliance impact.
            </p>

            <div className="space-y-4">
              {/* ILO 48h */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-primary">ILO 48h/week labor rule</p>
                  <p className="text-[10px] text-text-muted">
                    Rule 1 — Max 48 hours per employee per week
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.thresholds.enforceILO48h}
                    onChange={() => handleToggle("enforceILO48h")}
                  />
                  <span className="toggle-track" />
                </label>
              </div>

              {/* 11h Rest */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-primary">Mandatory 11h rest interval</p>
                  <p className="text-[10px] text-text-muted">
                    Rule 2 — Minimum 11 continuous hours between shifts
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.thresholds.enforce11hRest}
                    onChange={() => handleToggle("enforce11hRest")}
                  />
                  <span className="toggle-track" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab C: Station Configuration */}
      {activeTab === "station" && (
        <div className="space-y-4">
          <div className="paper-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Station Configuration</h3>
            <p className="mb-4 text-[10px] text-text-muted">
              Configure the active airport station for solar calibration and shift windows.
            </p>

            {/* Station selector */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Active Station
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {AIRHUB_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      updateSettings({
                        station: {
                          id: preset.id,
                          name: preset.name,
                          lat: preset.lat,
                          lon: preset.lon,
                        },
                      } as Partial<AppSettings>)
                    }
                    className={`rounded-sm border px-4 py-3 text-left text-xs transition-all duration-150 ${
                      settings.station.id === preset.id
                        ? "border-rose/40 bg-rose/5 shadow-[2px_2px_0px_0px_rgba(232,180,184,0.2)]"
                        : "border-[#334155]/15 bg-white shadow-[2px_2px_0px_0px_rgba(30,41,59,0.06)] hover:bg-bg-hover"
                    }`}
                  >
                    <p className="font-medium text-text-primary">{preset.name}</p>
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {preset.lat}°, {preset.lon}°
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Shift windows (display only) */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Shift Windows
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-sm border border-shift-morning/30 bg-shift-morning/20 p-3">
                  <p className="text-[10px] font-semibold text-shift-morning-text">Morning</p>
                  <p className="font-mono text-xs text-text-primary">06:00 – 14:00</p>
                </div>
                <div className="rounded-sm border border-shift-afternoon/30 bg-shift-afternoon/20 p-3">
                  <p className="text-[10px] font-semibold text-shift-afternoon-text">Afternoon</p>
                  <p className="font-mono text-xs text-text-primary">14:00 – 22:00</p>
                </div>
                <div className="rounded-sm border border-shift-night/30 bg-shift-night/20 p-3">
                  <p className="text-[10px] font-semibold text-shift-night-text">Night</p>
                  <p className="font-mono text-xs text-text-primary">22:00 – 06:00</p>
                </div>
              </div>
            </div>

            {/* Nadir window */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Nadir Window
              </label>
              <div className="rounded-sm border border-[#334155]/15 bg-bg-elevated p-3">
                <p className="font-mono text-base font-semibold text-text-primary">02:00 – 05:00</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  Critical cognitive low-point window for night-shift operations
                </p>
              </div>
            </div>
          </div>

          {/* Reset to defaults */}
          <div className="flex justify-end">
            <button
              onClick={() =>
                updateSettings({
                  thresholds: { alertThreshold: 70, hardRejectThreshold: 85, enforceILO48h: true, enforce11hRest: true },
                  station: { id: "CGK", name: "NexaGlobal Air-Hub · CGK", lat: -6.2088, lon: 106.8456 },
                } as Partial<AppSettings>)
              }
              className="btn-chrome flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-medium"
            >
              <RefreshCw size={12} />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline Mic icon to avoid importing the wrong one */
function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}