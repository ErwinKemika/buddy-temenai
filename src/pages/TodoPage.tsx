import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, Filter, X, Pencil, Volume2, VolumeX, Target, Check, MapPin, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, isBefore, startOfDay } from "date-fns";
import { id as localeId, enUS } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import { useBuddyVoice } from "@/hooks/useBuddyVoice";
import { useI18n } from "@/hooks/useI18n";

type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "done";
type Category = "work" | "personal" | "health" | "learning";
type Recurrence = "once" | "daily" | "weekly";
type Effort = "quick" | "medium" | "deep";

type TaskType = "event" | "reminder";

interface Task {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  taskType?: TaskType;
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

const PRIORITY_LABEL_KEYS: Record<Priority, string> = {
  high: "todo.priorityHigh",
  medium: "todo.priorityMedium",
  low: "todo.priorityLow",
};

const CATEGORY_COLORS: Record<Category, string> = {
  work: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  personal: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  health: "bg-green-500/20 text-green-300 border-green-500/30",
  learning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const CATEGORY_LABEL_KEYS: Record<Category, string> = {
  work: "todo.catWork",
  personal: "todo.catPersonal",
  health: "todo.catHealth",
  learning: "todo.catLearning",
};

const RECURRENCE_LABEL_KEYS: Record<Recurrence, string> = {
  once: "todo.recOnce",
  daily: "todo.recDaily",
  weekly: "todo.recWeekly",
};

const EFFORT_LABEL_KEYS: Record<Effort, string> = {
  quick: "todo.effortQuick",
  medium: "todo.effortMedium",
  deep: "todo.effortDeep",
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

const getDeadlineState = (dateStr: string): { labelKey: string; className: string } | null => {
  const today = startOfDay(new Date());
  const taskDate = startOfDay(new Date(dateStr));
  if (isSameDay(today, taskDate)) return { labelKey: "todo.deadlineToday", className: "text-accent" };
  if (isBefore(taskDate, today)) return { labelKey: "todo.deadlineOverdue", className: "text-red-400" };
  return { labelKey: "todo.deadlineUpcoming", className: "text-muted-foreground" };
};

const TodoPage = () => {
  const { t, lang } = useI18n();
  const dateLocale = lang === "en" ? enUS : localeId;
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const { voiceEnabled, toggleVoice, speak } = useBuddyVoice();
  const hasSpokenInitial = useRef(false);
  const [newTask, setNewTask] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [addEndDate, setAddEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addAllDay, setAddAllDay] = useState(false);
  const [addLocation, setAddLocation] = useState("");
  const [addTaskType, setAddTaskType] = useState<TaskType>("event");
  const [addNotes, setAddNotes] = useState("");
  const [addPriority, setAddPriority] = useState<Priority>("medium");
  const [addCategory, setAddCategory] = useState<Category | "">("");
  const [addRecurrence, setAddRecurrence] = useState<Recurrence>("once");
  const [addEffort, setAddEffort] = useState<Effort | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const getBuddyLine = (taskList: Task[]) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayTasks = taskList.filter(task => isTaskOnDate(task, todayStr));
    const pending = todayTasks.filter(task => !task.done);
    const done = todayTasks.filter(task => task.done);
    const overdue = taskList.filter(task => {
      const ds = getDeadlineState(task.date);
      return ds?.labelKey === "todo.deadlineOverdue" && !task.done;
    });

    if (todayTasks.length === 0) {
      const keys = ["todo.b.empty1", "todo.b.empty2", "todo.b.empty3", "todo.b.empty4"];
      return t(keys[Math.floor(Math.random() * keys.length)]);
    }
    if (overdue.length > 0) {
      return t("todo.b.overdue", { n: overdue.length });
    }
    if (done.length > 0 && pending.length === 0) {
      return t(Math.random() < 0.5 ? "todo.b.allDone1" : "todo.b.allDone2");
    }
    if (pending.length > 0) {
      const keys = ["todo.b.pending1", "todo.b.pending2", "todo.b.pending3"];
      return t(keys[Math.floor(Math.random() * keys.length)], { n: pending.length });
    }
    return t("todo.b.ready");
  };

  const [buddyMsg, setBuddyMsg] = useState(() => "");
  const [buddyMsgVisible, setBuddyMsgVisible] = useState(true);
  const [buddySpeaking, setBuddySpeaking] = useState(false);

  // Set initial message after mount
  useEffect(() => {
    setBuddyMsg(getBuddyLine(tasks));
  }, []);

  // Speak initial message once per session
  useEffect(() => {
    if (!hasSpokenInitial.current && buddyMsg) {
      hasSpokenInitial.current = true;
      // Small delay so page loads first
      const t = setTimeout(() => speak(buddyMsg), 800);
      return () => clearTimeout(t);
    }
  }, [buddyMsg]);

  // Animate message transitions + trigger voice
  const updateBuddyMsg = (msg: string, autoRevert?: string, revertDelay = 3500) => {
    setBuddyMsgVisible(false);
    setBuddySpeaking(true);
    setTimeout(() => {
      setBuddyMsg(msg);
      setBuddyMsgVisible(true);
      speak(msg); // Speak the action message
      setTimeout(() => setBuddySpeaking(false), 600);
    }, 200);
    if (autoRevert) {
      setTimeout(() => {
        setBuddyMsgVisible(false);
        setTimeout(() => {
          setBuddyMsg(autoRevert);
          setBuddyMsgVisible(true);
        }, 200);
      }, revertDelay);
    }
  };

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
    setAddDate(format(new Date(), "yyyy-MM-dd"));
    setAddEndDate(format(new Date(), "yyyy-MM-dd"));
    setAddStartTime("");
    setAddEndTime("");
    setAddAllDay(false);
    setAddLocation("");
    setAddTaskType("event");
    setAddNotes("");
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
    setAddEndDate(task.endDate || task.date);
    setAddStartTime(task.startTime || "");
    setAddEndTime(task.endTime || "");
    setAddAllDay(task.allDay || false);
    setAddLocation(task.location || "");
    setAddTaskType(task.taskType || "event");
    setAddNotes(task.notes || "");
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
      setTasks(prev =>
        prev.map(t =>
          t.id === editingTaskId
            ? {
                ...t,
                title,
                date: addDate,
                endDate: addTaskType === "event" ? addEndDate || undefined : undefined,
                startTime: addAllDay ? undefined : (addStartTime || undefined),
                endTime: addAllDay ? undefined : (addEndTime || undefined),
                allDay: addAllDay || undefined,
                location: addLocation || undefined,
                taskType: addTaskType,
                notes: addNotes || undefined,
                priority: addPriority,
                category: addCategory || undefined,
                recurrence: addRecurrence,
                effort: addEffort || undefined,
              }
            : t
        )
      );
      resetForm();
      updateBuddyMsg(t("todo.b.updated"), getBuddyLine(tasks));
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title,
      done: false,
      date: addDate,
      endDate: addTaskType === "event" ? addEndDate || undefined : undefined,
      startTime: addAllDay ? undefined : (addStartTime || undefined),
      endTime: addAllDay ? undefined : (addEndTime || undefined),
      allDay: addAllDay || undefined,
      location: addLocation || undefined,
      taskType: addTaskType,
      notes: addNotes || undefined,
      priority: addPriority,
      status: "todo",
      category: addCategory || undefined,
      recurrence: addRecurrence,
      effort: addEffort || undefined,
    };
    setTasks(prev => [...prev, task]);
    resetForm();
    updateBuddyMsg(t("todo.b.added"), getBuddyLine([...tasks, task]));
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
      updateBuddyMsg(t("todo.b.done"), t("todo.b.continue"));
    }
  };

  const startTask = (_id: string) => {
    // Task execution moved to Focus page
  
    updateBuddyMsg(t("todo.b.go"));
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
    updateBuddyMsg(t("todo.b.deleted"), getBuddyLine(tasks.filter(task => task.id !== id)));
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
      <header className="relative px-4 pt-[env(safe-area-inset-top,12px)] pb-2 bg-card/40 backdrop-blur-md border-b border-border/30 overflow-hidden">
        <div className="flex items-center gap-3 pt-2">
          {/* Voice toggle */}
          <button
            onClick={toggleVoice}
            className="absolute top-[env(safe-area-inset-top,12px)] right-3 mt-2 p-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border/30 z-10 transition-colors"
            aria-label={voiceEnabled ? "Matikan suara Buddy" : "Nyalakan suara Buddy"}
          >
            {voiceEnabled ? <Volume2 size={14} className="text-accent" /> : <VolumeX size={14} className="text-muted-foreground" />}
          </button>
          {/* Mini Buddy Robot */}
          <div className="relative shrink-0 animate-buddy-header-float">
            {/* Glow */}
            <div className="absolute inset-0 w-[52px] h-[52px] rounded-full bg-primary/15 blur-md" />
            <div className="relative w-[52px] h-[52px]">
              {/* Antenna */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <div className="w-0.5 h-2 bg-accent/40" />
              </div>
              {/* Head */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-8 rounded-[0.7rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/20 flex items-center justify-center">
                {/* Eyes */}
                <div className="flex gap-2.5 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent animate-blink" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent animate-blink" style={{ animationDelay: '0.05s' }} />
                </div>
                {/* Ears */}
                <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-l-full bg-primary/30" />
                <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-r-full bg-primary/30" />
              </div>
            </div>
          </div>

          {/* Speech Bubble — Buddy speaking line */}
          <div className="relative flex-1">
            <div className={`relative bg-card/60 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-lg shadow-primary/5 transition-all duration-300 ${buddyMsgVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              {/* Bubble arrow */}
              <div className="absolute left-[-6px] top-4 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-primary/20" />
              {/* Speaking indicator dots */}
              <div className="flex items-start gap-2">
                <p className="text-sm text-foreground/90 leading-snug flex-1 font-medium">{buddyMsg}</p>
                {buddySpeaking && (
                  <span className="flex gap-0.5 items-center pt-1 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* View mode tabs + filter toggle */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        <button
          onClick={() => setViewMode("today")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "today" ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
          }`}
        >
          {t("todo.today")}
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
          }`}
        >
          {t("todo.calendar")}
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
            <span className="text-[10px] text-muted-foreground shrink-0">{t("todo.filterPriority")}</span>
            {(["all", "high", "medium", "low"] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterPriority === p ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {p === "all" ? t("common.all") : t(PRIORITY_LABEL_KEYS[p])}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted-foreground shrink-0">{t("todo.filterStatus")}</span>
            {(["all", "todo", "in_progress", "done"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterStatus === s ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {s === "all" ? t("common.all") : s === "todo" ? t("todo.statusTodo") : s === "in_progress" ? t("todo.statusInProgress") : t("todo.statusDone")}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-muted-foreground shrink-0">{t("todo.filterCategory")}</span>
            {(["all", "work", "personal", "health", "learning"] as const).map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 transition-colors ${
                  filterCategory === c ? "bg-primary text-primary-foreground" : "bg-card/50 text-muted-foreground"
                }`}
              >
                {c === "all" ? t("common.all") : t(CATEGORY_LABEL_KEYS[c])}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterPriority("all"); setFilterStatus("all"); setFilterCategory("all"); }}
              className="flex items-center gap-1 text-[10px] text-accent"
            >
              <X size={10} /> {t("todo.resetFilter")}
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
                {format(calMonth, "MMMM yyyy", { locale: dateLocale })}
              </span>
              <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1 text-muted-foreground active:text-foreground">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {t("todo.calDays").split(",").map(d => (
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
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-2">
        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {viewMode === "today" ? t("todo.noTasksToday") : t("todo.noTasksDate")}
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
                    {task.taskType === "reminder" && (
                      <span className="text-[9px] text-accent/70 flex items-center gap-0.5">
                        <Bell size={9} />
                        Reminder
                      </span>
                    )}
                    {task.allDay ? (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <CalendarIcon size={10} />
                        {t("todo.allDayLabel")}
                      </span>
                    ) : task.startTime && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} />
                        {task.startTime}{task.endTime ? ` - ${task.endTime}` : ""}
                      </span>
                    )}
                    {task.location && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin size={9} />
                        {task.location}
                      </span>
                    )}
                    {task.category && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category]}`}>
                        {t(CATEGORY_LABEL_KEYS[task.category])}
                      </span>
                    )}
                    {deadline && !task.done && (
                      <span className={`text-[10px] ${deadline.className}`}>{t(deadline.labelKey)}</span>
                    )}
                    {task.recurrence !== "once" && (
                      <span className="text-[10px] text-muted-foreground">🔁 {t(RECURRENCE_LABEL_KEYS[task.recurrence])}</span>
                    )}
                    {elapsed && (
                      <span className={`text-[10px] font-mono ${task.isRunning ? "text-accent" : "text-muted-foreground"}`}>
                        ⏱ {elapsed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!task.done && (
                    <button onClick={() => navigate(`/focus?taskId=${task.id}`)} className="p-1.5 text-primary active:text-primary/80 transition-colors" title="Fokus">
                      <Target size={14} />
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
                      {t("todo.started")} {format(new Date(task.startedAt), "dd/MM HH:mm")}
                    </span>
                  )}
                  {task.completedAt && (
                    <span className="text-[10px] text-green-400">
                      {t("todo.completed")} {format(new Date(task.completedAt), "dd/MM HH:mm")}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button (always visible at bottom) */}
      <div className="px-3 pt-2 pb-2 bg-card/40 backdrop-blur-md border-t border-border/30">
        <button
          onClick={() => {
            setAddDate(viewMode === "today" ? todayStr : format(selectedDate, "yyyy-MM-dd"));
            setAddEndDate(viewMode === "today" ? todayStr : format(selectedDate, "yyyy-MM-dd"));
            setShowAddForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-primary-foreground active:bg-primary/80 transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">{t("todo.addActivity")}</span>
        </button>
      </div>

      {/* iOS-style full-screen add/edit form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/60 backdrop-blur-md">
            <button
              onClick={resetForm}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
            <h2 className="text-base font-semibold text-foreground font-orbitron tracking-wide">
              {editingTaskId ? t("todo.edit") : t("todo.new")}
            </h2>
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/20 text-primary active:bg-primary/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Check size={18} />
            </button>
          </div>

          {/* Event / Reminder segmented control */}
          <div className="px-4 pt-3 pb-2 bg-card/30">
            <div className="flex bg-muted/60 rounded-xl p-1 gap-1">
              <button
                onClick={() => setAddTaskType("event")}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  addTaskType === "event"
                    ? "bg-card shadow text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Event
              </button>
              <button
                onClick={() => setAddTaskType("reminder")}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  addTaskType === "reminder"
                    ? "bg-card shadow text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Reminder
              </button>
            </div>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Title + Location */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/20">
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder={t("todo.titleField")}
                className="w-full bg-transparent px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border/20"
                autoFocus
              />
              <div className="flex items-center px-4 py-3 border-b border-border/20">
                <MapPin size={15} className="text-muted-foreground/50 mr-3 shrink-0" />
                <input
                  type="text"
                  value={addLocation}
                  onChange={e => setAddLocation(e.target.value)}
                  placeholder={t("todo.location")}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
              <textarea
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                placeholder={t("todo.notes")}
                rows={3}
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
              />
            </div>

            {/* Date / Time section */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/20">
              {/* All-day toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/15">
                <span className="text-sm text-foreground">{t("todo.allDay")}</span>
                <button
                  onClick={() => setAddAllDay(!addAllDay)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${addAllDay ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all duration-200 ${addAllDay ? "left-[26px]" : "left-0.5"}`} />
                </button>
              </div>

              {/* Starts */}
              <div className={`flex items-center px-4 py-3.5 ${addTaskType === "event" ? "border-b border-border/15" : ""}`}>
                <span className="text-sm text-foreground flex-1">{t("todo.starts")}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={addDate}
                    onChange={e => setAddDate(e.target.value)}
                    className="bg-primary/15 text-primary text-xs px-2.5 py-1.5 rounded-xl border border-primary/20 outline-none"
                  />
                  {!addAllDay && (
                    <input
                      type="time"
                      value={addStartTime}
                      onChange={e => setAddStartTime(e.target.value)}
                      className="bg-primary/15 text-primary text-xs px-2.5 py-1.5 rounded-xl border border-primary/20 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Ends — Event only */}
              {addTaskType === "event" && (
                <div className="flex items-center px-4 py-3.5">
                  <span className="text-sm text-foreground flex-1">{t("todo.ends")}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={addEndDate}
                      onChange={e => setAddEndDate(e.target.value)}
                      className="bg-muted/60 text-muted-foreground text-xs px-2.5 py-1.5 rounded-xl border border-border/20 outline-none"
                    />
                    {!addAllDay && (
                      <input
                        type="time"
                        value={addEndTime}
                        onChange={e => setAddEndTime(e.target.value)}
                        className="bg-muted/60 text-muted-foreground text-xs px-2.5 py-1.5 rounded-xl border border-border/20 outline-none"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Priority + Category + Recurrence */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/20">
              {/* Priority */}
              <div className="px-4 py-3 border-b border-border/15">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("todo.priority")}</span>
                <div className="flex gap-1.5 mt-2">
                  {(["high", "medium", "low"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setAddPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                        addPriority === p ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground active:bg-muted"
                      }`}
                    >
                      {t(PRIORITY_LABEL_KEYS[p])}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="px-4 py-3 border-b border-border/15">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("todo.category")}</span>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {(["work", "personal", "health", "learning"] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setAddCategory(addCategory === c ? "" : c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        addCategory === c ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground active:bg-muted"
                      }`}
                    >
                      {t(CATEGORY_LABEL_KEYS[c])}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurrence */}
              <div className="px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("todo.recurrence")}</span>
                <div className="flex gap-1.5 mt-2">
                  {(["once", "daily", "weekly"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setAddRecurrence(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                        addRecurrence === r ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground active:bg-muted"
                      }`}
                    >
                      {t(RECURRENCE_LABEL_KEYS[r])}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Effort */}
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/20 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("todo.effort")}</span>
              <div className="flex gap-1.5 mt-2">
                {(["quick", "medium", "deep"] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => setAddEffort(addEffort === e ? "" : e)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                      addEffort === e ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground active:bg-muted"
                    }`}
                  >
                    {t(EFFORT_LABEL_KEYS[e])}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe area spacer */}
            <div className="h-4" />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default TodoPage;
