import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Square, Pause, RotateCcw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { BuddyState } from "@/hooks/useChat";

const FOCUS_DURATION = 25 * 60;
const TODO_STORAGE_KEY = "buddy-todos";

interface TodoItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  date?: string;
}

// Coach phrases by timer phase
const PHRASES = {
  idle: [
    "Siap fokus? Ayo mulai! 🎯",
    "Mau ngerjain apa hari ini?",
    "Yuk, waktunya produktif 💪",
  ],
  started: [
    "Oke, kita fokus bareng ya 🔥",
    "Fokus dulu, kamu pasti bisa!",
    "Let's go! Aku temenin 🚀",
  ],
  running: [
    "Bagus, terus lanjut 💫",
    "Kamu lagi on fire 🔥",
    "Fokus… fokus… 🧘",
  ],
  nearEnd: [
    "Sedikit lagi selesai! 🏁",
    "Tinggal bentar lagi, semangat!",
    "Hampir beres, tahan ya! 💪",
  ],
  finished: [
    "Kerja bagus! Kamu keren! 🌟",
    "Satu sesi beres! Istirahat dulu? ☕",
    "Mantap! Mau lanjut lagi? 🎉",
  ],
  paused: [
    "Istirahat sebentar ya 😊",
    "Aku tunggu di sini aja",
    "Santai dulu, nanti lanjut lagi",
  ],
};

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

type TimerState = "idle" | "running" | "paused" | "finished";

