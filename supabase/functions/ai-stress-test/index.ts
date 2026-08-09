import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AIML_API_BASE = "https://api.aimlapi.com/v1";
const AIML_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are the NadirPoise Bifurcated Logic Engine & AI Multi-Agent Auditor evaluating a weekly workforce roster.
Evaluate the roster strictly against the 5 specialized personas below. Each persona MUST produce its specific METRICS and strict VERDICT (APPROVED/CAUTION/REJECTED) based on their trigger conditions.

1. Chief Fatigue Officer
VETO (REJECTED) if:
- Continuous Night Shifts > 3 consecutive blocks (22:00 - 06:00).
- Transition intervals between shifts < 11 continuous hours.
- Anti-clockwise rotations without a 48-hour biological reset window.
- Fails to mandate NASA-backed Light-Exposure protocols.
METRICS: Fatigue Index (%), Sleep Debt Assessment

2. Shift Supervisor
AUTOMATIC CAUTION if:
- Coverage is barely maintained with single-point-of-failure risks.
VETO (REJECTED) if:
- Critical shifts have zero coverage.
METRICS: SLA Attainment Rate (%), Operational Buffer

3. Graveyard Night Ops Lead
APPROVED if:
- Night shift staffing matches demand and chronotype fit is adequate.
CAUTION if:
- Night shift relies on fatigued personnel.
METRICS: Chronotype Fit (%), Night Shift Coverage

4. Wellbeing & HR Rep
VETO (REJECTED) if:
- Rest window < 11 hours per 24-hour period (EU Working Time Directive 2003/88/EC).
- No uninterrupted 24-hour rest day within a 7-day cycle.
- Total work hours > 48 hours in a single week.
METRICS: Legal Liability Index (%), Rest Window Breach

5. Compliance Auditor
VETO (REJECTED) if:
- ILO Convention / EU Working Time Directive breaches found.
- Safety Hazard Ratio exceeds 70%.
METRICS: Safety Hazard Ratio (%), ILO Convention Compliance

REQUIRED JSON OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema. No markdown, no code fences, no explanation.
{
  "overall_verdict": "REJECTED" | "CAUTION" | "APPROVED",
  "overall_risk_score": <number 0-100>,
  "violations_count": <number>,
  "persona_evaluations": [
    {
      "persona_name": "Chief Fatigue Officer",
      "verdict": "REJECTED" | "CAUTION" | "APPROVED",
      "metrics": "Fatigue Index: X% | Sleep Debt: <description>",
      "argument": "<detailed justification citing specific rules and crew members>"
    },
    {
      "persona_name": "Shift Supervisor",
      "verdict": "REJECTED" | "CAUTION" | "APPROVED",
      "metrics": "SLA Attainment Rate: X% | Operational Buffer: <description>",
      "argument": "<detailed justification>"
    },
    {
      "persona_name": "Graveyard Night Ops Lead",
      "verdict": "REJECTED" | "CAUTION" | "APPROVED",
      "metrics": "Chronotype Fit: X% | Night Shift Coverage: <description>",
      "argument": "<detailed justification>"
    },
    {
      "persona_name": "Wellbeing & HR Rep",
      "verdict": "REJECTED" | "CAUTION" | "APPROVED",
      "metrics": "Legal Liability Index: X% | Rest Window Breach: <true/false>",
      "argument": "<detailed justification citing EU/ILO regulations>"
    },
    {
      "persona_name": "Compliance Auditor",
      "verdict": "REJECTED" | "CAUTION" | "APPROVED",
      "metrics": "Safety Hazard Ratio: X% | ILO Convention Breach: <yes/no>",
      "argument": "<detailed justification>"
    }
  ],
  "recommendations": [
    "<actionable roster adjustment 1>",
    "<actionable roster adjustment 2>"
  ]
}`;

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await req.json();
    const { employees, schedule, solarData } = body;

    if (!employees || !schedule) {
      return json({ error: "Missing required fields: employees, schedule." }, 400);
    }

    const apiKey = Deno.env.get("AIML_API_KEY");
    if (!apiKey) {
      return json({ error: "AIML_API_KEY is not configured on this server." }, 500);
    }

    // Build a concise roster summary for the AI
    const rosterSummary = buildRosterSummary(employees, schedule);

    const userPrompt = `=== SHIFT ROSTER DATA ===\n${rosterSummary}\n\n=== NASA SOLAR IRRADIANCE ===\n${solarData ? JSON.stringify(solarData, null, 2) : "No solar data available."}`;

    const aimlResp = await fetch(`${AIML_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AIML_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!aimlResp.ok) {
      const errText = await aimlResp.text().catch(() => "Unknown AIML API error");
      console.error("AIML API error:", aimlResp.status, errText);
      return json({ error: `AIML API returned HTTP ${aimlResp.status}.` }, 502);
    }

    const aimlData = await aimlResp.json();
    const content: string = aimlData?.choices?.[0]?.message?.content ?? "";

    if (!content) {
      return json({ error: "AIML API returned empty response." }, 502);
    }

    // Try to parse the JSON response
    let parsed;
    try {
      // Strip any markdown code fences
      const cleaned = content.replace(/```json?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AIML response:", content);
      return json({ error: "AI returned malformed JSON. Please try again." }, 502);
    }

    // Validate required keys
    if (parsed.overall_verdict === undefined || !parsed.persona_evaluations) {
      return json({ error: "AI response missing required keys (overall_verdict, persona_evaluations)." }, 502);
    }

    // Validate each persona evaluation has required fields
    const evaluations = parsed.persona_evaluations as Array<Record<string, unknown>>;
    for (const ev of evaluations) {
      if (!ev.persona_name || !ev.verdict || !ev.metrics || !ev.argument) {
        return json({ error: "AI response persona_evaluations missing required fields (persona_name, verdict, metrics, argument)." }, 502);
      }
    }

    return json({
      overall_verdict: parsed.overall_verdict as string,
      overall_risk_score: parsed.overall_risk_score as number,
      violations_count: parsed.violations_count as number,
      persona_evaluations: evaluations,
      recommendations: parsed.recommendations ?? [],
    });
  } catch (err) {
    console.error("ai-stress-test failed:", err);
    return json({ error: "Stress test service is unavailable. Please try again." }, 500);
  }
});

/** Build a condensed text summary of the shift roster for the AI prompt. */
function buildRosterSummary(employees: Record<string, unknown>[], schedule: Record<string, unknown>): string {
  const days = schedule.days as Record<string, unknown>[];
  const lines: string[] = [];

  lines.push(`Employees: ${employees.length}`);
  lines.push("");

  for (const emp of employees) {
    const id = emp.id as string;
    const name = emp.name as string;
    const role = emp.role as string;
    const sleepDebt = emp.sleep_debt_hours as number ?? 0;
    const circStatus = emp.circadian_status as string ?? "normal";
    lines.push(`- ${name} (${role}) | Sleep debt: ${sleepDebt}h | Circadian: ${circStatus}`);
  }

  lines.push("");
  lines.push("=== WEEKLY ROSTER ===");

  for (const day of days) {
    const dayName = day.day as string;
    const shifts = day.shifts as Record<string, string[]>;
    lines.push(`--- ${dayName}`);
    for (const shift of ["Morning", "Afternoon", "Night", "Off"] as const) {
      const assigned = shifts[shift] ?? [];
      const names = assigned.map((eid: string) => {
        const emp = employees.find((e) => (e.id as string) === eid);
        return emp ? (emp.name as string) : eid;
      });
      lines.push(`  ${shift}: ${names.join(", ") || "\u2014"}`);
    }
  }

  return lines.join("\n");
}