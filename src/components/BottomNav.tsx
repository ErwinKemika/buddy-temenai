import { MessageCircle, ListChecks, Target, BarChart3, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const tabs = [
  { path: "/", label: "Chat", icon: MessageCircle },
  { path: "/todo", label: "To-Do", icon: ListChecks },
  { path: "/focus", label: "Focus", icon: Target },
  { path: "/analytics", label: "Stats", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const LOCKED_PATHS = ["/todo", "/focus", "/analytics"];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro, isMax, isTrial } = useSubscription();
  const hasProAccess = isPro || isMax || isTrial;

  return (
    <nav className="flex items-center justify-around bg-card/60 backdrop-blur-md border-t border-border/30 safe-bottom">
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        const locked = !hasProAccess && LOCKED_PATHS.includes(path);
        return (
          <button
            key={path}
            onClick={() => navigate(locked ? "/upgrade" : path)}
            className={`relative flex flex-col items-center gap-0.5 py-2 px-4 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
            {locked && (
              <span className="absolute top-0 right-0 text-[8px] bg-destructive/80 text-white rounded-full w-3 h-3 flex items-center justify-center leading-none">
                🔒
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