const FocusPage = () => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [buddyMsg, setBuddyMsg] = useState(() => pickRandom(PHRASES.idle));
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nearEndFired = useRef(false);

  // Load current active task
  const activeTask = useMemo(() => {
    try {
      const raw = localStorage.getItem(TODO_STORAGE_KEY);
      const todos: TodoItem[] = raw ? JSON.parse(raw) : [];
      const inProgress = todos.find(t => t.status === "In Progress");
      if (inProgress) return inProgress.title;
      const highPri = todos.find(t => t.priority === "High" && t.status !== "Done");
      if (highPri) return highPri.title;
      return null;
    } catch { return null; }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startTimer = () => {
    clearTimer();
    nearEndFired.current = false;
    const startFrom = timerState === "paused" ? secondsLeft : FOCUS_DURATION;
    setSecondsLeft(startFrom);
    setTimerState("running");
    setBuddyMsg(pickRandom(PHRASES.started));
    setBuddyState("speaking");
    setTimeout(() => setBuddyState("idle"), 2000);

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("finished");
          setBuddyMsg(pickRandom(PHRASES.finished));
          setBuddyState("speaking");
          setTimeout(() => setBuddyState("idle"), 3000);
          return 0;
        }
        // Near end warning (last 2 minutes)
        if (prev === 121 && !nearEndFired.current) {
          nearEndFired.current = true;
          setBuddyMsg(pickRandom(PHRASES.nearEnd));
          setBuddyState("speaking");
          setTimeout(() => setBuddyState("idle"), 2000);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    clearTimer();
    setTimerState("paused");
    setBuddyMsg(pickRandom(PHRASES.paused));
  };

  const resetTimer = () => {
    clearTimer();
    setTimerState("idle");
    setSecondsLeft(FOCUS_DURATION);
    setBuddyMsg(pickRandom(PHRASES.idle));
    setBuddyState("idle");
    nearEndFired.current = false;
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Periodic running messages
  useEffect(() => {
    if (timerState !== "running") return;
    const id = setInterval(() => {
      setBuddyMsg(pickRandom(PHRASES.running));
    }, 60000); // every minute
    return () => clearInterval(id);
  }, [timerState]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((FOCUS_DURATION - secondsLeft) / FOCUS_DURATION) * 100;

  const isActive = timerState === "running";
  const isFinished = timerState === "finished";

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden relative">
      {/* Animated space background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Stars */}
        <div className="space-stars absolute inset-0" />
        {/* Central glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-[2000ms] ${
          isActive ? "bg-primary/12" : isFinished ? "bg-accent/15" : "bg-primary/6"
        }`} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30 animate-twinkle"
            style={{
              top: `${15 + i * 14}%`,
              left: `${10 + (i * 17) % 80}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Buddy Robot - Larger version */}
        <div className={`relative mb-2 ${isActive ? "animate-float" : ""}`}>
          {/* Aura glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000 ${
            isActive ? "w-56 h-56 bg-primary/15" : isFinished ? "w-56 h-56 bg-accent/20" : "w-48 h-48 bg-primary/8"
          }`} />

          {/* Orbit rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: 240, height: 240, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className={`orbit-ring w-[220px] h-[220px] opacity-30 ${isActive ? "animate-orbit" : ""}`} />
          </div>

          {/* Robot */}
          <div className="relative z-10">
            {/* Antenna */}
            <div className="flex flex-col items-center mb-0">
              <div className={`w-5 h-5 rounded-full transition-colors duration-300 ${
                isActive ? "bg-accent animate-pulse" : isFinished ? "bg-green-400 animate-pulse" : "bg-accent/70 animate-antenna"
              }`} />
              <div className="w-1.5 h-6 bg-gradient-to-b from-accent/40 to-buddy-body-light" />
            </div>

            {/* Head */}
            <div className="relative animate-head-tilt">
              <div className="w-48 h-36 rounded-[2.5rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative shadow-2xl shadow-primary/10">
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[2.5rem] bg-gradient-to-r from-primary/25 via-accent/35 to-primary/25" />

                {/* Face */}
                <div className="absolute inset-3 top-5 bottom-4 rounded-[1.5rem] bg-background/40 border border-primary/10 flex items-center justify-center">
                  <div className="flex gap-10">
                    <FocusEye state={timerState} delay={0} />
                    <FocusEye state={timerState} delay={0.05} />
                  </div>
                </div>

                {/* Mouth */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  {buddyState === "speaking" ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="w-[3px] bg-accent rounded-full animate-waveform" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  ) : isFinished ? (
                    <div className="w-8 h-3 rounded-b-full border-2 border-t-0 border-accent/60" />
                  ) : (
                    <div className={`h-1 rounded-full transition-all duration-300 ${isActive ? "w-8 bg-accent/40" : "w-5 bg-muted-foreground/20"}`} />
                  )}
                </div>

                {/* Ears */}
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-l-full bg-gradient-to-r from-primary/40 to-primary/25" />
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-r-full bg-gradient-to-l from-primary/40 to-primary/25" />
              </div>
            </div>

            {/* Neck */}
            <div className="flex justify-center">
              <div className="w-7 h-3 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-b-md" />
            </div>

            {/* Body */}
            <div className="relative flex justify-center">
              <div className="w-32 h-22 rounded-[1.5rem] rounded-t-xl bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative shadow-xl shadow-primary/5">
                {/* Chest light - timer progress indicator */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary/12 border border-primary/15 flex items-center justify-center overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 rounded-full ${
                      isFinished ? "bg-green-400/60" : isActive ? "bg-accent/50" : "bg-primary/30"
                    }`}
                    style={{ height: `${isActive || isFinished ? progress : 0}%` }}
                  />
                  <div className={`w-3 h-3 rounded-full relative z-10 transition-colors duration-300 ${
                    isActive ? "bg-accent animate-pulse" : isFinished ? "bg-green-400" : "bg-primary/50"
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buddy speech */}
        <div className="mt-3 mb-6 max-w-[280px] text-center">
          <p className="text-sm text-foreground/70 font-medium transition-all duration-500 animate-fade-in" key={buddyMsg}>
            {buddyMsg}
          </p>
        </div>

        {/* Timer display */}
        <div className="relative mb-8">
          {/* Timer ring */}
          <div className="w-52 h-52 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background ring */}
              <circle cx="100" cy="100" r="88" fill="none" strokeWidth="6" className="stroke-secondary" />
              {/* Progress ring */}
              <circle
                cx="100" cy="100" r="88"
                fill="none" strokeWidth="6"
                strokeLinecap="round"
                className={`transition-all duration-1000 ${isFinished ? "stroke-green-400" : "stroke-primary"}`}
                style={{
                  strokeDasharray: 2 * Math.PI * 88,
                  strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100),
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold font-orbitron text-foreground tracking-wider">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
              {activeTask && timerState !== "idle" && (
                <p className="text-xs text-muted-foreground mt-2 max-w-[140px] truncate">
                  {activeTask}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {timerState === "idle" && (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25"
            >
              <Play size={20} />
              Mulai Fokus
            </button>
          )}
          {timerState === "running" && (
            <>
              <button
                onClick={pauseTimer}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all"
              >
                <Pause size={20} />
              </button>
              <button
                onClick={resetTimer}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-full text-sm font-semibold active:scale-95 transition-all"
              >
                <Square size={18} />
                Berhenti
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button
                onClick={startTimer}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25"
              >
                <Play size={18} />
                Lanjut
              </button>
              <button
                onClick={resetTimer}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </>
          )}
          {timerState === "finished" && (
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25"
            >
              <RotateCcw size={18} />
              Mulai Lagi
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

const FocusEye = ({ state, delay }: { state: TimerState; delay: number }) => {
  const cls = state === "running"
    ? "bg-gradient-to-b from-accent to-buddy-cyan-glow"
    : state === "finished"
      ? "bg-gradient-to-b from-green-400 to-accent animate-pulse"
      : "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-blink";

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${cls}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-3.5 h-3.5 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default FocusPage;
