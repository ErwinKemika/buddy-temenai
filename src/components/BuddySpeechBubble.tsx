import ReactMarkdown from "react-markdown";
import { Message } from "@/hooks/useChat";
import { useRef, useEffect } from "react";

interface Props {
  messages: Message[];
  isLoading: boolean;
}

const BuddySpeechBubble = ({ messages, isLoading }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const lastMessages = messages.slice(-6);

  if (lastMessages.length === 0 && !isLoading) {
    return (
      <div className="px-6 pb-2">
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3 max-w-[85%] mx-auto">
          <p className="text-sm text-muted-foreground text-center">
            Ketuk mic atau ketik pesan untuk mulai ngobrol dengan Buddy! 🚀
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
            <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
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
