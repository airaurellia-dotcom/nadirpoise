// Public configuration — safe to ship to the browser
export const SUPABASE_PROJECT_REF = 'xbhsamvdtgsehizjurvy';
export const SUPABASE_URL = 'https://xbhsamvdtgsehizjurvy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiaHNhbXZkdGdzZWhpemp1cnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMzMyNzgsImV4cCI6MjEwMTcwOTI3OH0.NAAV2Fetj-eHOR4UddsrtfIU0BNCK0XOHyozc1ii5Yk';

// Public API endpoints (no secret data)
export const NASA_POWER_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point";
export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1";
export const SPEECHMATICS_SECRET_NAME = "SPEECHMATICS_API_KEY";

// Supabase Edge Function URLs
export const EDGE_FUNCTION_BASE = `${SUPABASE_URL}/functions/v1`;
export const AI_STRESS_TEST_URL = `${EDGE_FUNCTION_BASE}/ai-stress-test`;
export const AI_OVERRIDE_AUDIT_URL = `${EDGE_FUNCTION_BASE}/ai-override-audit`;

// AIML API configuration
export const AIML_API_BASE = "https://api.aimlapi.com/v1";
export const AIML_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// Demo credentials — pure facade, no real authentication
import type { Persona } from "../types";

export interface DemoUser {
  persona: Persona;
  displayName: string;
  role: string;
  email: string;
  password: string;
}

export const DEMO_CREDENTIALS: Record<Persona, DemoUser> = {
  shift_manager: {
    persona: "shift_manager",
    displayName: "Marcus Vane",
    role: "Shift Manager",
    email: "marcus.vane@nadirpoise.io",
    password: "poise2025",
  },
  employee: {
    persona: "employee",
    displayName: "Amir Hassan",
    role: "Frontline Staff",
    email: "amir.hassan@nadirpoise.io",
    password: "poise2025",
  },
  auditor: {
    persona: "auditor",
    displayName: "Elena Vance",
    role: "Safety Auditor",
    email: "elena.vance@nadirpoise.io",
    password: "poise2025",
  },
};