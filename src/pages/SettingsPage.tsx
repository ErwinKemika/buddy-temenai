import { Moon, Sun, Volume2, VolumeX, Play, Pause, ArrowLeft, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import buddyAvatar from "@/assets/buddy-avatar.png";
import { useAuth } from "@/hooks/useAuth";

const SettingsPage = () => {
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

  useEffect(() => {
    localStorage.setItem("buddy-voice-enabled", JSON.stringify(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("buddy-autoplay-voice", JSON.stringify(autoPlayVoice));
  }, [autoPlayVoice]);

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
            <p className="text-xs text-accent">Asisten Produktivitasmu</p>
          </div>
        </div>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 active:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
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
            {voiceEnabled ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} className="text-primary" />}
            <span className="text-sm font-medium text-foreground">Suara Buddy</span>
          </div>
          <span className={`text-xs font-semibold ${voiceEnabled ? "text-accent" : "text-muted-foreground"}`}>{voiceEnabled ? "ON" : "OFF"}</span>
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
          <span className={`text-xs font-semibold ${autoPlayVoice ? "text-accent" : "text-muted-foreground"}`}>{autoPlayVoice ? "ON" : "OFF"}</span>
        </button>

        {/* User info */}
        {user && (
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Login sebagai</p>
            <p className="text-sm text-foreground font-medium truncate">{user.email}</p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); navigate("/auth"); }}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive py-3 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-all"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
