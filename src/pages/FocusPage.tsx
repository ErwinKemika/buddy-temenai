import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Square, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { startOfDay, isBefore } from "date-fns";
import BottomNav from "@/components/BottomNav";
import { BuddyState } from "@/hooks/useChat";

const FOCUS_DURATION = 25 * 60;
const TODO_STORAGE_KEY = "buddy-todos";

interface Task {
  id: string;
  title: string;
  done: boolean;
  date: string;
  startTime?: string;
  endTime?: string;
  startedAt?: string;
  completedAt?: string;
  isRunning?: boolean;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "done";
  category?: "work" | "personal" | "health" | "learning";
  recurrence: "once" | "daily" | "weekly";
  effort?: "quick" | "medium" | "deep";
}

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

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
  taskDone: [
    "Sip, tugas beres! 🎉",
    "Mantap, satu lagi kelar! ✅",
    "Keren, lanjut yang berikutnya? 💪",
  ],
};

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

type TimerState = "idle" | "running" | "paused" | "finished";

function loadTasks(): Task[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || "[]");
    return raw.map((t: any) => ({
      ...t,
      priority: t.priority || "medium",
      status: t.status || (t.done ? "done" : "todo"),
      recurrence: t.recurrence || "once",
    }));
  } catch { return []; }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(tasks));
}

/** Get focus-worthy tasks: high priority, overdue, work category, or in_progress only */
function getFocusTasks(allTasks: Task[]): Task[] {
  const today = startOfDay(new Date());

  return allTasks
    .filter(t => {
      if (t.status === "done" || t.done) return false;
      const taskDate = t.date ? startOfDay(new Date(t.date)) : null;
      const isOverdue = taskDate && isBefore(taskDate, today);
      const isHighPriority = t.priority === "high";
      const isWork = t.category === "work";
      const isInProgress = t.status === "in_progress";

      return isHighPriority || isOverdue || isWork || isInProgress;
    })
    .sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (pw !== 0) return pw;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return 0;
    });
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

