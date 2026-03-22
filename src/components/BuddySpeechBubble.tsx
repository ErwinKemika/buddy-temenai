import ReactMarkdown from "react-markdown";
import { Message, BuddyState } from "@/hooks/useChat";
import { useRef, useEffect, useState } from "react";
import { FileText, Play, Pause } from "lucide-react";

interface Props {
  messages: Message[];
  buddyState: BuddyState;
}

const VoiceNotePlayer = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <button onClick={toggle} className="flex items-center gap-2 py-1">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full bg-primary/60 ${playing ? "animate-pulse" : ""}`}
            style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </button>
  );
};

const BuddySpeechBubble = ({ messages, buddyState }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = buddyState === "thinking";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const lastMessages = messages.slice(-10);

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
      {lastMessages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed ${
              msg.role === "assistant"
                ? "bg-card/70 backdrop-blur-sm border border-primary/20 text-foreground rounded-2xl rounded-tl-sm"
                : "bg-primary/20 border border-primary/30 text-foreground rounded-2xl rounded-tr-sm"
            }`}
          >
            {msg.role === "assistant" && (
              <span className="block text-[11px] font-semibold text-accent mb-0.5 font-orbitron">Buddy</span>
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

            {/* Voice note */}
            {msg.attachment?.type === "voice" && (
              <VoiceNotePlayer url={msg.attachment.url} />
            )}

            {/* Text content */}
            {msg.content && msg.content !== "[Gambar]" && msg.content !== "[Voice Note]" && msg.content !== "[Dokumen]" && (
              <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
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
