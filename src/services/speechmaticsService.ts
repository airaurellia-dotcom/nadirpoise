/**
 * Speechmatics batch transcription service.
 *
 * Audio is sent to the Supabase Edge Function `speechmatics-transcribe`,
 * which forwards it to Speechmatics server-side so the API key never
 * reaches the browser.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../constants/config";

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/speechmatics-transcribe`;

export interface TranscriptionResult {
  text: string;
  error?: string;
}

/**
 * Transcribe audio via the Supabase Edge Function proxy.
 * Falls back gracefully if the service is unavailable.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append("data_file", audioBlob, "recording.webm");

    const resp = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!resp.ok) {
      let message = `Transcription failed (HTTP ${resp.status}).`;
      try {
        const data = await resp.json();
        if (data?.error) message = data.error;
      } catch {
        // keep generic message
      }
      return { text: "", error: message };
    }

    const data = await resp.json();
    return { text: typeof data?.text === "string" ? data.text : "" };
  } catch (err) {
    console.warn("Speechmatics transcription failed:", err);
    return {
      text: "",
      error: "Transcription service is offline. Manual typing is available as a fallback.",
    };
  }
}

/**
 * Transcription is available whenever the Edge Function is deployed —
 * the key itself never lives in the client.
 */
export function isSpeechmaticsConfigured(): boolean {
  return true;
}
