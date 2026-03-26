import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, PhoneOff } from "lucide-react";
import BuddyRobot from "./BuddyRobot";
import { BuddyState, Message } from "@/hooks/useChat";


type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  onEndCall: (voiceMessages: Message[]) => void;
  streamChat: (
    chatMessages: Array<{ role: string; content: any }>,
    upsertAssistant: (chunk: string) => void,
    todoContext?: string,
  ) => Promise<void>;
  playTTS: (text: string) => Promise<void>;
  transcribeVoice: (blob: Blob) => Promise<string>;
  buildTodoContext: () => string;
}

const STATUS_TEXT: Record<VoiceState, string> = {
  idle: "Tap untuk bicara...",
  listening: "Mendengarkan...",
  thinking: "Buddy sedang berpikir...",
  speaking: "Buddy sedang bicara...",
};

const VoiceMode = ({ onEndCall, streamChat, playTTS, transcribeVoice, buildTodoContext }: Props) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Waveform visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (analyserRef.current && (voiceState === "listening" || voiceState === "speaking")) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        const alpha = voiceState === "listening" ? 1 : 0.3;
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
        ctx.beginPath();

        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      } else {
        // Flat line when idle
        ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [voiceState]);

  const startRecording = useCallback(async () => {
    if (voiceState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);
      setVoiceState("listening");
    } catch {
      console.error("[VoiceMode] Mic access denied");
    }
  }, [voiceState]);

  const stopRecordingAndProcess = useCallback(async () => {
    if (voiceState !== "listening") return;
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    // Stop recording
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
    });
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;

    const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });

    // Transcribe
    setVoiceState("thinking");
    let userText: string;
    try {
      userText = await transcribeVoice(blob);
    } catch (e) {
      console.error("[VoiceMode] Transcription failed:", e);
      setVoiceState("idle");
      return;
    }

    const userMsg: Message = { role: "user", content: userText, source: "voice" };
    setSessionMessages(prev => [...prev, userMsg]);

    // Get AI response
    let assistantText = "";
    const upsert = (chunk: string) => {
      assistantText += chunk;
    };

    const todoContext = buildTodoContext();
    const allMessages = [...sessionMessages, userMsg];
    const chatMsgs = allMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      await streamChat(chatMsgs, upsert, todoContext);
    } catch {
      assistantText = "Maaf, aku sedang gangguan. Coba lagi ya! 😅";
    }

    const assistantMsg: Message = { role: "assistant", content: assistantText, source: "voice" };
    setSessionMessages(prev => [...prev, assistantMsg]);

    // Play TTS
    setVoiceState("speaking");
    try {
      await playTTS(assistantText);
    } catch (e) {
      console.error("[VoiceMode] TTS failed:", e);
    }

    setVoiceState("idle");
  }, [voiceState, sessionMessages, streamChat, playTTS, transcribeVoice, buildTodoContext]);

  const handleMicTap = useCallback(() => {
    if (voiceState === "idle") {
      startRecording();
    } else if (voiceState === "listening") {
      stopRecordingAndProcess();
    }
  }, [voiceState, startRecording, stopRecordingAndProcess]);

  const handleEndCall = useCallback(() => {
    // Stop any recording
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    onEndCall(sessionMessages);
  }, [sessionMessages, onEndCall]);

  const buddyState: BuddyState =
    voiceState === "thinking" ? "thinking"
    : voiceState === "speaking" ? "speaking"
    : "idle";

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-6 px-4">
      {/* Buddy Robot - centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Pulsing ring when listening */}
          {voiceState === "listening" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full border-2 border-accent/40 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute w-60 h-60 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: "1.5s" }} />
            </div>
          )}
          <BuddyRobot buddyState={buddyState} />
        </div>
      </div>

      {/* Status text */}
      <p className="text-sm font-medium font-orbitron tracking-wider text-accent mb-4 animate-fade-in" key={voiceState}>
        {STATUS_TEXT[voiceState]}
      </p>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-80 h-12 mb-6 opacity-80"
      />

      {/* Controls */}
      <div className="flex items-center gap-6 mb-4">
        <button
          onClick={handleMicTap}
          disabled={voiceState === "thinking" || voiceState === "speaking"}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 ${
            voiceState === "listening"
              ? "bg-accent shadow-lg shadow-accent/40 scale-110"
              : "bg-primary/20 border-2 border-primary/40 active:scale-95"
          }`}
        >
          <Mic size={28} className={voiceState === "listening" ? "text-primary-foreground animate-pulse" : "text-primary"} />
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center active:scale-95 transition-transform"
        >
          <PhoneOff size={24} className="text-destructive" />
        </button>
      </div>

      {/* Session message count */}
      {sessionMessages.length > 0 && (
        <p className="text-xs text-muted-foreground">
          🎙️ {sessionMessages.length} pesan dalam sesi ini
        </p>
      )}
    </div>
  );
};

export default VoiceMode;
