import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Play, Square, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import TodoSmartInput from "@/components/TodoSmartInput";
import { parseTodoInput, getRandomBuddyResponse } from "@/hooks/useTodoParser";

interface Task {
  id: string;
  title: string;
  done: boolean;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  startedAt?: string; // ISO
  completedAt?: string; // ISO
  isRunning?: boolean;
}

type ViewMode = "month" | "today";

const STORAGE_KEY = "buddy-todos";

const loadTasks = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const TodoPage = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [newTask, setNewTask] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [buddyMsg, setBuddyMsg] = useState("Mau ngapain hari ini? 📝");
  const [buddyChatLog, setBuddyChatLog] = useState<Array<{ role: "user" | "buddy"; text: string }>>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Timer update for running tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]); // force re-render for elapsed time
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const filteredTasks = useMemo(() => {
    if (viewMode === "today") {
      return tasks.filter(t => t.date === todayStr);
    }
    return tasks.filter(t => t.date === format(selectedDate, "yyyy-MM-dd"));
  }, [tasks, viewMode, selectedDate, todayStr]);

  const tasksOnDate = (dateStr: string) => tasks.filter(t => t.date === dateStr);

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    const task: Task = {
      id: Date.now().toString(),
      title,
      done: false,
      date: addDate,
      startTime: addStartTime || undefined,
      endTime: addEndTime || undefined,
    };
    setTasks(prev => [...prev, task]);
    setNewTask("");
    setAddStartTime("");
    setAddEndTime("");
    setShowAddForm(false);
    setBuddyMsg("Oke, aku catat ya! 💪");
    setTimeout(() => setBuddyMsg("Ada lagi yang mau dikerjain?"), 3000);
  };

  const handleSmartInput = useCallback((text: string) => {
    const parsed = parseTodoInput(text);
    console.log("[TodoSmartInput] Raw:", text, "→ Parsed:", parsed);

    const task: Task = {
      id: Date.now().toString(),
      title: parsed.title,
      done: false,
      date: parsed.date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    };
    setTasks(prev => [...prev, task]);

    const response = getRandomBuddyResponse();
    const timeInfo = parsed.startTime ? ` (${parsed.startTime}${parsed.endTime ? " - " + parsed.endTime : ""})` : "";
    const dateLabel = parsed.date === format(new Date(), "yyyy-MM-dd") ? "hari ini" : format(new Date(parsed.date + "T00:00:00"), "d MMM", { locale: localeId });

    setBuddyChatLog(prev => [
      ...prev,
      { role: "user", text },
      { role: "buddy", text: `${response}\n📋 "${parsed.title}" — ${dateLabel}${timeInfo}` },
    ]);
    setBuddyMsg(response);
    setTimeout(() => setBuddyMsg("Ada lagi yang mau dikerjain?"), 3000);
  }, []);
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        return {
          ...t,
          done: nowDone,
          completedAt: nowDone ? new Date().toISOString() : undefined,
          isRunning: nowDone ? false : t.isRunning,
        };
      })
    );
    const task = tasks.find(t => t.id === id);
    if (task && !task.done) {
      setBuddyMsg("Mantap! Satu selesai! 🎉");
      setTimeout(() => setBuddyMsg("Lanjut yang lain yuk!"), 3000);
    }
  };

  const startTask = (id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, isRunning: true, startedAt: t.startedAt || new Date().toISOString() } : t
      )
    );
    setBuddyMsg("Gas! Semangat kerjain! 🔥");
  };

  const stopTask = (id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, isRunning: false } : t
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setBuddyMsg("Udah aku hapus ya.");
  };

  const getElapsed = (task: Task) => {
    if (!task.startedAt) return null;
    const start = new Date(task.startedAt).getTime();
    const end = task.completedAt ? new Date(task.completedAt).getTime() : (task.isRunning ? Date.now() : new Date(task.startedAt).getTime());
    const diff = Math.floor((end - start) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}j ${m}m ${s}d`;
    if (m > 0) return `${m}m ${s}d`;
    return `${s}d`;
  };

  const startDayOfWeek = startOfMonth(calMonth).getDay(); // 0=Sun

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      {/* Mini Buddy header */}
      <header className="flex items-center gap-2.5 px-4 py-2.5 bg-card/40 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-xs font-bold font-orbitron">B</span>
        </div>
        <p className="text-sm text-foreground/80 flex-1">{buddyMsg}</p>
      </header>

      {/* View mode tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        <button
          onClick={() => setViewMode("today")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "today"
              ? "bg-primary text-primary-foreground"
              : "bg-card/50 text-muted-foreground"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "month"
              ? "bg-primary text-primary-foreground"
              : "bg-card/50 text-muted-foreground"
          }`}
        >
          Kalender
        </button>
      </div>

      {/* Month Calendar */}
      {viewMode === "month" && (
        <div className="px-4 py-2">
          <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-3">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1 text-muted-foreground active:text-foreground">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {format(calMonth, "MMMM yyyy", { locale: localeId })}
              </span>
              <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1 text-muted-foreground active:text-foreground">
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {calendarDays.map(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayTasks = tasksOnDate(dayStr);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                return (
                  <button
                    key={dayStr}
                    onClick={() => setSelectedDate(day)}
                    className={`relative flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isTodayDate
                        ? "bg-primary/20 text-primary"
                        : "text-foreground/70 active:bg-card"
                    }`}
                  >
                    <span className="font-medium">{format(day, "d")}</span>
                    {dayTasks.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayTasks.slice(0, 3).map((t, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              t.done ? "bg-green-400" : isSelected ? "bg-primary-foreground/70" : "bg-accent"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Selected date label */}
          <p className="text-xs text-muted-foreground mt-2 px-1">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
          </p>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {viewMode === "today" ? "Tidak ada tugas hari ini." : "Tidak ada tugas di tanggal ini."}
          </p>
        )}
        {filteredTasks.map(task => {
          const elapsed = getElapsed(task);
          return (
            <div
              key={task.id}
              className={`bg-card/50 backdrop-blur-sm border rounded-xl px-3 py-3 ${
                task.isRunning ? "border-accent/50" : "border-border/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                    task.done
                      ? "bg-green-500 border-green-500 text-primary-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {task.done && <span className="text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm block ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.startTime && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} />
                        {task.startTime}{task.endTime ? ` - ${task.endTime}` : ""}
                      </span>
                    )}
                    {elapsed && (
                      <span className={`text-[10px] font-mono ${task.isRunning ? "text-accent" : "text-muted-foreground"}`}>
                        ⏱ {elapsed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!task.done && !task.isRunning && (
                    <button onClick={() => startTask(task.id)} className="p-1.5 text-accent active:text-accent/80 transition-colors">
                      <Play size={14} fill="currentColor" />
                    </button>
                  )}
                  {task.isRunning && (
                    <button onClick={() => stopTask(task.id)} className="p-1.5 text-destructive active:text-destructive/80 transition-colors">
                      <Square size={14} fill="currentColor" />
                    </button>
                  )}
                  {task.done && (
                    <CheckCircle2 size={14} className="text-green-500" />
                  )}
                  <button onClick={() => deleteTask(task.id)} className="p-1.5 text-muted-foreground active:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Progress info */}
              {(task.startedAt || task.completedAt) && (
                <div className="mt-1.5 pt-1.5 border-t border-border/20 flex flex-wrap gap-x-3 gap-y-0.5">
                  {task.startedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Mulai: {format(new Date(task.startedAt), "dd/MM HH:mm")}
                    </span>
                  )}
                  {task.completedAt && (
                    <span className="text-[10px] text-green-400">
                      Selesai: {format(new Date(task.completedAt), "dd/MM HH:mm")}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Buddy chat log */}
      {buddyChatLog.length > 0 && (
        <div className="px-4 pb-1 max-h-28 overflow-y-auto space-y-1.5">
          {buddyChatLog.slice(-4).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary/20 text-foreground"
                  : "bg-card/60 text-foreground/90 border border-border/30"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart input area */}
      <div className="px-3 pt-2 pb-2 bg-card/40 backdrop-blur-md border-t border-border/30">
        <TodoSmartInput
          onSubmit={handleSmartInput}
          placeholder="Ketik tugas... cth: Meeting besok jam 3"
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default TodoPage;
