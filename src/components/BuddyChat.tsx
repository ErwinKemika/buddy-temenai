interface Message {
  id: number;
  sender: "buddy" | "user";
  text: string;
}

const messages: Message[] = [
  {
    id: 1,
    sender: "buddy",
    text: "Halo! Aku Buddy. Senang bertemu kamu lagi. Mau cerita apa hari ini? 😊",
  },
  {
    id: 2,
    sender: "user",
    text: "Tadi aku lihat kucing lucu banget di jalan.",
  },
  {
    id: 3,
    sender: "buddy",
    text: "Wah, seru! Kucingnya warna apa? Aku suka lihat foto-foto kucing. 🐱",
  },
];

const BuddyChat = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
};

const ChatBubble = ({ message }: { message: Message }) => {
  const isBuddy = message.sender === "buddy";

  return (
    <div className={`flex ${isBuddy ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
          isBuddy
            ? "bg-buddy-bubble text-foreground rounded-2xl rounded-tl-md"
            : "bg-buddy-user-bubble text-secondary-foreground rounded-2xl rounded-tr-md"
        }`}
      >
        {isBuddy && (
          <span className="block text-[11px] font-semibold text-primary mb-1">
            Buddy
          </span>
        )}
        {message.text}
      </div>
    </div>
  );
};

export default BuddyChat;
