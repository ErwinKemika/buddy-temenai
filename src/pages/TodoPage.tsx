import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Play, Square, CheckCircle2, Filter, X, Pencil } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, isBefore, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";

type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "done";
type Category = "work" | "personal" | "health" | "learning";
type Recurrence = "once" | "daily" | "weekly";
type Effort = "quick" | "medium" | "deep";

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
  priority: Priority;
  status: Status;
  category?: Category;
  recurrence: Recurrence;
  effort?: Effort;
}

type ViewMode = "month" | "today";

const STORAGE_KEY = "buddy-todos";

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

const CATEGORY_COLORS: Record<Category, string> = {
  work: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  personal: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  health: "bg-green-500/20 text-green-300 border-green-500/30",
  learning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const CATEGORY_LABELS: Record<Category, string> = {
  work: "Kerja",
  personal: "Pribadi",
  health: "Kesehatan",
  learning: "Belajar",
};

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  once: "Sekali",
  daily: "Harian",
  weekly: "Mingguan",
};

const EFFORT_LABELS: Record<Effort, string> = {
  quick: "Cepat",
  medium: "Sedang",
  deep: "Deep Work",
};

const loadTasks = (): Task[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return raw.map((t: any) => ({
      ...t,
      priority: t.priority || "medium",
      status: t.status || (t.done ? "done" : "todo"),
      recurrence: t.recurrence || "once",
    }));
  } catch {
    return [];
  }
};

