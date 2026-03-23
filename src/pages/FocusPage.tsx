import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds

const FocusPage = () => {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [buddyMsg, setBuddyMsg] = useState("Siap fokus? Tekan tombol di bawah ⬇️");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setSecondsLeft(FOCUS_DURATION);
    setBuddyMsg("Kerja bagus! Mau lanjut atau istirahat? 🌟");
  }, []);

  const startTimer = () => {
    setRunning(true);
    setSecondsLeft(FOCUS_DURATION);
    setBuddyMsg("Oke, kita fokus bareng ya. 🔥");

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      {/* Mini Buddy header */}
      <header className="flex items-center gap-2.5 px-4 py-2.5 bg-card/40 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-xs font-bold font-orbitron">B</span>
        </div>
        <p className="text-sm text-foreground/80 flex-1">{buddyMsg}</p>
      </header>

      {/* Timer area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="relative w-48 h-48 rounded-full border-4 border-primary/30 flex items-center justify-center">
          {running && (
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
          )}
          <span className="text-5xl font-bold font-orbitron text-foreground tracking-wider">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>

        {!running ? (
          <button
            onClick={startTimer}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold active:bg-primary/80 transition-colors"
          >
            <Play size={20} />
            Mulai Fokus
          </button>
        ) : (
          <button
            onClick={stopTimer}
            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-8 py-3 rounded-full text-sm font-semibold active:bg-destructive/80 transition-colors"
          >
            <Square size={20} />
            Berhenti
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FocusPage;
