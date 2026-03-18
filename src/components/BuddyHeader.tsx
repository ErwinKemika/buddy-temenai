import { Settings } from "lucide-react";

const BuddyHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-card/80 backdrop-blur-md border-b border-border safe-top">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">B</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Buddy</h1>
          <span className="text-[10px] text-muted-foreground leading-none">Online • Siap ngobrol</span>
        </div>
      </div>
      <button className="p-2.5 rounded-full active:bg-muted transition-colors" aria-label="Pengaturan">
        <Settings size={22} className="text-muted-foreground" />
      </button>
    </header>
  );
};

export default BuddyHeader;