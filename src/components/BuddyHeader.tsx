import { Settings } from "lucide-react";

const BuddyHeader = () => {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">B</span>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Buddy</h1>
      </div>
      <button className="p-2 rounded-full hover:bg-muted transition-colors">
        <Settings size={20} className="text-muted-foreground" />
      </button>
    </header>
  );
};

export default BuddyHeader;
