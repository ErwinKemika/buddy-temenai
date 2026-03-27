import { useState, useRef, useCallback, useEffect } from "react";
import { Mic } from "lucide-react";
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
  chatHistory?: Message[];
}

const STATUS_TEXT: Record<VoiceState, string> = {
  idle: "Tap untuk bicara...",
  listening: "Mendengarkan...",
  thinking: "Buddy sedang berpikir...",
  speaking: "Buddy sedang bicara...",
};

const GLOW_CLASSES: Record<VoiceState, string> = {
  idle: "bg-transparent",
  listening: "bg-[radial-gradient(circle,hsl(250,70%,30%)_0%,transparent_70%)]",
  thinking: "bg-[radial-gradient(circle,hsl(250,70%,25%)_0%,transparent_70%)]",
  speaking: "bg-[radial-gradient(circle,hsl(190,90%,20%)_0%,transparent_70%)]",
};

const VoiceMode = ({ onEndCall, streamChat, playTTS, transcribeVoice, buildTodoContext, chatHistory = [] }: Props) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

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

      const barCount = 40;
      const barWidth = w / barCount - 2;
      const centerY = h / 2;

      if (analyserRef.current && (voiceState === "listening" || voiceState === "speaking")) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const isBuddy = voiceState === "speaking";
        const color = isBuddy ? "0, 245, 212" : "180, 160, 255";

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[dataIndex] / 255;
          const barH = Math.max(2, value * (h * 0.8));
          const alpha = 0.4 + value * 0.6;

          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 2), centerY - barH / 2, barWidth, barH, 2);
          ctx.fill();
        }
      } else {
        const time = Date.now() / 1000;
        for (let i = 0; i < barCount; i++) {
          const pulse = Math.sin(time * 2 + i * 0.3) * 0.3 + 0.5;
          const barH = 2 + pulse * 4;
          ctx.fillStyle = `rgba(139, 92, 246, ${0.15 + pulse * 0.1})`;
          ctx.beginPath();
          ctx.roundRect(i * (barWidth + 2), centerY - barH / 2, barWidth, barH, 2);
          ctx.fill();
        }
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

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
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

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
    });
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;

    const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });

    setVoiceState("thinking");
    let transcribed: string;
    try {
      transcribed = await transcribeVoice(blob);
    } catch (e) {
      console.error("[VoiceMode] Transcription failed:", e);
      setVoiceState("idle");
      return;
    }

    const userMsg: Message = { role: "user", content: transcribed, source: "voice" };
    setSessionMessages(prev => [...prev, userMsg]);

    let assistantText = "";
    const upsert = (chunk: string) => {
      assistantText += chunk;
    };

    const todoContext = buildTodoContext();
    // Prepend last 10 chat history messages for context
    const historyMsgs = chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content }));
    const voiceMsgs = [...sessionMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const chatMsgs = [...historyMsgs, ...voiceMsgs];

    try {
      await streamChat(chatMsgs, upsert, todoContext);
    } catch {
      assistantText = "Maaf, aku sedang gangguan. Coba lagi ya! 😅";
    }

    const assistantMsg: Message = { role: "assistant", content: assistantText, source: "voice" };
    setSessionMessages(prev => [...prev, assistantMsg]);

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

  const handleEnd = useCallback(() => {
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
    <div className="flex-1 flex flex-col items-center relative overflow-hidden">
      {/* Reactive background glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-[600ms] ease-in-out ${GLOW_CLASSES[voiceState]}`}
      />

      {/* "Selesai" button — top right */}
      <div className="w-full flex justify-end px-4 pt-2 pb-0 relative z-10">
        <button
          onClick={handleEnd}
          className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors font-medium px-3 py-1.5"
        >
          Selesai
        </button>
      </div>

      {/* Main area — Buddy takes ~65% height */}
      <div className="flex-1 flex items-center justify-center w-full relative" style={{ minHeight: "65%" }}>
        {/* Radial glow behind Buddy */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-all duration-[600ms] ease-in-out ${
            voiceState === "speaking"
              ? "bg-accent/20"
              : voiceState === "listening"
              ? "bg-primary/15"
              : "bg-accent/[0.08]"
          }`}
        />

        {/* Buddy robot — scaled up with brightness change */}
        <div className={`relative scale-[1.5] origin-center transition-all duration-[600ms] ${
          voiceState === "speaking" ? "brightness-125 drop-shadow-[0_0_30px_hsl(var(--accent)/0.4)]" : ""
        }`}>
          <BuddyRobot buddyState={buddyState} enableEyeTracking />
        </div>
      </div>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={320}
        height={40}
        className="w-72 h-10 mb-2 opacity-90 relative z-10"
      />

      {/* Status text */}
      <p
        className="text-xs font-medium font-orbitron tracking-wider text-accent/80 mb-4 animate-fade-in relative z-10"
        key={voiceState}
      >
        {STATUS_TEXT[voiceState]}
      </p>

      {/* Mic button */}
      <div className="mb-6 flex flex-col items-center gap-2 relative z-10">
        <button
          onClick={handleMicTap}
          disabled={voiceState === "thinking" || voiceState === "speaking"}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 ${
            voiceState === "listening"
              ? "bg-accent shadow-[0_0_24px_4px] shadow-accent/40 scale-110"
              : "bg-card/60 border border-primary/20 backdrop-blur-sm active:scale-95"
          }`}
        >
          <Mic
            size={22}
            className={
              voiceState === "listening"
                ? "text-primary-foreground animate-pulse"
                : "text-accent/70"
            }
          />
        </button>

        {sessionMessages.length > 0 && (
          <p className="text-[10px] text-muted-foreground/50">
            🎙️ {sessionMessages.length} pesan
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;