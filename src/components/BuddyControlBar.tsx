import { Send, Volume2, VolumeX, Plus, Mic } from "lucide-react";
import { useState } from "react";
import { BuddyState } from "@/hooks/useChat";
import AttachmentMenu from "./AttachmentMenu";
import VoiceRecorder from "./VoiceRecorder";

interface Props {
  onSendMessage: (text: string, attachment?: { file: File | Blob; type: "image" | "document" | "voice" }) => void;
  buddyState: BuddyState;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

const BuddyControlBar = ({
  onSendMessage, buddyState,
  voiceEnabled, onToggleVoice,
}: Props) => {
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const isBusy = buddyState === "thinking" || buddyState === "speaking";

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    onSendMessage(text);
    setInput("");
  };

  const handleFileAttach = (file: File, type: "image" | "document") => {
    onSendMessage("", { file, type });
  };

  const handleVoiceSend = (blob: Blob) => {
    setRecording(false);
    onSendMessage("", { file: blob, type: "voice" });
  };

  if (recording) {
    return <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setRecording(false)} />;
  }

  return (
    <div className="px-3 pt-2 pb-3 bg-card/40 backdrop-blur-md border-t border-border/30 safe-bottom relative">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleVoice}
          className={`p-2 rounded-full active:bg-muted transition-colors shrink-0 ${voiceEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          aria-label={voiceEnabled ? "Matikan suara" : "Nyalakan suara"}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={isBusy}
            className="p-2 rounded-full text-primary active:bg-muted transition-colors shrink-0 disabled:opacity-30"
            aria-label="Lampiran"
          >
            <Plus size={20} />
          </button>
          <AttachmentMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onImageSelect={(f) => handleFileAttach(f, "image")}
            onDocumentSelect={(f) => handleFileAttach(f, "document")}
            onCameraCapture={(f) => handleFileAttach(f, "image")}
          />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex-1 flex items-center gap-1.5 bg-muted/50 border border-border/30 rounded-full px-3 py-2 min-w-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBusy ? "Buddy merespons..." : "Ketik pesan..."}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            enterKeyHint="send"
            disabled={isBusy}
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="text-primary active:text-primary/70 transition-colors shrink-0 p-1 disabled:opacity-30"
            aria-label="Kirim pesan"
          >
            <Send size={18} />
          </button>
        </form>

        <button
          onClick={() => setRecording(true)}
          disabled={isBusy}
          className="p-2 rounded-full text-destructive active:bg-destructive/20 transition-colors shrink-0 disabled:opacity-30"
          aria-label="Voice note"
        >
          <Mic size={20} />
        </button>
      </div>
    </div>
  );
};

export default BuddyControlBar;
