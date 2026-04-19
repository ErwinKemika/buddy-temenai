import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import buddyAvatar from "@/assets/buddy-avatar.png";
import { useI18n } from "@/hooks/useI18n";

const AuthPage = () => {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (!authLoading && user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcome"));
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        localStorage.setItem("buddy-new-user", "true");
        toast.success(t("auth.created"));
      }
    } catch (error: any) {
      toast.error(error.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-background px-6">
      {/* Buddy Avatar */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden mb-3 shadow-lg shadow-primary/20">
          <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold font-orbitron text-foreground">Buddy</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.subtitle")}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-card/60 border-border/40 text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-card/60 border-border/40 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm font-orbitron transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30"
        >
          {loading ? t("common.processing") : isLogin ? t("auth.login") : t("auth.register")}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-muted-foreground hover:text-accent transition-colors"
      >
        {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
      </button>
    </div>
  );
};

export default AuthPage;
