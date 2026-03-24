import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Square } from "lucide-react";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const TodoSmartInput = ({ onSubmit, disabled, placeholder }: Props) => {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setInput("");
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      setRecording(true);
      setRecordDuration(0);
      timerRef.current = window.setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch {
      console.error("[TodoInput] Mic access denied");
    }
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) { setRecording(false); return; }

    const blob = await new Promise<Blob>((resolve) => {
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" }));
      mr.stop();
    });

    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecording(false);

    // Transcribe
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice-note.webm");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      const text = typeof data.text === "string" ? data.text.trim() : "";
      if (text) {
        console.log("[TodoInput] Transcribed:", text);
        onSubmit(text);
      } else {
        console.warn("[TodoInput] Empty transcription");
      }
    } catch (e) {
      console.error("[TodoInput] Transcribe error:", e);
    }
  }, [onSubmit]);

  const cancelRecording = useCallback(() => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const mins = Math.floor(recordDuration / 60);
  const secs = recordDuration % 60;

  if (recording) {
    return (
      <div className="flex items-center gap-2 bg-muted/50 border border-border/30 rounded-full px-3 py-2">
        <button onClick={cancelRecording} className="p-1.5 text-destructive active:text-destructive/70">
          <Square size={16} fill="currentColor" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-foreground font-mono">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
        <button onClick={stopAndTranscribe} className="p-1.5 text-primary active:text-primary/70">
          <Send size={16} />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
      className="flex items-center gap-2"
    >
      <div className="flex-1 flex items-center gap-1.5 bg-muted/50 border border-border/30 rounded-full px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || "Ketik tugas... cth: Meeting besok jam 3"}
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          enterKeyHint="send"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="text-primary active:text-primary/70 transition-colors shrink-0 p-1 disabled:opacity-30"
          aria-label="Kirim"
        >
          <Send size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="p-2.5 rounded-full bg-primary/20 text-primary active:bg-primary/30 transition-colors shrink-0 disabled:opacity-30"
        aria-label="Voice input"
      >
        <Mic size={18} />
      </button>
    </form>
  );
};

export default TodoSmartInput;
