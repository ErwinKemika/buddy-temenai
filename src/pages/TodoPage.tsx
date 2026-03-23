import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

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
  const [buddyMsg, setBuddyMsg] = useState("Mau ngapain hari ini? 📝");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), title, done: false }]);
    setNewTask("");
    setBuddyMsg("Oke, aku catat ya! 💪");
    setTimeout(() => setBuddyMsg("Ada lagi yang mau dikerjain?"), 3000);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    const task = tasks.find((t) => t.id === id);
    if (task && !task.done) {
      setBuddyMsg("Mantap! Satu selesai! 🎉");
      setTimeout(() => setBuddyMsg("Lanjut yang lain yuk!"), 3000);
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setBuddyMsg("Udah aku hapus ya.");
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      {/* Mini Buddy header */}
      <header className="flex items-center gap-2.5 px-4 py-2.5 bg-card/40 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-xs font-bold font-orbitron">B</span>
        </div>
        <p className="text-sm text-foreground/80 flex-1">{buddyMsg}</p>
      </header>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-8">Belum ada tugas. Tambah yuk!</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl px-3 py-3"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                task.done
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground"
              }`}
            >
              {task.done && <span className="text-xs">✓</span>}
            </button>
            <span
              className={`flex-1 text-sm ${
                task.done ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1.5 text-muted-foreground active:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add task bar */}
      <div className="px-3 pt-2 pb-2 bg-card/40 backdrop-blur-md border-t border-border/30">
        <form
          onSubmit={(e) => { e.preventDefault(); addTask(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tambah tugas baru..."
            className="flex-1 bg-muted/50 border border-border/30 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="p-2.5 rounded-full bg-primary text-primary-foreground active:bg-primary/80 transition-colors disabled:opacity-30"
          >
            <Plus size={20} />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default TodoPage;