const getDeadlineState = (dateStr: string): { label: string; className: string } | null => {
  const today = startOfDay(new Date());
  const taskDate = startOfDay(new Date(dateStr));
  if (isSameDay(today, taskDate)) return { label: "Hari Ini", className: "text-accent" };
  if (isBefore(taskDate, today)) return { label: "Terlambat", className: "text-red-400" };
  return { label: "Mendatang", className: "text-muted-foreground" };
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
  const [addPriority, setAddPriority] = useState<Priority>("medium");
  const [addCategory, setAddCategory] = useState<Category | "">("");
  const [addRecurrence, setAddRecurrence] = useState<Recurrence>("once");
  const [addEffort, setAddEffort] = useState<Effort | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const BUDDY_GREETINGS = [
    "Mau ngapain hari ini? 📝",
    "Ada rencana apa hari ini?",
    "Yuk mulai hari ini! 🚀",
    "Semangat ya hari ini! 💪",
    "Aku siap bantu kamu! ✨",
    "Hari ini kita produktif yuk!",
  ];
  const [buddyMsg, setBuddyMsg] = useState(() => BUDDY_GREETINGS[Math.floor(Math.random() * BUDDY_GREETINGS.length)]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const isTaskOnDate = (task: Task, dateStr: string): boolean => {
    if (task.recurrence === "daily") {
      // Daily tasks appear on their creation date and every day after
      return dateStr >= task.date;
    }
    if (task.recurrence === "weekly") {
      const taskDay = new Date(task.date).getDay();
      const checkDay = new Date(dateStr).getDay();
      return taskDay === checkDay && dateStr >= task.date;
    }
    return task.date === dateStr;
  };

  const filteredTasks = useMemo(() => {
    const targetDate = viewMode === "today" ? todayStr : format(selectedDate, "yyyy-MM-dd");
    let list = tasks.filter(t => isTaskOnDate(t, targetDate));
    if (filterPriority !== "all") list = list.filter(t => t.priority === filterPriority);
    if (filterStatus !== "all") list = list.filter(t => t.status === filterStatus);
    if (filterCategory !== "all") list = list.filter(t => t.category === filterCategory);
    return list;
  }, [tasks, viewMode, selectedDate, todayStr, filterPriority, filterStatus, filterCategory]);

  const tasksOnDate = (dateStr: string) => tasks.filter(t => isTaskOnDate(t, dateStr));

  const hasActiveFilters = filterPriority !== "all" || filterStatus !== "all" || filterCategory !== "all";

  const resetForm = () => {
    setNewTask("");
    setAddStartTime("");
    setAddEndTime("");
    setAddPriority("medium");
    setAddCategory("");
    setAddRecurrence("once");
    setAddEffort("");
    setShowAddForm(false);
    setEditingTaskId(null);
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTask(task.title);
    setAddDate(task.date);
    setAddStartTime(task.startTime || "");
    setAddEndTime(task.endTime || "");
    setAddPriority(task.priority);
    setAddCategory(task.category || "");
    setAddRecurrence(task.recurrence);
    setAddEffort(task.effort || "");
    setShowAddForm(true);
  };

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;

    if (editingTaskId) {
      // Edit existing task
      setTasks(prev =>
        prev.map(t =>
          t.id === editingTaskId
            ? {
                ...t,
                title,
                date: addDate,
                startTime: addStartTime || undefined,
                endTime: addEndTime || undefined,
                priority: addPriority,
                category: addCategory || undefined,
                recurrence: addRecurrence,
                effort: addEffort || undefined,
              }
            : t
        )
      );
      resetForm();
      setBuddyMsg("Udah aku update ya! ✏️");
      setTimeout(() => setBuddyMsg("Ada lagi yang mau diubah?"), 3000);
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title,
      done: false,
      date: addDate,
      startTime: addStartTime || undefined,
      endTime: addEndTime || undefined,
      priority: addPriority,
      status: "todo",
      category: addCategory || undefined,
      recurrence: addRecurrence,
      effort: addEffort || undefined,
    };
    setTasks(prev => [...prev, task]);
    resetForm();
    setBuddyMsg("Oke, aku catat ya! 💪");
    setTimeout(() => setBuddyMsg("Ada lagi yang mau dikerjain?"), 3000);
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        return {
          ...t,
          done: nowDone,
          status: nowDone ? "done" as Status : "todo" as Status,
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
        t.id === id ? { ...t, isRunning: true, status: "in_progress" as Status, startedAt: t.startedAt || new Date().toISOString() } : t
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

  const startDayOfWeek = startOfMonth(calMonth).getDay();

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      {/* Mini Buddy header */}
      <header className="flex items-center gap-2.5 px-4 py-2.5 bg-card/40 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-xs font-bold font-orbitron">B</span>
        </div>
        <p className="text-sm text-foreground/80 flex-1">{buddyMsg}</p>
      </header>

      {/* View mode tabs + filter toggle */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        <button
          onClick={() => setViewMode("today")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "today" ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
          }`}
        >
          Kalender
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${hasActiveFilters ? "bg-accent/20 text-accent" : "bg-card/50 text-muted-foreground"}`}
        >
          <Filter size={14} />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="px-4 py-2 space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted-foreground shrink-0">Prioritas:</span>
            {(["all", "high", "medium", "low"] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterPriority === p ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {p === "all" ? "Semua" : PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted-foreground shrink-0">Status:</span>
            {(["all", "todo", "in_progress", "done"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterStatus === s ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {s === "all" ? "Semua" : s === "todo" ? "To Do" : s === "in_progress" ? "Proses" : "Selesai"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted-foreground shrink-0">Kategori:</span>
            {(["all", "work", "personal", "health", "learning"] as const).map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterCategory === c ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {c === "all" ? "Semua" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterPriority("all"); setFilterStatus("all"); setFilterCategory("all"); }}
              className="flex items-center gap-1 text-[10px] text-accent"
            >
              <X size={10} /> Reset filter
            </button>
          )}
        </div>
      )}

      {/* Month Calendar */}
      {viewMode === "month" && (
        <div className="px-4 py-2">
          <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-3">
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
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
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
                      isSelected ? "bg-primary text-primary-foreground"
                        : isTodayDate ? "bg-primary/20 text-primary"
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
                              t.done ? "bg-green-400" : isSelected ? "bg-primary-foreground/70" : PRIORITY_COLORS[t.priority]
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
          const deadline = getDeadlineState(task.date);
          return (
            <div
              key={task.id}
              className={`bg-card/50 backdrop-blur-sm border rounded-xl px-3 py-3 transition-opacity ${
                task.isRunning ? "border-accent/50" : task.done ? "border-border/20 opacity-70" : "border-border/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Priority dot + checkbox */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      task.done ? "bg-green-500 border-green-500 text-primary-foreground" : "border-muted-foreground"
                    }`}
                  >
                    {task.done && <span className="text-xs">✓</span>}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm block ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </span>
                  {/* Meta row: time, category tag, deadline */}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {task.startTime && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} />
                        {task.startTime}{task.endTime ? ` - ${task.endTime}` : ""}
                      </span>
                    )}
                    {task.category && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category]}`}>
                        {CATEGORY_LABELS[task.category]}
                      </span>
                    )}
                    {deadline && !task.done && (
                      <span className={`text-[10px] ${deadline.className}`}>{deadline.label}</span>
                    )}
                    {task.recurrence !== "once" && (
                      <span className="text-[10px] text-muted-foreground">🔁 {RECURRENCE_LABELS[task.recurrence]}</span>
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
                  {!task.done && (
                    <button onClick={() => startEditing(task)} className="p-1.5 text-muted-foreground active:text-accent transition-colors">
                      <Pencil size={14} />
                    </button>
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

      {/* Add task area */}
      <div className="px-3 pt-2 pb-2 bg-card/40 backdrop-blur-md border-t border-border/30">
        {showAddForm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Judul tugas..."
              className="w-full bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            {/* Date & Time row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Tanggal</label>
                <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                  className="w-full bg-muted/50 border border-border/30 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Mulai</label>
                <input type="time" value={addStartTime} onChange={e => setAddStartTime(e.target.value)}
                  className="w-full bg-muted/50 border border-border/30 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Selesai</label>
                <input type="time" value={addEndTime} onChange={e => setAddEndTime(e.target.value)}
                  className="w-full bg-muted/50 border border-border/30 rounded-lg px-2 py-1.5 text-xs text-foreground outline-none" />
              </div>
            </div>
            {/* Priority & Category row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Prioritas</label>
                <div className="flex gap-1">
                  {(["high", "medium", "low"] as const).map(p => (
                    <button key={p} onClick={() => setAddPriority(p)}
                      className={`flex-1 py-1 rounded-lg text-[10px] transition-colors ${
                        addPriority === p ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      }`}>
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Category */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Kategori</label>
              <div className="flex gap-1">
                {(["work", "personal", "health", "learning"] as const).map(c => (
                  <button key={c} onClick={() => setAddCategory(addCategory === c ? "" : c)}
                    className={`flex-1 py-1 rounded-lg text-[10px] transition-colors ${
                      addCategory === c ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                    }`}>
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            {/* Recurrence */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Pengulangan</label>
              <div className="flex gap-1">
                {(["once", "daily", "weekly"] as const).map(r => (
                  <button key={r} onClick={() => setAddRecurrence(r)}
                    className={`flex-1 py-1 rounded-lg text-[10px] transition-colors ${
                      addRecurrence === r ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                    }`}>
                    {RECURRENCE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            {/* Effort (optional, collapsible-like) */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Effort (opsional)</label>
              <div className="flex gap-1">
                {(["quick", "medium", "deep"] as const).map(e => (
                  <button key={e} onClick={() => setAddEffort(addEffort === e ? "" : e)}
                    className={`flex-1 py-1 rounded-lg text-[10px] transition-colors ${
                      addEffort === e ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                    }`}>
                    {EFFORT_LABELS[e]}
                  </button>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex-1 py-2 rounded-lg text-xs text-muted-foreground bg-muted/30 active:bg-muted/50">
                Batal
              </button>
              <button onClick={addTask} disabled={!newTask.trim()}
                className="flex-1 py-2 rounded-lg text-xs bg-primary text-primary-foreground active:bg-primary/80 disabled:opacity-30">
                {editingTaskId ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddDate(viewMode === "today" ? todayStr : format(selectedDate, "yyyy-MM-dd"));
              setShowAddForm(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-primary-foreground active:bg-primary/80 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Tambah Tugas</span>
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default TodoPage;
