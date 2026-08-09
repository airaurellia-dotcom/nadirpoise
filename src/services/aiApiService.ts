/**
 * AI/ML API integration service for NadirPoise.
 *
 * All calls go through Supabase Edge Functions so the AIML API key
 * never reaches the browser.
 */
import { AI_STRESS_TEST_URL, AI_OVERRIDE_AUDIT_URL, SUPABASE_ANON_KEY } from "../constants/config";
import type {
  AIStressTestResponse,
  AIOverrideAuditResponse,
  Employee,
  Schedule,
} from "../types";
import type { SolarData } from "../lib/nasaPower";

// ── Shared helpers ──

function edgeHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function callEdgeFunction<T>(url: string, body: unknown): Promise<T> {
  const resp = await fetch(url, {
    method: "POST",
    headers: edgeHeaders(),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let detail = `HTTP ${resp.status}`;
    try {
      const err = await resp.json();
      if (err?.error) detail = err.error;
    } catch {
      // keep default
    }
    throw new Error(`AI service error: ${detail}`);
  }

  const data = await resp.json();
  return data as T;
}

// ── Stress Test ──

export interface StressTestPayload {
  employees: Employee[];
  schedule: Schedule;
  solarData?: SolarData | null;
}

/**
 * Run the 5-persona circadian safety evaluation via the AIML API.
 * Calls the `ai-stress-test` Edge Function.
 */
export async function callStressTestAI(payload: StressTestPayload): Promise<AIStressTestResponse> {
  return callEdgeFunction<AIStressTestResponse>(AI_STRESS_TEST_URL, payload);
}

// ── Override Audit ──

export interface OverrideAuditPayload {
  managerNote: string;
  selectedCrew: string[];
  shiftId: string;
}

/**
 * Audit a manager override for ICAO/EASA fatigue-mitigation compliance.
 * Calls the `ai-override-audit` Edge Function.
 */
export async function callOverrideAuditAI(payload: OverrideAuditPayload): Promise<AIOverrideAuditResponse> {
  return callEdgeFunction<AIOverrideAuditResponse>(AI_OVERRIDE_AUDIT_URL, payload);
}