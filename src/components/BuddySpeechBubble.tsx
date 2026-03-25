import ReactMarkdown from "react-markdown";
import { Message, BuddyState } from "@/hooks/useChat";
import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";

interface Props {
  messages: Message[];
  buddyState: BuddyState;
}

const BuddySpeechBubble = ({ messages, buddyState }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = buddyState === "thinking";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start pt-6 px-6">
        {/* Comic speech bubble above Buddy */}
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl px-5 py-4 max-w-[85%] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <p className="text-sm text-muted-foreground text-center">
            Ketik pesan atau kirim gambar untuk mulai ngobrol dengan Buddy! 🚀
          </p>
          {/* Speech bubble tail pointing down */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-card/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col px-3 py-2">
      {/* Glass panel */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-card/50 backdrop-blur-xl border border-border/20 shadow-lg shadow-black/20 px-3 py-3 flex flex-col gap-2"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-background/60 backdrop-blur-sm border border-primary/20 text-foreground rounded-2xl rounded-tl-sm"
                  : "bg-primary/20 border border-primary/30 text-foreground rounded-2xl rounded-tr-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="block text-[11px] font-semibold text-accent mb-0.5 font-orbitron">Buddy</span>
              )}

              {msg.attachment?.type === "image" && (
                <img
                  src={msg.attachment.url}
                  alt="Attachment"
                  className="rounded-lg max-h-48 w-auto mb-1.5 cursor-pointer"
                  onClick={() => window.open(msg.attachment!.url, "_blank")}
                />
              )}

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

              {msg.content && msg.content !== "[Gambar]" && msg.content !== "[Dokumen]" && (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-background/60 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-tl-sm px-4 py-3">
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
    </div>
  );
};

export default BuddySpeechBubble;
