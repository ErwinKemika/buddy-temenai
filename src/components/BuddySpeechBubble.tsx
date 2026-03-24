import ReactMarkdown from "react-markdown";
import { Message, BuddyState } from "@/hooks/useChat";
import { useRef, useEffect, useState } from "react";
import { FileText, Pin, Reply, X } from "lucide-react";

interface Props {
  messages: Message[];
  buddyState: BuddyState;
  onTogglePin?: (msgId: string) => void;
  onReply?: (msg: Message) => void;
}

const BuddySpeechBubble = ({ messages, buddyState, onTogglePin, onReply }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = buddyState === "thinking";
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const pinnedMessages = messages.filter(m => m.pinned);
  const lastMessages = messages.slice(-20);

  const handleLongPressStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveMenu(msgId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (lastMessages.length === 0 && !isLoading) {
    return (
      <div className="px-6 pb-2">
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3 max-w-[85%] mx-auto">
          <p className="text-sm text-muted-foreground text-center">
            Ketik pesan atau kirim gambar untuk mulai ngobrol dengan Buddy! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="px-4 pb-2 overflow-y-auto max-h-[35vh] flex flex-col gap-2">
      {/* Pinned messages section */}
      {pinnedMessages.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mb-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Pin size={12} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary font-orbitron uppercase tracking-wider">
              Pesan Disematkan ({pinnedMessages.length})
            </span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[80px] overflow-y-auto">
            {pinnedMessages.map(msg => (
              <div
                key={`pin-${msg.id}`}
                className="flex items-start gap-2 group"
              >
                <div className="flex-1 text-[12px] text-foreground/80 line-clamp-2">
                  <span className="font-semibold text-accent text-[10px]">
                    {msg.role === "assistant" ? "Buddy" : "Kamu"}:{" "}
                  </span>
                  {msg.content.slice(0, 100)}{msg.content.length > 100 ? "..." : ""}
                </div>
                <button
                  onClick={() => onTogglePin?.(msg.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastMessages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} relative`}>
          <div
            className="max-w-[85%] relative group"
            onTouchStart={() => handleLongPressStart(msg.id)}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onContextMenu={(e) => { e.preventDefault(); setActiveMenu(msg.id); }}
          >
            {/* Reply reference */}
            {msg.replyTo && (
              <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-primary/50 bg-primary/5 text-[11px] text-muted-foreground ${
                msg.role === "user" ? "ml-auto" : ""
              }`}>
                <span className="font-semibold text-primary/70 text-[10px]">
                  {msg.replyTo.role === "assistant" ? "Buddy" : "Kamu"}
                </span>
                <p className="line-clamp-1 mt-0.5">{msg.replyTo.content.slice(0, 80)}</p>
              </div>
            )}

            <div
              className={`px-3.5 py-2.5 text-[14px] leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-card/70 backdrop-blur-sm border border-primary/20 text-foreground rounded-2xl rounded-tl-sm"
                  : "bg-primary/20 border border-primary/30 text-foreground rounded-2xl rounded-tr-sm"
              } ${msg.pinned ? "ring-1 ring-primary/40" : ""}`}
            >
              {msg.role === "assistant" && (
                <span className="block text-[11px] font-semibold text-accent mb-0.5 font-orbitron">Buddy</span>
              )}

              {msg.pinned && (
                <Pin size={10} className="text-primary inline-block mr-1 -mt-0.5" />
              )}

              {/* Image attachment */}
              {msg.attachment?.type === "image" && (
                <img
                  src={msg.attachment.url}
                  alt="Attachment"
                  className="rounded-lg max-h-48 w-auto mb-1.5 cursor-pointer"
                  onClick={() => window.open(msg.attachment!.url, "_blank")}
                />
              )}

              {/* Document attachment */}
              {msg.attachment?.type === "document" && (
                <a
                  href={msg.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 mb-1.5 hover:bg-muted/50 transition-colors"
                >
                  <FileText size={18} className="text-primary shrink-0" />
                  <span className="text-xs truncate">{msg.attachment.name}</span>
                </a>
              )}

              {/* Text content */}
              {msg.content && msg.content !== "[Gambar]" && msg.content !== "[Dokumen]" && (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Context menu (long press / right click) */}
            {activeMenu === msg.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                <div className={`absolute z-50 ${msg.role === "user" ? "right-0" : "left-0"} top-full mt-1 bg-card border border-border/50 rounded-xl shadow-lg shadow-black/30 overflow-hidden min-w-[140px]`}>
                  <button
                    onClick={() => { onTogglePin?.(msg.id); setActiveMenu(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Pin size={14} className={msg.pinned ? "text-primary" : "text-muted-foreground"} />
                    {msg.pinned ? "Lepas Pin" : "Sematkan"}
                  </button>
                  <button
                    onClick={() => { onReply?.(msg); setActiveMenu(null); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Reply size={14} className="text-muted-foreground" />
                    Balas
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="bg-card/70 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-tl-sm px-4 py-3">
            <span className="text-[11px] font-semibold text-accent mb-1 block font-orbitron">Buddy</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.15s" }} />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuddySpeechBubble;
