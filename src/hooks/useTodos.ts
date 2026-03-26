import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useGamification } from "./useGamification";

export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "done";
export type Category = "work" | "personal" | "health" | "learning";
export type Recurrence = "once" | "daily" | "weekly";
export type Effort = "quick" | "medium" | "deep";

export interface Task {
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

const STORAGE_KEY = "buddy-todos";

function loadLocal(): Task[] {
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
}

function saveLocal(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function dbToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    done: row.completed,
    date: row.deadline || "",
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    priority: (row.priority || "medium") as Priority,
    status: row.completed ? "done" : "todo",
    category: row.category as Category | undefined,
    recurrence: (row.recurrence || "once") as Recurrence,
    effort: row.effort as Effort | undefined,
    completedAt: row.completed_at || undefined,
  };
}

function taskToDb(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    deadline: task.date || null,
    start_time: task.startTime || null,
    end_time: task.endTime || null,
    priority: task.priority,
    category: task.category || null,
    recurrence: task.recurrence,
    effort: task.effort || null,
    completed: task.done,
  };
}

// Module-level cache so all useTodos instances share state
let cachedTasks: Task[] | null = null;
let cachedUserId: string | null = null;

export function useTodos() {
  const { user } = useAuth();
  const { awardXP } = useGamification();
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Use cached tasks if available for this user, otherwise load from localStorage
    if (cachedTasks && cachedUserId === user?.id) return cachedTasks;
    return loadLocal();
  });
  const [loading, setLoading] = useState(false);

  // Sync module cache whenever tasks change
  useEffect(() => {
    cachedTasks = tasks;
    cachedUserId = user?.id || null;
  }, [tasks, user?.id]);

  // Load from Supabase only once per user session
  useEffect(() => {
    if (!user) {
      cachedTasks = null;
      cachedUserId = null;
      setTasks(loadLocal());
      return;
    }

    // If we already have cached data for this user, skip fetch
    if (cachedUserId === user.id && cachedTasks && cachedTasks.length > 0) {
      setTasks(cachedTasks);
      return;
    }

    const fetchTodos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useTodos] fetch error:", error);
        setTasks(loadLocal());
      } else if (data && data.length > 0) {
        const mapped = data.map(dbToTask);
        setTasks(mapped);
        saveLocal(mapped);
      } else {
        // First login: push localStorage tasks to Supabase
        const local = loadLocal();
        if (local.length > 0) {
          const rows = local.map(t => taskToDb(t, user.id));
          await supabase.from("todos").upsert(rows as any, { onConflict: "id" });
          setTasks(local);
        }
      }
      setLoading(false);
    };

    fetchTodos();
  }, [user?.id]);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    saveLocal(tasks);
  }, [tasks]);

  const addTask = useCallback(async (task: Task) => {
    setTasks(prev => [...prev, task]);
    if (user) {
      const { error } = await supabase.from("todos").insert(taskToDb(task, user.id) as any);
      if (error) console.error("[useTodos] insert error:", error);
    }
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    let taskEffort: string | undefined;
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        if (updates.done === true && !t.done) taskEffort = t.effort;
        return { ...t, ...updates };
      })
    );
    if (user) {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.date !== undefined) dbUpdates.deadline = updates.date || null;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime || null;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime || null;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.category !== undefined) dbUpdates.category = updates.category || null;
      if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
      if (updates.effort !== undefined) dbUpdates.effort = updates.effort || null;
      if (updates.done !== undefined) dbUpdates.completed = updates.done;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from("todos").update(dbUpdates).eq("id", id);
        if (error) console.error("[useTodos] update error:", error);
      }

      // Award XP when completing via updateTask (e.g. Focus timer)
      if (updates.done === true && taskEffort !== undefined) {
        await awardXP(taskEffort);
      }
    }
  }, [user, awardXP]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (user) {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) console.error("[useTodos] delete error:", error);
    }
  }, [user]);

  const toggleTask = useCallback(async (id: string) => {
    let newDone = false;
    let taskEffort: string | undefined;
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        newDone = !t.done;
        taskEffort = t.effort;
        return {
          ...t,
          done: newDone,
          status: newDone ? "done" as Status : "todo" as Status,
          completedAt: newDone ? new Date().toISOString() : undefined,
          isRunning: newDone ? false : t.isRunning,
        };
      })
    );
    if (user) {
      const { error } = await supabase
        .from("todos")
        .update({ completed: newDone, completed_at: newDone ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) console.error("[useTodos] toggle error:", error);
      
      // Award XP when completing a task
      if (newDone) {
        await awardXP(taskEffort);
      }
    }
  }, [user, awardXP]);

  const bulkUpdate = useCallback(async (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    saveLocal(updatedTasks);
    // No bulk Supabase update needed — callers handle individual updates
  }, []);

  return { tasks, setTasks: bulkUpdate, loading, addTask, updateTask, deleteTask, toggleTask };
}
