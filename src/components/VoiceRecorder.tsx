import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "../services/speechmaticsService";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setElapsed(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        if (chunksRef.current.length === 0) return;

        setIsProcessing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        const result = await transcribeAudio(blob);
        if (result.text) {
          onTranscription(result.text);
          setError(null);
        } else if (result.error) {
          setError(result.error);
        }

        setIsProcessing(false);
        setElapsed(0);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not access microphone";
      setError(msg);
    }
  }, [onTranscription]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 active:scale-[0.92] ${
          isRecording
            ? "bg-fatigue-red text-white shadow-[0_0_0_4px_rgba(220,38,38,0.2)] animate-pulse"
            : isProcessing
              ? "bg-accent-amber/20 text-accent-amber cursor-wait"
              : "border border-[#334155]/20 bg-white text-text-secondary hover:bg-bg-hover hover:text-text-primary shadow-[2px_2px_0px_0px_rgba(30,41,59,0.08)]"
        }`}
        title={isRecording ? "Stop recording" : "Record voice note"}
      >
        {isProcessing ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-amber border-t-transparent" />
        ) : isRecording ? (
          <span className="inline-block h-3 w-3 rounded-sm bg-white" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {isRecording && (
        <span className="font-mono text-[11px] text-fatigue-red animate-pulse">
          {formatTime(elapsed)}
        </span>
      )}

      {isRecording && (
        <div className="flex items-center gap-[2px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-fatigue-red/60"
              style={{
                height: "4px",
                animation: `waveform 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {isProcessing && (
        <span className="text-[10px] text-text-muted animate-pulse">Transcribing…</span>
      )}

      {error && (
        <span
          className="max-w-[200px] cursor-help truncate text-[10px] text-fatigue-amber"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}