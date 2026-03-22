import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { BuddyState } from "@/hooks/useChat";

interface Props {
  onSendMessage: (text: string) => void;
  buddyState: BuddyState;
  liveTranscript: string;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

const BuddyControlBar = ({
  onSendMessage, buddyState, liveTranscript,
  voiceEnabled, onToggleVoice, onStartListening, onStopListening,
}: Props) => {
  const [input, setInput] = useState("");

  const isListening = buddyState === "listening";
  const isBusy = buddyState === "thinking" || buddyState === "speaking";

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    onSendMessage(text);
    setInput("");
  };

  const handleMicPress = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="px-3 pt-2 pb-3 bg-card/40 backdrop-blur-md border-t border-border/30 safe-bottom">
      {/* Live transcript preview */}
      {isListening && liveTranscript && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-foreground/80 italic">
          🎤 "{liveTranscript}"
        </div>
      )}
      {isListening && !liveTranscript && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-muted-foreground italic animate-pulse">
          🎤 Mendengarkan... bicara sekarang!
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleVoice}
          className={`p-2.5 rounded-full active:bg-muted transition-colors shrink-0 ${voiceEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          aria-label={voiceEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {voiceEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>

        <button
          onClick={handleMicPress}
          disabled={isBusy}
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all ${
            isListening
              ? "bg-destructive buddy-glow animate-pulse"
              : "bg-primary buddy-glow animate-mic-pulse"
          } disabled:opacity-50`}
          aria-label={isListening ? "Berhenti mendengarkan" : "Bicara dengan Buddy"}
        >
          {isListening
            ? <MicOff size={22} className="text-primary-foreground" />
            : <Mic size={22} className="text-primary-foreground" />
          }
        </button>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex-1 flex items-center gap-1.5 bg-muted/50 border border-border/30 rounded-full px-3.5 py-2.5 min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBusy ? "Buddy sedang merespons..." : "Atau ketik di sini..."}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            enterKeyHint="send"
            disabled={isBusy || isListening}
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy || isListening}
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
