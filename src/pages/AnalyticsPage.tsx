import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { useGamification, getLevelProgress, ACHIEVEMENTS } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_COLORS = ["hsl(250,80%,65%)", "hsl(200,90%,55%)", "hsl(40,90%,55%)", "hsl(340,70%,55%)", "hsl(160,60%,45%)"];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { profile, highEffortCount, loading } = useGamification();
  const [dailyData, setDailyData] = useState<{ day: string; count: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchCharts = async () => {
      // Last 7 days
      const sevenDaysAgo = subDays(new Date(), 6).toISOString();
      const { data: todos } = await supabase
        .from("todos")
        .select("completed_at, category, done")
        .eq("user_id", user.id)
        .eq("done", true);

      if (!todos) return;

      // Daily chart
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dayMap[d] = 0;
      }
      for (const t of todos) {
        const d = t.completed_at?.slice(0, 10);
        if (d && d in dayMap) dayMap[d]++;
      }
      setDailyData(Object.entries(dayMap).map(([day, count]) => ({
        day: format(new Date(day), "EEE", { locale: id }),
        count,
      })));

      // Category chart
      const catMap: Record<string, number> = {};
      for (const t of todos) {
        const cat = t.category || "Lainnya";
        catMap[cat] = (catMap[cat] || 0) + 1;
      }
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    };

    fetchCharts();
  }, [user?.id]);

  const levelProgress = getLevelProgress(profile.xp);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-orbitron text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background buddy-gradient-bg space-stars overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <h1 className="text-xl font-orbitron font-bold text-foreground mb-4">📊 Analytics</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-center">
            <div className="text-2xl">{profile.streak > 3 ? "🔥" : "📅"}</div>
            <div className="text-lg font-bold font-orbitron text-foreground">{profile.streak}</div>
            <div className="text-[10px] text-muted-foreground">Streak</div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-center">
            <div className="text-2xl">⚡</div>
            <div className="text-lg font-bold font-orbitron text-foreground">Lv.{profile.level}</div>
            <div className="text-[10px] text-muted-foreground">{profile.xp} XP</div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-center">
            <div className="text-2xl">✅</div>
            <div className="text-lg font-bold font-orbitron text-foreground">{profile.total_tasks_completed}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Level {profile.level}</span>
            <span className="text-xs text-muted-foreground">{levelProgress.current}/{levelProgress.needed} XP</span>
          </div>
          <Progress value={levelProgress.percent} className="h-3" />
          {profile.level < 5 && (
            <p className="text-[10px] text-muted-foreground mt-1">Level {profile.level + 1} berikutnya</p>
          )}
        </div>

        {/* Achievements */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">🏅 Achievements</h2>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const earned = a.check(profile, highEffortCount);
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 transition-all ${
                    earned
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card/30 border-border/20 opacity-50"
                  }`}
                >
                  <div className="text-xl mb-1">{a.icon}</div>
                  <div className="text-xs font-semibold text-foreground">{a.title}</div>
                  <div className="text-[10px] text-muted-foreground">{a.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">📈 7 Hari Terakhir</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220,15%,55%)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(220,15%,55%)" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{ background: "hsl(220,25%,10%)", border: "1px solid hsl(220,20%,18%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(220,20%,90%)" }}
              />
              <Bar dataKey="count" fill="hsl(250,80%,65%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Chart */}
        {categoryData.length > 0 && (
          <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">📂 Per Kategori</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AnalyticsPage;
