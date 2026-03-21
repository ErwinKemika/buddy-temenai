import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      <BuddyHeader />
      <BuddyRobot isTalking={isLoading} />
      <BuddySpeechBubble messages={messages} isLoading={isLoading} />
      <BuddyControlBar onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default Index;
