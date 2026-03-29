import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Crown, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    id: "free" as const,
    name: "Gratis",
    price: "Rp0",
    period: "",
    features: ["20 pesan/hari", "Chat only"],
    icon: null,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "Rp29.000",
    period: "/bln",
    features: [
      "Unlimited chat",
      "Voice mode",
      "Attachment",
      "To-do & reminder",
      "YouTube search",
      "WhatsApp reminder",
    ],
    icon: Zap,
    highlight: true,
  },
  {
    id: "max" as const,
    name: "Buddy Max",
    price: "Rp49.000",
    period: "/bln",
    features: [
      "Semua fitur Pro",
      "Google Calendar sync",
      "Prioritas response",
      "Custom Buddy persona",
    ],
    icon: Crown,
  },
];

const UpgradePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan: currentPlan, isTrial, daysLeftTrial, loading } = useSubscription();
  const isOnboarding = searchParams.get("onboarding") === "true";

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      localStorage.removeItem("buddy-new-user");
      toast({
        title: "Pembayaran berhasil! 🎉",
        description: "Akun kamu sudah di-upgrade. Nikmati fitur premium!",
      });
    } else if (status === "failed") {
      toast({
        title: "Pembayaran gagal",
        description: "Silakan coba lagi atau gunakan metode pembayaran lain.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleUpgrade = async (planId: "pro" | "max") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          plan: planId,
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        },
      });

      if (error) throw error;

      if (data?.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (err) {
      console.error("[Upgrade]", err);
      toast({
        title: "Gagal membuat pembayaran",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (planId === "free" && (currentPlan === "free" || currentPlan === "trial")) return true;
    return currentPlan === planId;
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isOnboarding ? navigate("/", { replace: true }) : navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-orbitron">Upgrade Plan</h1>
        </div>

        {isTrial && (
          <div className="mb-6 p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">
            ⏳ Trial kamu tersisa <strong>{daysLeftTrial} hari</strong> lagi.
            Upgrade sekarang untuk akses penuh!
          </div>
        )}

        <div className="space-y-4">
          {plans.map((p) => {
            const isCurrent = isCurrentPlan(p.id);
            const Icon = p.icon;

            return (
              <Card
                key={p.id}
                className={`p-5 border ${
                  p.highlight
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                    <h3 className="font-bold text-lg">{p.name}</h3>
                  </div>
                  {isCurrent && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      Plan saat ini
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{p.price}</span>
                  {p.period && (
                    <span className="text-muted-foreground text-sm">{p.period}</span>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {p.id !== "free" && !isCurrent && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(p.id as "pro" | "max")}
                    disabled={loading}
                  >
                    Upgrade ke {p.name}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
