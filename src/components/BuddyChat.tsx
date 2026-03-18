import { useRef, useEffect } from "react";

interface Message {
  id: number;
  sender: "buddy" | "user";
  text: string;
  time: string;
}

const messages: Message[] = [
  {
    id: 1,
    sender: "buddy",
    text: "Halo! Aku Buddy. Senang bertemu kamu lagi. Mau cerita apa hari ini? 😊",
    time: "10:30",
  },
  {
    id: 2,
    sender: "user",
    text: "Tadi aku lihat kucing lucu banget di jalan.",
    time: "10:31",
  },
  {
    id: 3,
    sender: "buddy",
    text: "Wah, seru! Kucingnya warna apa? Aku suka lihat foto-foto kucing. 🐱",
    time: "10:31",
  },
];

const BuddyChat = () => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 overscroll-contain">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

const ChatBubble = ({ message }: { message: Message }) => {
  const isBuddy = message.sender === "buddy";

  return (
    <div className={`flex ${isBuddy ? "justify-start" : "justify-end"}`}>
      <div className="flex flex-col gap-0.5">
        <div
          className={`max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed ${
            isBuddy
              ? "bg-buddy-bubble text-foreground rounded-2xl rounded-tl-sm"
              : "bg-buddy-user-bubble text-secondary-foreground rounded-2xl rounded-tr-sm"
          }`}
        >
          {isBuddy && (
            <span className="block text-[11px] font-semibold text-primary mb-0.5">
              Buddy
            </span>
          )}
          {message.text}
        </div>
        <span className={`text-[10px] text-muted-foreground px-1 ${isBuddy ? "text-left" : "text-right"}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
};

export default BuddyChat;