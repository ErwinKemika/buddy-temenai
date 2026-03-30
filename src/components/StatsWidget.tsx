import { useEffect, useState } from "react";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const StatsWidget = () => {
  const { user } = useAuth();
  const { profile, loading } = useGamification();
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("done", true)
      .gte("created_at", `${today}T00:00:00`)
      .then(({ count }) => setTodayCount(count || 0));
  }, [user?.id, profile.total_tasks_completed]);

  if (loading || !user) return null;

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2">
      <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full px-3 py-1.5">
        <span className="text-sm">{profile.streak > 3 ? "🔥" : "📅"}</span>
        <span className="text-xs font-bold font-orbitron text-foreground">{profile.streak}</span>
      </div>
      <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full px-3 py-1.5">
        <span className="text-sm">⚡</span>
        <span className="text-xs font-bold font-orbitron text-foreground">Lv.{profile.level}</span>
      </div>
      <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-border/30 rounded-full px-3 py-1.5">
        <span className="text-sm">✅</span>
        <span className="text-xs font-bold font-orbitron text-foreground">{todayCount}</span>
      </div>
    </div>
  );
};

export default StatsWidget;
