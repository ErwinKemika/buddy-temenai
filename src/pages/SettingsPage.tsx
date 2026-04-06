import { Moon, Sun, Volume2, VolumeX, Play, Pause, ArrowLeft, LogOut, Phone, Crown, Zap } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import LockedFeature from "@/components/LockedFeature";
import { useSubscription } from "@/hooks/useSubscription";
import buddyAvatar from "@/assets/buddy-avatar.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isPro, isMax, isTrial } = useSubscription();
  const hasProAccess = isPro || isMax || isTrial;
  const hasMaxAccess = isMax || isTrial;
  const navigate = useNavigate();
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("buddy-voice-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => {
    const saved = localStorage.getItem("buddy-autoplay-voice");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappEditing, setWhatsappEditing] = useState(false);
  const [llmBooster, setLlmBooster] = useState(false);
  const [showBoosterDialog, setShowBoosterDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem("buddy-voice-enabled", JSON.stringify(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("buddy-autoplay-voice", JSON.stringify(autoPlayVoice));
  }, [autoPlayVoice]);

  // Load WhatsApp number + llm_booster from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("whatsapp_number, llm_booster")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
        }
        if ((data as any)?.llm_booster === true) {
          setLlmBooster(true);
        }
      });
  }, [user]);

  const saveWhatsappNumber = async () => {
    if (!user) return;
    setWhatsappSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, whatsapp_number: whatsappNumber, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      toast.success("Nomor WhatsApp tersimpan! ✅");
      setWhatsappEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nomor");
    } finally {
      setWhatsappSaving(false);
    }
  };

  const handleBoosterToggle = async () => {
    if (!user) return;
    if (!llmBooster) {
      // Trying to enable → show confirmation dialog instead of saving
      setShowBoosterDialog(true);
    } else {
      // Disabling → save immediately
      try {
        await supabase
          .from("profiles")
          .update({ llm_booster: false, updated_at: new Date().toISOString() } as any)
          .eq("user_id", user.id);
        setLlmBooster(false);
        toast.success("LLM Booster dinonaktifkan");
      } catch {
        toast.error("Gagal menyimpan pengaturan");
      }
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
        <h1 className="text-lg font-bold font-orbitron text-foreground">Pengaturan</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Profile section */}
        <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
            <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-base font-bold font-orbitron text-foreground">Buddy</p>
            <p className="text-xs text-accent">{user?.email || "Asisten Produktivitasmu"}</p>
          </div>
        </div>

        {/* WhatsApp Number */}
        {hasMaxAccess ? (
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-green-500" />
              <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
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
                  {whatsappSaving ? "..." : "Simpan"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{whatsappNumber}</span>
                <button onClick={() => setWhatsappEditing(true)} className="text-xs text-accent hover:underline">
                  Ubah
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">Buddy akan mengirim reminder ke nomor ini via WhatsApp</p>
          </div>
        ) : (
          <LockedFeature featureName="WhatsApp Reminder" requiredPlan="max" variant="inline" />
        )}

        {/* LLM Booster — only for Pro and Max */}
        {hasProAccess && (
          <button
            onClick={handleBoosterToggle}
            className="w-full flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium text-foreground block">LLM Booster — Claude Sonnet 4.6</span>
                <span className="text-[10px] text-muted-foreground">Aktifkan untuk jawaban lebih cerdas dengan Claude AI (+Rp 49.000/bln)</span>
              </div>
            </div>
            <span className={`text-xs font-semibold ${llmBooster ? "text-accent" : "text-muted-foreground"}`}>
              {llmBooster ? "ON" : "OFF"}
            </span>
          </button>
        )}

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 active:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon size={20} className="text-primary" />
            ) : (
              <Sun size={20} className="text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">Tema</span>
          </div>
          <span className="text-xs text-muted-foreground">{theme === "dark" ? "Gelap" : "Terang"}</span>
        </button>

        {/* Voice */}
        <button
          onClick={() => setVoiceEnabled((v: boolean) => !v)}
          className="w-full flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 active:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            {voiceEnabled ? (
              <Volume2 size={20} className="text-primary" />
            ) : (
              <VolumeX size={20} className="text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">Suara Buddy</span>
          </div>
          <span className={`text-xs font-semibold ${voiceEnabled ? "text-accent" : "text-muted-foreground"}`}>
            {voiceEnabled ? "ON" : "OFF"}
          </span>
        </button>

        {/* Auto-play */}
        <button
          onClick={() => setAutoPlayVoice((v: boolean) => !v)}
          disabled={!voiceEnabled}
          className="w-full flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 active:bg-muted transition-colors disabled:opacity-40"
        >
          <div className="flex items-center gap-3">
            {autoPlayVoice ? <Play size={20} className="text-primary" /> : <Pause size={20} className="text-primary" />}
            <span className="text-sm font-medium text-foreground">Auto-play Suara</span>
          </div>
          <span className={`text-xs font-semibold ${autoPlayVoice ? "text-accent" : "text-muted-foreground"}`}>
            {autoPlayVoice ? "ON" : "OFF"}
          </span>
        </button>

        {/* Upgrade Plan */}
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl p-4 active:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Upgrade Plan</span>
          </div>
          <span className="text-xs text-primary font-semibold">Lihat Plan →</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl p-4 active:bg-destructive/20 transition-colors"
        >
          <LogOut size={20} className="text-destructive" />
          <span className="text-sm font-medium text-destructive">Keluar</span>
        </button>
      </div>

      {/* Booster confirmation dialog */}
      <AlertDialog open={showBoosterDialog} onOpenChange={setShowBoosterDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivasi LLM Booster</AlertDialogTitle>
            <AlertDialogDescription>
              Fitur ini akan ditagihkan terpisah. Hubungi support untuk aktivasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowBoosterDialog(false)}>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
