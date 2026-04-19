import { MessageCircle, ListChecks, Target, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  const tabs = [
    { path: "/", label: t("nav.chat"), icon: MessageCircle },
    { path: "/todo", label: t("nav.todo"), icon: ListChecks },
    { path: "/focus", label: t("nav.focus"), icon: Target },
    { path: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="flex items-center justify-around bg-card/60 backdrop-blur-md border-t border-border/30 safe-bottom">
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
