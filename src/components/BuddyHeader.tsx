import { Settings } from "lucide-react";

const BuddyHeader = () => {
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
      <button className="p-2.5 rounded-full active:bg-muted transition-colors" aria-label="Pengaturan">
        <Settings size={22} className="text-muted-foreground" />
      </button>
    </header>
  );
};

export default BuddyHeader;
