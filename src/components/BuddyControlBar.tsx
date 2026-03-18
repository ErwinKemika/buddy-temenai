import { Mic, Send, MessageSquare } from "lucide-react";

const BuddyControlBar = () => {
  return (
    <div className="px-4 py-3 bg-card/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center gap-3">
        {/* Past conversations */}
        <button className="p-2.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <MessageSquare size={20} />
        </button>

        {/* Mic button */}
        <button className="w-14 h-14 rounded-full bg-primary flex items-center justify-center buddy-glow animate-mic-pulse shrink-0">
          <Mic size={24} className="text-primary-foreground" />
        </button>

        {/* Text input */}
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-2.5">
          <input
            type="text"
            placeholder="Atau ketik di sini..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button className="text-primary hover:text-primary/80 transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuddyControlBar;
