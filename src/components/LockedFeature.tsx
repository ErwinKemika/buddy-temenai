import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

interface LockedFeatureProps {
  featureName: string;
  requiredPlan: "pro" | "max";
  variant?: "page" | "inline";
}

const LockedFeature = ({ featureName, requiredPlan, variant = "page" }: LockedFeatureProps) => {
  const navigate = useNavigate();

  const badge = requiredPlan === "pro" ? (
    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/20 text-primary">✨ Pro</span>
  ) : (
    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-accent/20 text-accent">👑 Buddy Max</span>
  );

  const planLabel = requiredPlan === "pro" ? "Pro" : "Buddy Max";

  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-border/30 bg-card/40 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <span className="text-sm font-medium text-foreground">{featureName}</span>
          {badge}
        </div>
        <Button size="sm" onClick={() => navigate("/upgrade")}>Upgrade</Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 text-center gap-4">
        <span className="text-6xl">🔒</span>
        <h1 className="text-xl font-bold font-orbitron text-foreground">{featureName}</h1>
        {badge}
        <p className="text-sm text-muted-foreground">
          Fitur ini tersedia di plan {planLabel} ke atas.
        </p>
        <Button onClick={() => navigate("/upgrade")}>Lihat Plan →</Button>
      </div>
      <BottomNav />
    </div>
  );
};

export default LockedFeature;
