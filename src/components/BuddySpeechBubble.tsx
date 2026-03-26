import ReactMarkdown from "react-markdown";
import { Message, BuddyState } from "@/hooks/useChat";
import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";

interface Props {
  messages: Message[];
  buddyState: BuddyState;
}

type BuddyEmotion = "normal" | "sad" | "happy" | "angry";

const SAD_KEYWORDS = [
  "sedih", "galau", "nangis", "menangis", "kecewa", "patah hati", "putus",
  "kesepian", "lonely", "depresi", "stress", "stres", "tertekan", "gagal",
  "menderita", "sakit hati", "terpuruk", "hopeless", "putus asa", "menyesal",
  "takut", "cemas", "gelisah", "khawatir", "anxious", "panik", "bingung",
  "lelah", "capek", "cape", "burnout", "overwhelm", "susah", "sulit",
  "masalah", "problem", "curhat", "down", "bad mood", "bete", "kesel",
  "frustrasi", "frustrated", "helpless", "sendirian", "ditinggal",
  "😢", "😭", "😞", "😔", "😟", "😥", "💔", "😰", "😩", "😫", "🥺"
];

const HAPPY_KEYWORDS = [
  "senang", "seneng", "bahagia", "happy", "gembira", "excited", "yeay", "yey",
  "hore", "horee", "berhasil", "sukses", "menang", "juara", "lulus", "diterima",
  "dapat", "rejeki", "untung", "beruntung", "lucky", "amazing", "hebat", "keren",
  "mantap", "mantab", "asik", "asyik", "seru", "bagus", "best", "terbaik",
  "bangga", "proud", "grateful", "bersyukur", "syukur", "alhamdulillah",
  "semangat", "termotivasi", "inspired", "produktif", "achievement",
  "🎉", "🥳", "😄", "😊", "🎊", "🏆", "💪", "✨", "🔥", "❤️", "😍", "🥰", "👏"
];

const ANGRY_KEYWORDS = [
  "malas", "males", "mager", "nunda", "menunda", "procrastinate", "ogah",
  "gak mau", "ga mau", "nggak mau", "enggan", "skip", "bolos", "cabut",
  "bodo amat", "bodo amah", "masa bodoh", "cuek", "acuh", "abai",
  "males banget", "ngantuk", "tidur aja", "rebahan", "gabut",
  "nyerah", "menyerah", "give up", "nanti aja", "ntar aja", "besok aja",
  "gak semangat", "ga semangat", "loyo", "lemes", "lesu", "unmotivated",
  "😴", "🥱", "😒", "😑", "🙄", "💤", "😤", "👎"
];

function detectEmotion(content: string): BuddyEmotion {
  const lower = content.toLowerCase();
  if (SAD_KEYWORDS.some(k => lower.includes(k))) return "sad";
  if (HAPPY_KEYWORDS.some(k => lower.includes(k))) return "happy";
  if (ANGRY_KEYWORDS.some(k => lower.includes(k))) return "angry";
  return "normal";
}

/** Find the user message right before this assistant message */
function getEmotionForAssistantMsg(messages: Message[], index: number): BuddyEmotion {
  // Look backwards for the preceding user message
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return detectEmotion(messages[i].content);
    }
  }
  return "normal";
}

