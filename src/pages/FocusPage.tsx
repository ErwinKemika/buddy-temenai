import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Pause, Play, Square, RotateCcw, CheckCircle2 } from "lucide-react";
import { startOfDay, isBefore } from "date-fns";
import { useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { BuddyState } from "@/hooks/useChat";
import { useI18n } from "@/hooks/useI18n";

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

const PHRASE_KEYS = {
  idle: ["focus.p.idle1", "focus.p.idle2", "focus.p.idle3"],
  started: ["focus.p.started1", "focus.p.started2", "focus.p.started3"],
  running: ["focus.p.running1", "focus.p.running2", "focus.p.running3"],
  nearEnd: ["focus.p.nearEnd1", "focus.p.nearEnd2", "focus.p.nearEnd3"],
  finished: ["focus.p.finished1", "focus.p.finished2", "focus.p.finished3"],
  paused: ["focus.p.paused1", "focus.p.paused2", "focus.p.paused3"],
  taskDone: ["focus.p.taskDone1", "focus.p.taskDone2", "focus.p.taskDone3"],
};

function pickRandom(keys: string[]) {
  return keys[Math.floor(Math.random() * keys.length)];
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

/** Calculate duration in seconds from task startTime/endTime, fallback to 25min */
function getTaskDuration(task: Task | null): number {
  if (!task?.startTime || !task?.endTime) return 25 * 60;
  const [sh, sm] = task.startTime.split(":").map(Number);
  const [eh, em] = task.endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff > 0) return diff * 60;
  return 25 * 60;
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
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [buddyMsg, setBuddyMsg] = useState(() => pickRandom(PHRASE_KEYS.idle));
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [allTasks, setAllTasks] = useState<Task[]>(() => loadTasks());
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nearEndFired = useRef(false);
  const autoStarted = useRef(false);
  const activeTaskIdRef = useRef<string | null>(null);

  const focusTasks = useMemo(() => getFocusTasks(allTasks), [allTasks]);
  const activeTask = focusTasks[activeIdx] || null;

  const duration = useMemo(() => getTaskDuration(activeTask), [activeTask]);
  const [secondsLeft, setSecondsLeft] = useState(duration);

  // Update secondsLeft when active task changes (only when idle)
  useEffect(() => {
    if (timerState === "idle") {
      setSecondsLeft(duration);
    }
  }, [duration, timerState]);

  // If navigated from TodoPage with a taskId, select that task and auto-start
  useEffect(() => {
    if (taskIdFromUrl && !autoStarted.current) {
      const idx = focusTasks.findIndex(t => t.id === taskIdFromUrl);
      if (idx >= 0) {
        setActiveIdx(idx);
        autoStarted.current = true;
        // Auto-start after a brief delay
        setTimeout(() => {
          startTimerForTask(idx);
        }, 500);
      }
    }
  }, [taskIdFromUrl, focusTasks]);

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
    setBuddyMsg(pickRandom(PHRASE_KEYS.taskDone));
    setBuddyState("speaking");
    setTimeout(() => setBuddyState("idle"), 2000);
    const newFocus = getFocusTasks(updated);
    setActiveIdx(prev => Math.min(prev, Math.max(0, newFocus.length - 1)));
    setTimerState("idle");
    clearTimer();
  }, [activeTask, allTasks, clearTimer]);

  const startTimerForTask = (idx?: number) => {
    const taskIdx = idx ?? activeIdx;
    const task = focusTasks[taskIdx] || null;
    const taskDuration = getTaskDuration(task);

    clearTimer();
    nearEndFired.current = false;
    const startFrom = timerState === "paused" && idx === undefined ? secondsLeft : taskDuration;
    setSecondsLeft(startFrom);
    setTimerState("running");

    // Capture the actual task ID for the timer closure
    const runningTaskId = task?.id || null;
    activeTaskIdRef.current = runningTaskId;

    // Set active task to in_progress
    if (task && task.status !== "in_progress") {
      const updated = allTasks.map(t =>
        t.id === task.id ? { ...t, status: "in_progress" as const, isRunning: true, startedAt: t.startedAt || new Date().toISOString() } : t
      );
      setAllTasks(updated);
      saveTasks(updated);
    }

    setBuddyMsg(task
      ? `focus.p.taskFocus:${task.title}`
      : pickRandom(PHRASE_KEYS.started)
    );
    setBuddyState("speaking");
    setTimeout(() => setBuddyState("idle"), 2000);

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("finished");
          // Auto-complete using the captured task ID, not activeIdx
          setAllTasks(current => {
            const taskToComplete = current.find(t => t.id === runningTaskId);
            if (taskToComplete) {
              const updated = current.map(t =>
                t.id === runningTaskId ? { ...t, status: "done" as const, done: true, completedAt: new Date().toISOString() } : t
              );
              saveTasks(updated);
              setBuddyMsg(pickRandom(PHRASE_KEYS.taskDone));
              setBuddyState("speaking");
              // After a delay, reset to idle and move to next task
              setTimeout(() => {
                setBuddyState("idle");
                const newFocus = getFocusTasks(updated);
                if (newFocus.length > 0) {
                  setActiveIdx(prev => Math.min(prev, newFocus.length - 1));
                  setBuddyMsg(pickRandom(PHRASE_KEYS.idle));
                } else {
                  setBuddyMsg("focus.p.allDone");
                }
                setTimerState("idle");
              }, 3000);
              return updated;
            }
            setBuddyMsg(pickRandom(PHRASE_KEYS.finished));
            setBuddyState("speaking");
            setTimeout(() => { setBuddyState("idle"); setTimerState("idle"); }, 3000);
            return current;
          });
          return 0;
        }
        if (prev === 121 && !nearEndFired.current) {
          nearEndFired.current = true;
          setBuddyMsg(pickRandom(PHRASE_KEYS.nearEnd));
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
    setBuddyMsg(pickRandom(PHRASE_KEYS.paused));
  };

  const resetTimer = () => {
    clearTimer();
    setTimerState("idle");
    setSecondsLeft(duration);
    setBuddyMsg(pickRandom(PHRASE_KEYS.idle));
    setBuddyState("idle");
    nearEndFired.current = false;
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (timerState !== "running") return;
    const id = setInterval(() => setBuddyMsg(pickRandom(PHRASE_KEYS.running)), 60000);
    return () => clearInterval(id);
  }, [timerState]);

  const renderBuddyMsg = (msg: string) => {
    if (msg.startsWith("focus.p.taskFocus:")) {
      return t("focus.p.taskFocus", { title: msg.slice("focus.p.taskFocus:".length) });
    }
    return t(msg);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((duration - secondsLeft) / duration) * 100;
  const isActive = timerState === "running";
  const isFinished = timerState === "finished";

  // Format duration for display
  const formatDuration = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rm = m % 60;
      return rm > 0 ? `${h}j ${rm}m` : `${h}j`;
    }
    return `${m}m`;
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden relative">
      {/* Space background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="space-stars absolute inset-0" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full blur-[120px] transition-all duration-[2000ms] ${
          isActive ? "bg-primary/12" : isFinished ? "bg-accent/15" : "bg-primary/6"
        }`} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-primary/30 animate-twinkle"
            style={{ top: `${15 + i * 14}%`, left: `${10 + (i * 17) % 80}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${3 + i * 0.5}s` }}
          />
        ))}
      </div>

      {/* Main content - responsive spacing */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center relative z-10 px-4 sm:px-6 pt-6 sm:pt-0 overflow-y-auto pb-20">
        {/* Buddy Robot with Hands - scales down on small screens */}
        <div className={`relative mb-1 sm:mb-2 scale-[0.7] sm:scale-[0.85] md:scale-100 origin-center ${isActive ? "animate-float" : ""}`}>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000 ${
            isActive ? "w-56 h-56 bg-primary/15" : isFinished ? "w-56 h-56 bg-accent/20" : "w-48 h-48 bg-primary/8"
          }`} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: 240, height: 240, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className={`orbit-ring w-[220px] h-[220px] opacity-30 ${isActive ? "animate-orbit" : ""}`} />
          </div>

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
                {/* Ears */}
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-l-full bg-gradient-to-r from-primary/40 to-primary/25" />
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-9 rounded-r-full bg-gradient-to-l from-primary/40 to-primary/25" />
              </div>
            </div>
            {/* Neck */}
            <div className="flex justify-center">
              <div className="w-7 h-3 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-b-md" />
            </div>
            {/* Body with Arms/Hands */}
            <div className="relative flex justify-center">
              {/* Left Arm */}
              <div
                className={`absolute -left-12 top-1 origin-top-right ${isActive ? "rotate-[-15deg]" : "rotate-[-25deg]"}`}
                style={{ animation: "arm-sway-left 4s ease-in-out infinite", animationDelay: "0s" }}
              >
                <div className="w-3 h-8 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-full border border-primary/15" />
                <div className={`w-5 h-5 rounded-full bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 -ml-1 -mt-0.5 flex items-center justify-center transition-all duration-500 ${isActive ? "shadow-md shadow-accent/20" : ""}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                </div>
              </div>
              {/* Right Arm */}
              <div
                className={`absolute -right-12 top-1 origin-top-left ${isActive ? "rotate-[15deg]" : "rotate-[25deg]"}`}
                style={{ animation: "arm-sway-right 4.5s ease-in-out infinite", animationDelay: "0.8s" }}
              >
                <div className="w-3 h-8 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-full border border-primary/15" />
                <div className={`w-5 h-5 rounded-full bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 -ml-0 -mt-0.5 flex items-center justify-center transition-all duration-500 ${isActive ? "shadow-md shadow-accent/20" : ""}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                </div>
              </div>
              {/* Body */}
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

        {/* Buddy speech bubble - responsive width */}
        <div className="mt-1 sm:mt-2 mb-2 sm:mb-3 max-w-[240px] sm:max-w-[280px] relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card/70 border-l border-t border-primary/25 backdrop-blur-sm" />
          <div className="relative bg-card/70 backdrop-blur-sm border border-primary/25 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-center shadow-[0_0_20px_rgba(139,92,246,0.15),0_0_40px_rgba(139,92,246,0.08)]">
            <p className="text-xs sm:text-sm text-foreground/80 font-medium transition-all duration-500 animate-fade-in" key={buddyMsg}>
              {renderBuddyMsg(buddyMsg)}
            </p>
          </div>
        </div>

        {/* Timer - responsive size */}
        <div className="relative mb-2 sm:mb-3">
          <div className="w-20 h-20 sm:w-28 sm:h-28 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" strokeWidth="8" className="stroke-secondary" />
              <circle cx="100" cy="100" r="88" fill="none" strokeWidth="8" strokeLinecap="round"
                className={`transition-all duration-1000 ${isFinished ? "stroke-accent" : "stroke-primary"}`}
                style={{ strokeDasharray: 2 * Math.PI * 88, strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base sm:text-xl font-bold font-orbitron text-foreground tracking-wider">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          {timerState === "running" && (
            <>
              <button onClick={pauseTimer}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all">
                <Pause size={16} />
              </button>
              <button onClick={resetTimer}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold active:scale-95 transition-all">
                <Square size={14} />
                {t("focus.stop")}
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button onClick={() => startTimerForTask()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold active:scale-95 transition-all shadow-lg shadow-primary/25">
                {t("focus.resume")}
              </button>
              <button onClick={resetTimer}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition-all">
                <RotateCcw size={14} />
              </button>
            </>
          )}
        </div>

        {/* Task list - responsive */}
        {focusTasks.length > 0 && (
          <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2 text-center">
              {t("focus.taskCount", { n: focusTasks.length })}
            </p>
            <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl sm:rounded-2xl overflow-hidden max-h-[140px] sm:max-h-[180px] md:max-h-[220px] overflow-y-auto">
              {focusTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 transition-colors ${
                    idx === activeIdx && timerState !== "idle" ? "bg-primary/10" : ""
                  } ${idx > 0 ? "border-t border-border/20" : ""}`}
                >
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] sm:text-xs font-medium truncate ${idx === activeIdx && timerState !== "idle" ? "text-foreground" : "text-muted-foreground"}`}>{task.title}</p>
                    <div className="flex items-center gap-1.5">
                      {task.startTime && <p className="text-[9px] sm:text-[10px] text-muted-foreground/60">{task.startTime}{task.endTime ? ` – ${task.endTime}` : ""}</p>}
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground/40">({formatDuration(getTaskDuration(task))})</span>
                    </div>
                  </div>
                  {/* Focus/start button per task */}
                  {timerState === "idle" && (
                    <button
                      onClick={() => {
                        setActiveIdx(idx);
                        startTimerForTask(idx);
                      }}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-primary/20 text-primary text-[9px] sm:text-[10px] font-semibold active:scale-95 transition-all border border-primary/30 whitespace-nowrap flex-shrink-0"
                    >
                      💻 {t("focus.work")}
                    </button>
                  )}
                  {timerState === "running" && idx === activeIdx && (
                    <button
                      onClick={(e) => { e.stopPropagation(); pauseTimer(); }}
                      className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] sm:text-[10px] font-semibold active:scale-95 transition-all border border-yellow-500/30 flex-shrink-0"
                    >
                      <Pause size={10} />
                      {t("focus.pause")}
                    </button>
                  )}
                  {timerState === "paused" && idx === activeIdx && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startTimerForTask(); }}
                      className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-full bg-primary/20 text-primary text-[9px] sm:text-[10px] font-semibold active:scale-95 transition-all border border-primary/30 flex-shrink-0"
                    >
                      <Play size={10} />
                      {t("focus.resume")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {focusTasks.length === 0 && (
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">{t("focus.noTasks")}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">{t("focus.noTasksHint")}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const FocusEye = ({ state, delay }: { state: TimerState; delay: number }) => {
  const cls = state === "running"
    ? "bg-gradient-to-b from-green-400 to-green-500"
    : state === "paused"
      ? "bg-gradient-to-b from-red-400 to-red-500 animate-pulse"
      : state === "finished"
        ? "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-pulse"
        : "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-blink";
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${cls}`}
      style={{ animationDelay: `${delay}s` }}>
      <div className="w-3.5 h-3.5 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default FocusPage;
