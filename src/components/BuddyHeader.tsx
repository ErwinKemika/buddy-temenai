import { Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BuddyHeader = () => {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2.5 rounded-full active:bg-muted transition-colors" aria-label="Pengaturan">
            <Settings size={22} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer">
            {theme === "dark" ? (
              <>
                <Sun size={16} />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon size={16} />
                <span>Mode Gelap</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default BuddyHeader;
