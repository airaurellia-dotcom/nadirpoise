/**
 * Speechmatics batch transcription service.
 *
 * In production this would use a Supabase Edge Function as a proxy
 * so the API key never reaches the browser. Here we implement the
 * direct client-side flow with a non-blocking fallback.
 */

// Speechmatics EU endpoint
const API_BASE = "https://eu1.asr.api.speechmatics.com/v2";

export interface TranscriptionResult {
  text: string;
  error?: string;
}

/**
 * Transcribe audio using Speechmatics batch API.
 * Falls back gracefully if the API is unavailable.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const apiKey = import.meta.env.VITE_SPEECHMATICS_API_KEY;

    if (!apiKey || apiKey === "YOUR_SPEECHMATICS_KEY_HERE") {
      return {
        text: "",
        error: "Speechmatics API key not configured. Voice transcription is unavailable.",
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append("data_file", audioBlob, "recording.wav");

    const config = {
      type: "transcription",
      transcription_config: {
        language: "en",
        operating_point: "enhanced",
        max_delay: 2,
        enable_partials: false,
      },
    };
    formData.append("config", JSON.stringify(config));

    // Submit job
    const submitResp = await fetch(`${API_BASE}/jobs/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text().catch(() => "Unknown error");
      return { text: "", error: `Speechmatics API error: ${submitResp.status} — ${errText}` };
    }

    const jobData = await submitResp.json();
    const jobId: string = jobData.id;

    if (!jobId) {
      return { text: "", error: "No job ID returned from Speechmatics." };
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s timeout
    let result: TranscriptionResult | null = null;

    while (attempts < maxAttempts && !result) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      const pollResp = await fetch(`${API_BASE}/jobs/${jobId}/transcript`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (pollResp.status === 200) {
        const transcriptData = await pollResp.json();
        const text = extractTranscriptText(transcriptData);
        result = { text };
      } else if (pollResp.status === 404) {
        // Job not done yet
        continue;
      } else {
        return {
          text: "",
          error: `Failed to retrieve transcript (HTTP ${pollResp.status})`,
        };
      }
    }

    if (!result) {
      return { text: "", error: "Transcription timed out. Please try again." };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown transcription error";
    console.warn("Speechmatics transcription failed:", message);
    return {
      text: "",
      error: "Transcription service is offline. Manual typing is available as a fallback.",
    };
  }
}

/**
 * Extract readable text from Speechmatics transcript JSON.
 */
function extractTranscriptText(data: Record<string, unknown>): string {
  try {
    const results = (data as any).results ?? [];
    return results
      .map((r: any) => r?.alternatives?.[0]?.content ?? "")
      .filter(Boolean)
      .join(" ");
  } catch {
    return "";
  }
}

/**
 * Check if Speechmatics is configured.
 */
export function isSpeechmaticsConfigured(): boolean {
  const key = import.meta.env.VITE_SPEECHMATICS_API_KEY;
  return !!key && key !== "YOUR_SPEECHMATICS_KEY_HERE";
}