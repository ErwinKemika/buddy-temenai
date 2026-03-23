import { Settings, Moon, Sun, Volume2, VolumeX, Play, Pause, Bell } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  autoPlayVoice: boolean;
  onToggleAutoPlay: () => void;
  activeReminderCount: number;
  onOpenReminders: () => void;
}

const BuddyHeader = ({ voiceEnabled, onToggleVoice, autoPlayVoice, onToggleAutoPlay, activeReminderCount, onOpenReminders }: Props) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-card/40 backdrop-blur-md border-b border-border/30 safe-top">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary text-sm font-bold font-orbitron">B</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight font-orbitron tracking-wide">Buddy</h1>
          <span className="text-[10px] text-accent leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Online • Siap ngobrol
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenReminders}
          className="p-2.5 rounded-full active:bg-muted transition-colors relative"
          aria-label="Pengingat"
        >
          <Bell size={20} className="text-muted-foreground" />
          {activeReminderCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeReminderCount > 9 ? "9+" : activeReminderCount}
            </span>
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2.5 rounded-full active:bg-muted transition-colors" aria-label="Pengaturan">
              <Settings size={22} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleVoice} className="gap-2 cursor-pointer">
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>Suara {voiceEnabled ? "ON" : "OFF"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onToggleAutoPlay}
              disabled={!voiceEnabled}
              className="gap-2 cursor-pointer"
            >
              {autoPlayVoice ? <Pause size={16} /> : <Play size={16} />}
              <span>Auto-play {autoPlayVoice ? "ON" : "OFF"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default BuddyHeader;
