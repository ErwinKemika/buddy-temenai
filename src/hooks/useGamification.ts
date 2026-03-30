import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GamificationProfile {
  xp: number;
  level: number;
  streak: number;
  last_active_date: string | null;
  total_tasks_completed: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 100 },
  { level: 2, min: 101, max: 300 },
  { level: 3, min: 301, max: 600 },
  { level: 4, min: 601, max: 1000 },
  { level: 5, min: 1001, max: Infinity },
];

export function getLevel(xp: number): number {
  for (const t of LEVEL_THRESHOLDS) {
    if (xp <= t.max) return t.level;
  }
  return 5;
}

export function getLevelProgress(xp: number): { current: number; needed: number; percent: number } {
  const lvl = getLevel(xp);
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === lvl)!;
  const prevMax = lvl === 1 ? 0 : LEVEL_THRESHOLDS[lvl - 2].max;
  const current = xp - prevMax;
  const needed = threshold.max === Infinity ? 1000 : threshold.max - prevMax;
  const percent = Math.min(100, (current / needed) * 100);
  return { current, needed: threshold.max === Infinity ? current : needed, percent };
}

const EFFORT_XP: Record<string, number> = {
  quick: 10,
  low: 10,
  medium: 25,
  deep: 50,
  high: 50,
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (p: GamificationProfile, highEffortCount: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_step", title: "First Step", description: "Selesaikan tugas pertamamu", icon: "🎯", check: (p) => p.total_tasks_completed >= 1 },
  { id: "on_fire", title: "On Fire", description: "Raih streak 7 hari", icon: "🔥", check: (p) => p.streak >= 7 },
  { id: "hard_worker", title: "Hard Worker", description: "Selesaikan 5 tugas high-effort", icon: "💪", check: (_, h) => h >= 5 },
  { id: "centurion", title: "Centurion", description: "Selesaikan 100 tugas total", icon: "🏆", check: (p) => p.total_tasks_completed >= 100 },
  { id: "level_up", title: "Level Up", description: "Capai Level 3", icon: "⚡", check: (p) => p.level >= 3 },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useGamification() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile>({
    xp: 0, level: 1, streak: 0, last_active_date: null, total_tasks_completed: 0,
  });
  const [highEffortCount, setHighEffortCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("xp, level, streak, last_active_date, total_tasks_completed")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data as GamificationProfile);
      } else {
        // Create default profile for new user
        await supabase.from("profiles").insert({
          user_id: user.id,
          xp: 0,
          level: 1,
          streak: 0,
          total_tasks_completed: 0,
          last_active_date: null,
        });
      }

      const { count } = await supabase
        .from("todos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("done", true)
        .in("effort", ["deep", "high"]);

      setHighEffortCount(count || 0);
      setLoading(false);
    };

    fetch();
  }, [user?.id]);

  const awardXP = useCallback(async (effort?: string) => {
    if (!user) return;

    const xpGain = EFFORT_XP[effort || ""] || 10;
    const today = todayStr();

    let { data: current } = await supabase
      .from("profiles")
      .select("xp, streak, last_active_date, total_tasks_completed")
      .eq("user_id", user.id)
      .single();

    if (!current) {
      await supabase.from("profiles").insert({
        user_id: user.id,
        xp: 0,
        level: 1,
        streak: 0,
        total_tasks_completed: 0,
        last_active_date: null,
      });
      current = { xp: 0, streak: 0, last_active_date: null, total_tasks_completed: 0 };
    }

    const newXP = (current.xp || 0) + xpGain;
    const newLevel = getLevel(newXP);
    const newTotal = (current.total_tasks_completed || 0) + 1;

    let newStreak = current.streak || 0;
    const lastDate = current.last_active_date;
    if (lastDate === today) {
    } else if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates = {
      xp: newXP,
      level: newLevel,
      streak: newStreak,
      last_active_date: today,
      total_tasks_completed: newTotal,
    };

    await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    setProfile(prev => ({ ...prev, ...updates }));

    if (effort === "deep" || effort === "high") {
      setHighEffortCount(prev => prev + 1);
    }
  }, [user]);

  return { profile, highEffortCount, loading, awardXP };
}
