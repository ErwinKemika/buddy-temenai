import { Moon, Sun, Volume2, VolumeX, Play, Pause, ArrowLeft, LogOut, Phone, Crown, Languages, ChevronRight, ChevronDown, BookOpen, Info } from "lucide-react";
import AboutAiyo from "@/components/AboutAiyo";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import buddyAvatar from "@/assets/buddy-avatar.png";
import { useI18n, LANG_CHANGE_EVENT } from "@/hooks/useI18n";

const SettingsPage = () => {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("buddy-voice-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => {
    const saved = localStorage.getItem("buddy-autoplay-voice");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [language, setLanguage] = useState<"id" | "en">(() => {
    return (localStorage.getItem("buddy-language") as "id" | "en") || "id";
  });
  const [aiLanguage, setAiLanguage] = useState<"id" | "en">(() => {
    return (localStorage.getItem("buddy-ai-language") as "id" | "en") || "id";
  });
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappEditing, setWhatsappEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("buddy-voice-enabled", JSON.stringify(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("buddy-autoplay-voice", JSON.stringify(autoPlayVoice));
  }, [autoPlayVoice]);

  useEffect(() => {
    localStorage.setItem("buddy-language", language);
    window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT));
  }, [language]);

  useEffect(() => {
    localStorage.setItem("buddy-ai-language", aiLanguage);
  }, [aiLanguage]);

  const handleLanguageTap = () => {
    if (language === "id") {
      setShowLangDialog(true);
    } else {
      setLanguage("id");
      setAiLanguage("id");
    }
  };

  const confirmLang = (includeAi: boolean) => {
    setLanguage("en");
    setAiLanguage(includeAi ? "en" : "id");
    setShowLangDialog(false);
  };

  const [showGeneral, setShowGeneral] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleRestartTour = () => {
    localStorage.removeItem("aiyo-tour-completed");
    window.dispatchEvent(new CustomEvent("aiyo-restart-tour"));
    navigate("/");
  };

  // Load WhatsApp number from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("whatsapp_number")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
        }
      });
  }, [user]);

  const saveWhatsappNumber = async () => {
    if (!user) return;
    setWhatsappSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, whatsapp_number: whatsappNumber, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Nomor WhatsApp tersimpan! ✅");
      setWhatsappEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nomor");
    } finally {
      setWhatsappSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full active:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold font-orbitron text-foreground">{t("settings.title")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Profile section */}
        <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
            <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-base font-bold font-orbitron text-foreground">Buddy</p>
            <p className="text-xs text-accent">{user?.email || t("settings.subtitle")}</p>
          </div>
        </div>

        {/* WhatsApp Number */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-green-500" />
            <span className="text-sm font-medium text-foreground">{t("settings.whatsapp")}</span>
          </div>
          {whatsappEditing || !whatsappNumber ? (
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+628xxxxxxxxxx"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="flex-1 bg-background/60 border-border/40 text-foreground text-sm"
              />
              <button
                onClick={saveWhatsappNumber}
                disabled={whatsappSaving || !whatsappNumber.trim()}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all"
              >
                {whatsappSaving ? "..." : t("common.save")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{whatsappNumber}</span>
              <button
                onClick={() => setWhatsappEditing(true)}
                className="text-xs text-accent hover:underline"
              >
                {t("common.edit")}
              </button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">{t("settings.whatsappHint")}</p>
        </div>

        {/* General Settings Group */}
        <div>
          <button
            onClick={() => setShowGeneral(v => !v)}
            className="w-full flex items-center justify-between px-1 mb-1.5"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{t("settings.general")}</p>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${showGeneral ? "rotate-180" : ""}`} />
          </button>
          {showGeneral && <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
            {/* Bahasa */}
            <button
              onClick={handleLanguageTap}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors border-b border-border/20"
            >
              <div className="flex items-center gap-3">
                <Languages size={19} className="text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">{t("settings.language")}</span>
                  {language === "en" && (
                    <p className="text-[10px] text-muted-foreground">
                      Aiyo: {aiLanguage === "en" ? "English" : "Indonesia"}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{language === "id" ? "Indonesia" : "English"}</span>
            </button>

            {/* Tema */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors border-b border-border/20"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon size={19} className="text-primary" /> : <Sun size={19} className="text-primary" />}
                <span className="text-sm font-medium text-foreground">{t("settings.theme")}</span>
              </div>
              <span className="text-xs text-muted-foreground">{theme === "dark" ? t("settings.themeDark") : t("settings.themeLight")}</span>
            </button>

            {/* Suara Aiyo */}
            <button
              onClick={() => setVoiceEnabled((v: boolean) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors border-b border-border/20"
            >
              <div className="flex items-center gap-3">
                {voiceEnabled ? <Volume2 size={19} className="text-primary" /> : <VolumeX size={19} className="text-primary" />}
                <span className="text-sm font-medium text-foreground">{t("settings.voice")}</span>
              </div>
              <span className={`text-xs font-semibold ${voiceEnabled ? "text-accent" : "text-muted-foreground"}`}>{voiceEnabled ? t("common.on") : t("common.off")}</span>
            </button>

            {/* Auto-play Suara */}
            <button
              onClick={() => setAutoPlayVoice((v: boolean) => !v)}
              disabled={!voiceEnabled}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors disabled:opacity-40"
            >
              <div className="flex items-center gap-3">
                {autoPlayVoice ? <Play size={19} className="text-primary" /> : <Pause size={19} className="text-primary" />}
                <span className="text-sm font-medium text-foreground">{t("settings.autoplay")}</span>
              </div>
              <span className={`text-xs font-semibold ${autoPlayVoice ? "text-accent" : "text-muted-foreground"}`}>{autoPlayVoice ? t("common.on") : t("common.off")}</span>
            </button>
          </div>}
        </div>

        {/* Bantuan & Info */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1.5">{t("settings.help")}</p>
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
            <button
              onClick={handleRestartTour}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors border-b border-border/20"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={19} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{t("settings.tutorial")}</span>
              </div>
              <ChevronRight size={15} className="text-muted-foreground/50" />
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info size={19} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{t("settings.about")}</span>
              </div>
              <ChevronRight size={15} className="text-muted-foreground/50" />
            </button>
          </div>
        </div>

        {/* Upgrade Plan */}
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 active:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{t("settings.upgrade")}</span>
          </div>
          <span className="text-xs text-primary font-semibold">{t("settings.upgradeBtn")}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl p-4 active:bg-destructive/20 transition-colors"
        >
          <LogOut size={20} className="text-destructive" />
          <span className="text-sm font-medium text-destructive">{t("settings.logout")}</span>
        </button>
      </div>

      <BottomNav />
      {showAbout && <AboutAiyo onClose={() => setShowAbout(false)} />}

      {/* Language confirmation dialog */}
      {showLangDialog && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm bg-card rounded-3xl border border-border/40 p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-base font-bold font-orbitron text-foreground">{t("settings.langDialog.title")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.langDialog.subtitle")}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => confirmLang(false)}
                className="w-full flex flex-col items-start px-4 py-3.5 rounded-2xl bg-muted/50 border border-border/30 active:bg-muted transition-colors text-left"
              >
                <span className="text-sm font-semibold text-foreground">{t("settings.langDialog.uiOnly")}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{t("settings.langDialog.uiOnlyDesc")}</span>
              </button>
              <button
                onClick={() => confirmLang(true)}
                className="w-full flex flex-col items-start px-4 py-3.5 rounded-2xl bg-primary/10 border border-primary/30 active:bg-primary/20 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-foreground">{t("settings.langDialog.uiAndAi")}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{t("settings.langDialog.uiAndAiDesc")}</span>
              </button>
            </div>
            <button
              onClick={() => setShowLangDialog(false)}
              className="w-full py-2.5 text-xs text-muted-foreground active:text-foreground transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
