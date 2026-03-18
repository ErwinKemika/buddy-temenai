import { Mic, Send, MessageSquare } from "lucide-react";

const BuddyControlBar = () => {
  return (
    <div className="px-3 pt-2 pb-3 bg-card/90 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center gap-2">
        {/* Past conversations */}
        <button
          className="p-2.5 rounded-full active:bg-muted transition-colors text-muted-foreground shrink-0"
          aria-label="Riwayat percakapan"
        >
          <MessageSquare size={22} />
        </button>

        {/* Mic button */}
        <button
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center buddy-glow animate-mic-pulse shrink-0 active:scale-95 transition-transform"
          aria-label="Bicara dengan Buddy"
        >
          <Mic size={22} className="text-primary-foreground" />
        </button>

        {/* Text input */}
        <div className="flex-1 flex items-center gap-1.5 bg-muted rounded-full px-3.5 py-2.5 min-w-0">
          <input
            type="text"
            placeholder="Atau ketik di sini..."
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            enterKeyHint="send"
          />
          <button
            className="text-primary active:text-primary/70 transition-colors shrink-0 p-1"
            aria-label="Kirim pesan"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuddyControlBar;