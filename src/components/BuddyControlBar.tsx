import { Send, Volume2, VolumeX, Plus, Mic, X, FileText } from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";
import { BuddyState } from "@/hooks/useChat";
import AttachmentMenu from "./AttachmentMenu";
import VoiceRecorder from "./VoiceRecorder";

interface PendingAttachment {
  file: File;
  type: "image" | "document";
  previewUrl?: string;
}

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
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = buddyState === "thinking" || buddyState === "speaking";

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const clearAttachment = useCallback(() => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
  }, [pendingAttachment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl);
      }
    };
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !pendingAttachment) || isBusy) return;
    if (pendingAttachment) {
      onSendMessage(text, { file: pendingAttachment.file, type: pendingAttachment.type });
    } else {
      onSendMessage(text);
    }
    setInput("");
    clearAttachment();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = (file: File, type: "image" | "document") => {
    // Revoke old preview if any
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    const previewUrl = type === "image" ? URL.createObjectURL(file) : undefined;
    setPendingAttachment({ file, type, previewUrl });
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
          className="flex-1 flex flex-col gap-1.5 bg-muted/50 border border-border/30 rounded-2xl px-3 py-2 min-w-0"
        >
          {/* Pending attachment preview */}
          {pendingAttachment && (
            <div className="flex items-center gap-2">
              {pendingAttachment.type === "image" && pendingAttachment.previewUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={pendingAttachment.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5 text-xs text-foreground max-w-[200px]">
                  <FileText size={14} className="text-primary shrink-0" />
                  <span className="truncate">{pendingAttachment.file.name}</span>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-1.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={isBusy ? "Buddy merespons..." : "Ketik pesan..."}
              className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none min-w-0 resize-none max-h-[120px] leading-snug py-0.5"
              disabled={isBusy}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !pendingAttachment) || isBusy}
              className="text-primary active:text-primary/70 transition-colors shrink-0 p-1 disabled:opacity-30 mb-0.5"
              aria-label="Kirim pesan"
            >
              <Send size={18} />
            </button>
          </div>
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