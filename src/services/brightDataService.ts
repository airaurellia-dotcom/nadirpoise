/**
 * Bright Data live context banner service.
 *
 * In production this would call a Bright Data Web Unlocker endpoint
 * to scrape live airport/cargo news. Here we provide a realistic
 * fallback ticker that simulates operational context.
 */

export interface BrightDataContext {
  headline: string;
  source: string;
  freshness: string; // e.g. "Updated 2m ago"
  isLive: boolean;
}

// Jetro Cargo & aviation context messages for Jakarta's Soekarno-Hatta
const TICKER_MESSAGES = [
  "Tonight's Nadir Window is critical — Live Cargo Flight Departures & Local Disruption Context",
  "CGK Terminal 3 Cargo Apron: 7 freighter movements scheduled between 22:00–04:00",
  "Garuda Cargo cargo load factor at 94% — peak sorting demand expected through Nadir window",
  "Runway 07R/25L maintenance tonight: taxiway B closed, expect 15min hold for airside transfers",
  "Jakarta monsoon advisory: thunderstorm probability 60% between 02:00–06:00 — ramp ops on standby",
  "Nadir synchronisation window: 8 cargo handlers, 4 long-haul drivers required for next sort cycle",
  "AirNav Indonesia NOTAM: reduced visual separation in effect 01:00–05:00 — expect delays",
  "Cargo terminal cooling system maintenance deferred to next cycle — perishable goods capacity unchanged",
  "Cross-utilised staff alert: 3 certified loader operators also on passenger-side standby tonight",
  "Battery cargo (DG) acceptance cut-off 23:30 — 3 shipments pending hazmat inspection",
];

/**
 * Get the current operational context ticker message.
 * Rotates based on the current hour for a "live" feel.
 */
export function getOperationalContext(): BrightDataContext {
  const now = new Date();
  const hour = now.getHours();
  // Rotate message based on hour for stable contextual feel
  const msgIdx = hour % TICKER_MESSAGES.length;

  return {
    headline: TICKER_MESSAGES[msgIdx],
    source: "Bright Data · CGK Ops Feed",
    freshness: `Updated ${Math.floor(Math.random() * 3) + 1}m ago`,
    isLive: hour >= 20 || hour < 6, // Nadir window is overnight
  };
}

/**
 * Fetch live operational context (simulated).
 * In production this would hit a Bright Data dataset endpoint.
 */
export async function fetchLiveContext(): Promise<BrightDataContext> {
  // Simulate a lightweight async check
  await new Promise((r) => setTimeout(r, 300));
  return getOperationalContext();
}