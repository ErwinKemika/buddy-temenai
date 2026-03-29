import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Plan = "trial" | "free" | "pro" | "max";

interface SubscriptionState {
  plan: Plan;
  isFree: boolean;
  isPro: boolean;
  isMax: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
  daysLeftTrial: number;
  loading: boolean;
}

export const useSubscription = (): SubscriptionState => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("trial");
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("plan, trial_expires_at, pro_expires_at")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          setLoading(false);
          return;
        }

        const now = new Date();
        const currentPlan = (data as any).plan as Plan;
        const trialExp = (data as any).trial_expires_at as string | null;
        const proExp = (data as any).pro_expires_at as string | null;

        setTrialExpiresAt(trialExp);

        // Check if pro/max expired
        if ((currentPlan === "pro" || currentPlan === "max") && proExp && new Date(proExp) < now) {
          // Pro expired, downgrade to free
          await supabase
            .from("profiles")
            .update({ plan: "free" } as any)
            .eq("user_id", user.id);
          setPlan("free");
        } else if (currentPlan === "trial" && trialExp && new Date(trialExp) < now) {
          // Trial expired, auto-downgrade
          await supabase
            .from("profiles")
            .update({ plan: "free" } as any)
            .eq("user_id", user.id);
          setPlan("free");
        } else {
          setPlan(currentPlan);
        }
      } catch (err) {
        console.error("[useSubscription]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  const now = new Date();
  const trialExpDate = trialExpiresAt ? new Date(trialExpiresAt) : null;
  const isTrialExpired = plan === "trial" && trialExpDate ? trialExpDate < now : false;
  const daysLeftTrial =
    plan === "trial" && trialExpDate
      ? Math.max(0, Math.ceil((trialExpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const effectivePlan = isTrialExpired ? "free" : plan;

  return {
    plan: effectivePlan,
    isFree: effectivePlan === "free",
    isPro: effectivePlan === "pro",
    isMax: effectivePlan === "max",
    isTrial: effectivePlan === "trial",
    isTrialExpired,
    daysLeftTrial,
    loading,
  };
};
