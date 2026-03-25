import buddyAvatar from "@/assets/buddy-avatar.png";
import { Trash2 } from "lucide-react";

interface Props {
  onClearChat?: () => void;
  hasMessages?: boolean;
}

const BuddyHeader = ({ onClearChat, hasMessages }: Props) => {
  return (
    <header className="flex items-center justify-between px-3 pt-2 pb-1.5 bg-card/40 backdrop-blur-md border-b border-border/30">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
          <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight font-orbitron tracking-wide">Buddy</h1>
          <span className="text-[9px] text-accent leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Online • Siap ngobrol
          </span>
        </div>
      </div>
      {hasMessages && onClearChat && (
        <button
          onClick={onClearChat}
          className="p-2 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          title="Hapus histori chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </header>
  );
};

export default BuddyHeader;
