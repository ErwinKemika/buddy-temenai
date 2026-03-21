import { Mic, Send, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface Props {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

const BuddyControlBar = ({ onSendMessage, isLoading, voiceEnabled, onToggleVoice }: Props) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSendMessage(text);
    setInput("");
  };

  return (
    <div className="px-3 pt-2 pb-3 bg-card/40 backdrop-blur-md border-t border-border/30 safe-bottom">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleVoice}
          className={`p-2.5 rounded-full active:bg-muted transition-colors shrink-0 ${voiceEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          aria-label={voiceEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {voiceEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>

        <button
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center buddy-glow animate-mic-pulse shrink-0 active:scale-95 transition-transform"
          aria-label="Bicara dengan Buddy"
        >
          <Mic size={22} className="text-primary-foreground" />
        </button>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex-1 flex items-center gap-1.5 bg-muted/50 border border-border/30 rounded-full px-3.5 py-2.5 min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Atau ketik di sini..."
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            enterKeyHint="send"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="text-primary active:text-primary/70 transition-colors shrink-0 p-1 disabled:opacity-30"
            aria-label="Kirim pesan"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuddyControlBar;
