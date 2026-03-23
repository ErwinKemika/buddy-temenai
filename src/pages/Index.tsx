import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const {
    messages, buddyState,
    voiceEnabled, setVoiceEnabled,
    autoPlayVoice, setAutoPlayVoice,
    sendMessage,
  } = useChat();

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      <BuddyHeader
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
        autoPlayVoice={autoPlayVoice}
        onToggleAutoPlay={() => setAutoPlayVoice(v => !v)}
      />
      <BuddyRobot buddyState={buddyState} />
      <BuddySpeechBubble messages={messages} buddyState={buddyState} />
      <BuddyControlBar
        onSendMessage={sendMessage}
        buddyState={buddyState}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
      />
    </div>
  );
};

export default Index;