/** Mini animated Buddy head avatar for chat bubbles */
const BuddyMiniHead = ({ buddyState, emotion }: { buddyState: BuddyState; emotion: BuddyEmotion }) => {
  const isSpeaking = buddyState === "speaking";
  const isThinking = buddyState === "thinking";
  const isSad = emotion === "sad";
  const isHappy = emotion === "happy";
  const isAngry = emotion === "angry";

  const eyeColor = isSad
    ? "bg-gradient-to-b from-yellow-400 to-yellow-500"
    : isHappy
      ? "bg-gradient-to-b from-green-400 to-green-500"
      : isAngry
        ? "bg-gradient-to-b from-red-400 to-red-500"
        : isSpeaking
          ? "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-talk"
          : "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-blink";

  const antennaColor = isSad ? 'bg-yellow-400/70'
    : isHappy ? 'bg-green-400/70 animate-pulse'
    : isAngry ? 'bg-red-400/70'
    : isSpeaking ? 'bg-accent animate-pulse'
    : 'bg-accent/70 animate-antenna';

  return (
    <div className="relative shrink-0 self-end mb-1">
      {/* Antenna */}
      <div className="flex flex-col items-center">
        <div className={`w-[5px] h-[5px] rounded-full ${antennaColor}`} />
        <div className="w-[2px] h-[3px] bg-accent/40" />
      </div>
      {/* Head */}
      <div className={`w-8 h-7 rounded-[0.6rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/20 relative overflow-visible ${
        isThinking ? 'animate-head-tilt' : 'animate-float'
      }`}>
        {/* Top shine */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[0.6rem] bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20" />

        {/* Angry eyebrows */}
        {isAngry && (
          <div className="absolute top-[4px] inset-x-0 flex items-center justify-center gap-[6px] z-10">
            <div className="w-[7px] h-[2px] bg-red-400/80 rounded-full -rotate-12" />
            <div className="w-[7px] h-[2px] bg-red-400/80 rounded-full rotate-12" />
          </div>
        )}

        {/* Eyes */}
        <div className="absolute inset-0 flex items-center justify-center gap-[6px] pt-[2px]">
          {/* Left eye */}
          <div className="relative">
            {isSad ? (
              /* Sad squint eye - like ╥_╥ */
              <div className="w-[7px] h-[4px] border-t-[2px] border-yellow-400 rounded-t-full mt-[2px]" />
            ) : (
              <div className={`w-[7px] h-[7px] rounded-full ${eyeColor}`}>
                <div className="w-[3px] h-[3px] rounded-full bg-primary-foreground/80 mx-auto mt-[2px]" />
              </div>
            )}
            {isSad && (
              <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[3px] h-[4px] rounded-b-full bg-yellow-300/80 animate-tear-drop" />
            )}
          </div>
          {/* Right eye */}
          <div className="relative">
            {isSad ? (
              <div className="w-[7px] h-[4px] border-t-[2px] border-yellow-400 rounded-t-full mt-[2px]" />
            ) : (
              <div className={`w-[7px] h-[7px] rounded-full ${eyeColor}`} style={{ animationDelay: '0.05s' }}>
                <div className="w-[3px] h-[3px] rounded-full bg-primary-foreground/80 mx-auto mt-[2px]" />
              </div>
            )}
            {isSad && (
              <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[3px] h-[4px] rounded-b-full bg-yellow-300/80 animate-tear-drop" style={{ animationDelay: '0.4s' }} />
            )}
          </div>
        </div>

        {/* Mouth */}
        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2">
          {isSad ? (
            /* Sad frown -( using top half of circle */
            <div className="w-[8px] h-[5px] overflow-hidden">
              <div className="w-[8px] h-[8px] rounded-full border-[2px] border-yellow-400/60 mt-[3px]" />
            </div>
          ) : isHappy ? (
            /* Happy smile :-) using bottom half of circle */
            <div className="w-[8px] h-[5px] overflow-hidden">
              <div className="w-[8px] h-[8px] rounded-full border-[2px] border-green-400/80 -mt-[3px]" />
            </div>
          ) : isAngry ? (
            <div className="w-[6px] h-[2px] bg-red-400/60 rounded-full" />
          ) : isSpeaking ? (
            <div className="flex items-end gap-[1px] h-[4px]">
              {[0, 1, 2].map((j) => (
                <div key={j} className="w-[2px] bg-accent rounded-full animate-waveform" style={{ animationDelay: `${j * 0.12}s` }} />
              ))}
            </div>
          ) : (
            <div className="w-[6px] h-[2px] rounded-full bg-muted-foreground/20" />
          )}
        </div>

        {/* Ears */}
        <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-[3px] h-[6px] rounded-l-full bg-primary/30" />
        <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[3px] h-[6px] rounded-r-full bg-primary/30" />
      </div>
    </div>
  );
};

const BuddySpeechBubble = ({ messages, buddyState }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = buddyState === "thinking";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Detect emotion from latest user message (for loading state)
  const latestUserEmotion: BuddyEmotion = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return detectEmotion(messages[i].content);
    }
    return "normal";
  })();

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start pt-6 px-6">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl px-5 py-4 max-w-[85%] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <p className="text-sm text-muted-foreground text-center">
            Ketik pesan atau kirim gambar untuk mulai ngobrol dengan Buddy! 🚀
          </p>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-card/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col px-3 py-2">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-card/20 backdrop-blur-sm border border-border/10 shadow-lg shadow-black/10 px-3 py-3 flex flex-col gap-3"
      >
        {messages.map((msg, i) => {
          const emotion = msg.role === "assistant" ? getEmotionForAssistantMsg(messages, i) : "normal";

          return (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2">
                  <BuddyMiniHead buddyState={buddyState} emotion={emotion} />
                </div>
              )}
              <div
                className={`max-w-[80%] min-w-0 overflow-hidden px-3.5 py-2.5 text-[14px] leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-background/60 backdrop-blur-sm border border-primary/20 text-foreground rounded-2xl rounded-bl-sm"
                    : "bg-primary/20 border border-primary/30 text-foreground rounded-2xl rounded-tr-sm"
                }`}
              >
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
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-1 [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-1 [&_pre]:mb-2 [&_code]:text-accent">
                    {msg.source === "voice" && <span className="text-[10px] mr-1">🎙️</span>}
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start items-end gap-2">
            <BuddyMiniHead buddyState={buddyState} emotion={latestUserEmotion} />
            <div className="bg-background/60 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3">
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
