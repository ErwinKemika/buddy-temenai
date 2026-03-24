import ReactMarkdown from "react-markdown";
import { Message, BuddyState } from "@/hooks/useChat";
import { useRef, useEffect, useState } from "react";
import { FileText, Pin, Search, X, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import buddyAvatar from "@/assets/buddy-avatar.png";

interface Props {
  messages: Message[];
  buddyState: BuddyState;
  onTogglePin?: (msgId: string) => void;
}

const BuddySpeechBubble = ({ messages, buddyState, onTogglePin }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = buddyState === "thinking";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinned, setShowPinned] = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!searchOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, searchOpen]);

  const pinnedMessages = messages.filter(m => m.pinned);
  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const displayMessages = showPinned ? pinnedMessages : filteredMessages;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try { return format(new Date(dateStr), "HH:mm"); } catch { return ""; }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try { return format(new Date(dateStr), "dd MMM yyyy"); } catch { return ""; }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";
  for (const msg of displayMessages) {
    const d = formatDate(msg.created_at);
    if (d !== currentDate) {
      currentDate = d;
      groupedMessages.push({ date: d, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1]?.messages.push(msg);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search & Pin bar */}
      <div className="px-3 py-1.5 flex items-center gap-2">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/30 rounded-full px-3 py-1.5">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground text-[10px] active:bg-muted transition-colors"
            >
              <Search size={12} />
              Cari
            </button>
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinned(!showPinned)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] active:bg-muted transition-colors ${
                  showPinned ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <Pin size={12} />
                {pinnedMessages.length} Pinned
              </button>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-1 overscroll-contain">
        {displayMessages.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3 max-w-[85%]">
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery ? "Tidak ada pesan ditemukan 🔍" : showPinned ? "Belum ada pesan yang di-pin 📌" : "Ketik pesan untuk mulai ngobrol dengan Buddy! 🚀"}
              </p>
            </div>
          </div>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            {/* Date separator */}
            {group.date && (
              <div className="flex justify-center my-2">
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-0.5 rounded-full">{group.date}</span>
              </div>
            )}
            {group.messages.map((msg, i) => {
              const isBuddy = msg.role === "assistant";
              const time = formatTime(msg.created_at);
              return (
                <div key={msg.id || `${gi}-${i}`} className={`flex ${isBuddy ? "justify-start" : "justify-end"} mb-1`}>
                  {/* Buddy avatar */}
                  {isBuddy && (
                    <div className="w-7 h-7 rounded-full overflow-hidden mr-1.5 mt-auto mb-1 shrink-0">
                      <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div
                    className={`relative max-w-[78%] group ${isBuddy ? "" : ""}`}
                    onContextMenu={(e) => {
                      if (msg.id) {
                        e.preventDefault();
                        setContextMenu(contextMenu === msg.id ? null : msg.id!);
                      }
                    }}
                    onClick={() => {
                      if (contextMenu && contextMenu !== msg.id) setContextMenu(null);
                    }}
                  >
                    {/* Pin indicator */}
                    {msg.pinned && (
                      <div className="absolute -top-1.5 right-2 z-10">
                        <Pin size={10} className="text-primary fill-primary" />
                      </div>
                    )}

                    <div
                      className={`px-3 py-2 text-[13px] leading-relaxed ${
                        isBuddy
                          ? "bg-card/80 backdrop-blur-sm border border-border/30 text-foreground rounded-2xl rounded-bl-md"
                          : "bg-primary/25 border border-primary/30 text-foreground rounded-2xl rounded-br-md"
                      }`}
                    >
                      {/* Image attachment */}
                      {msg.attachment?.type === "image" && (
                        <img
                          src={msg.attachment.url}
                          alt="Attachment"
                          className="rounded-lg max-h-48 w-auto mb-1.5 cursor-pointer"
                          onClick={() => window.open(msg.attachment!.url, "_blank")}
                          loading="lazy"
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
                          <FileText size={16} className="text-primary shrink-0" />
                          <span className="text-xs truncate">{msg.attachment.name}</span>
                        </a>
                      )}

                      {/* Text content */}
                      {msg.content && msg.content !== "[Gambar]" && msg.content !== "[Dokumen]" && (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 text-[13px]">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {/* Time + read status */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isBuddy ? "justify-start" : "justify-end"}`}>
                        <span className="text-[9px] text-muted-foreground/60">{time}</span>
                        {!isBuddy && <Check size={10} className="text-accent/60" />}
                      </div>
                    </div>

                    {/* Context menu (tap to pin) */}
                    {contextMenu === msg.id && msg.id && (
                      <div className={`absolute z-20 ${isBuddy ? "left-0" : "right-0"} -bottom-8 bg-card border border-border/40 rounded-lg shadow-lg`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin?.(msg.id!);
                            setContextMenu(null);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground whitespace-nowrap active:bg-muted"
                        >
                          <Pin size={12} className={msg.pinned ? "text-primary fill-primary" : ""} />
                          {msg.pinned ? "Unpin" : "Pin pesan"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start mb-1">
            <div className="w-7 h-7 rounded-full overflow-hidden mr-1.5 mt-auto mb-1 shrink-0">
              <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl rounded-bl-md px-3 py-2.5">
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