const FocusPage = () => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [buddyMsg, setBuddyMsg] = useState(() => pickRandom(PHRASES.idle));
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [allTasks, setAllTasks] = useState<Task[]>(() => loadTasks());
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nearEndFired = useRef(false);

  const focusTasks = useMemo(() => getFocusTasks(allTasks), [allTasks]);
  const activeTask = focusTasks[activeIdx] || null;

  // Reload tasks from storage on mount and when window refocuses
  useEffect(() => {
    const reload = () => setAllTasks(loadTasks());
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const markTaskDone = useCallback(() => {
    if (!activeTask) return;
    const updated = allTasks.map(t =>
      t.id === activeTask.id ? { ...t, status: "done" as const, done: true, completedAt: new Date().toISOString() } : t
    );
    setAllTasks(updated);
    saveTasks(updated);
    setBuddyMsg(pickRandom(PHRASES.taskDone));
    setBuddyState("speaking");
    setTimeout(() => setBuddyState("idle"), 2000);
    // Move to next task
    const newFocus = getFocusTasks(updated);
    setActiveIdx(prev => Math.min(prev, Math.max(0, newFocus.length - 1)));
  }, [activeTask, allTasks]);

  const startTimer = () => {
    clearTimer();
    nearEndFired.current = false;
    const startFrom = timerState === "paused" ? secondsLeft : FOCUS_DURATION;
    setSecondsLeft(startFrom);
    setTimerState("running");
    // clear state

    // Set active task to in_progress
    if (activeTask && activeTask.status !== "in_progress") {
      const updated = allTasks.map(t =>
        t.id === activeTask.id ? { ...t, status: "in_progress" as const, isRunning: true, startedAt: t.startedAt || new Date().toISOString() } : t
      );
      setAllTasks(updated);
      saveTasks(updated);
    }

    setBuddyMsg(activeTask
      ? `Oke, kita fokus ke "${activeTask.title}" ya 🔥`
      : pickRandom(PHRASES.started)
    );
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

  useEffect(() => {
    if (timerState !== "running") return;
    const id = setInterval(() => setBuddyMsg(pickRandom(PHRASES.running)), 60000);
    return () => clearInterval(id);
  }, [timerState]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((FOCUS_DURATION - secondsLeft) / FOCUS_DURATION) * 100;
  const isActive = timerState === "running";
  const isFinished = timerState === "finished";

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden relative">
      {/* Space background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="space-stars absolute inset-0" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-[2000ms] ${
          isActive ? "bg-primary/12" : isFinished ? "bg-accent/15" : "bg-primary/6"
        }`} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-primary/30 animate-twinkle"
            style={{ top: `${15 + i * 14}%`, left: `${10 + (i * 17) % 80}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${3 + i * 0.5}s` }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Buddy Robot */}
        <div className={`relative mb-2 ${isActive ? "animate-float" : ""}`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000 ${
            isActive ? "w-56 h-56 bg-primary/15" : isFinished ? "w-56 h-56 bg-accent/20" : "w-48 h-48 bg-primary/8"
          }`} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: 240, height: 240, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className={`orbit-ring w-[220px] h-[220px] opacity-30 ${isActive ? "animate-orbit" : ""}`} />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center mb-0">
              <div className={`w-5 h-5 rounded-full transition-colors duration-300 ${
                isActive ? "bg-accent animate-pulse" : isFinished ? "bg-green-400 animate-pulse" : "bg-accent/70 animate-antenna"
              }`} />
              <div className="w-1.5 h-6 bg-gradient-to-b from-accent/40 to-buddy-body-light" />
            </div>
            <div className="relative animate-head-tilt">
              <div className="w-48 h-36 rounded-[2.5rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative shadow-2xl shadow-primary/10">
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[2.5rem] bg-gradient-to-r from-primary/25 via-accent/35 to-primary/25" />
                <div className="absolute inset-3 top-5 bottom-4 rounded-[1.5rem] bg-background/40 border border-primary/10 flex items-center justify-center">
                  <div className="flex gap-10">
                    <FocusEye state={timerState} delay={0} />
                    <FocusEye state={timerState} delay={0.05} />
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  {buddyState === "speaking" ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[0,1,2,3,4].map(i => (
                        <div key={i} className="w-[3px] bg-accent rounded-full animate-waveform" style={{ animationDelay: `${i*0.1}s` }} />
                      ))}
                    </div>
                  ) : isFinished ? (
                    <div className="w-8 h-3 rounded-b-full border-2 border-t-0 border-accent/60" />
                  ) : (
                    <div className={`h-1 rounded-full transition-all duration-300 ${isActive ? "w-8 bg-accent/40" : "w-5 bg-muted-foreground/20"}`} />
                  )}
                </div>
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-l-full bg-gradient-to-r from-primary/40 to-primary/25" />
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-r-full bg-gradient-to-l from-primary/40 to-primary/25" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-7 h-3 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-b-md" />
            </div>
            <div className="relative flex justify-center">
              <div className="w-32 h-22 rounded-[1.5rem] rounded-t-xl bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative shadow-xl shadow-primary/5">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary/12 border border-primary/15 flex items-center justify-center overflow-hidden">
                  <div className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 rounded-full ${
                    isFinished ? "bg-green-400/60" : isActive ? "bg-accent/50" : "bg-primary/30"
                  }`} style={{ height: `${isActive || isFinished ? progress : 0}%` }} />
                  <div className={`w-3 h-3 rounded-full relative z-10 transition-colors duration-300 ${
                    isActive ? "bg-accent animate-pulse" : isFinished ? "bg-green-400" : "bg-primary/50"
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buddy speech */}
        <div className="mt-2 mb-3 max-w-[280px] text-center">
          <p className="text-sm text-foreground/70 font-medium transition-all duration-500 animate-fade-in" key={buddyMsg}>
            {buddyMsg}
          </p>
        </div>

        {/* Timer */}
        <div className="relative mb-4">
          <div className="w-44 h-44 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle cx="100" cy="100" r="88" fill="none" strokeWidth="6" strokeLinecap="round"
                className={`transition-all duration-1000 ${isFinished ? "stroke-accent" : "stroke-primary"}`}
                style={{ strokeDasharray: 2 * Math.PI * 88, strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-orbitron text-foreground tracking-wider">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-5">
          {timerState === "idle" && (
            <button onClick={startTimer}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25">
              <Play size={20} />
              Mulai Fokus
            </button>
          )}
          {timerState === "running" && (
            <>
              <button onClick={pauseTimer}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all">
                <Pause size={20} />
              </button>
              <button onClick={resetTimer}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-full text-sm font-semibold active:scale-95 transition-all">
                <Square size={18} />
                Berhenti
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button onClick={startTimer}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25">
                <Play size={18} />
                Lanjut
              </button>
              <button onClick={resetTimer}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all">
                <RotateCcw size={18} />
              </button>
            </>
          )}
          {timerState === "finished" && (
            <button onClick={resetTimer}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25">
              <RotateCcw size={18} />
              Mulai Lagi
            </button>
          )}
        </div>

        {/* Task list - visible breakdown */}
        {focusTasks.length > 0 && (
          <div className="w-full max-w-xs">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">
              {focusTasks.length} tugas fokus
            </p>
            <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden max-h-[160px] overflow-y-auto">
              {focusTasks.map((task, idx) => (
                <button
                  key={task.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    idx === activeIdx ? "bg-primary/10" : "active:bg-secondary/60"
                  } ${idx > 0 ? "border-t border-border/20" : ""}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${idx === activeIdx ? "text-foreground" : "text-muted-foreground"}`}>{task.title}</p>
                    {task.startTime && <p className="text-[10px] text-muted-foreground/60">{task.startTime}{task.endTime ? ` – ${task.endTime}` : ""}</p>}
                  </div>
                  {idx === activeIdx && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  {timerState === "finished" && idx === activeIdx && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markTaskDone(); }}
                      className="flex items-center gap-1 text-[10px] text-accent active:scale-95 transition-all flex-shrink-0"
                    >
                      <CheckCircle2 size={12} />
                      Done
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
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
    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${cls}`}
      style={{ animationDelay: `${delay}s` }}>
      <div className="w-3.5 h-3.5 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default FocusPage;
