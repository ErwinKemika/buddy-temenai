import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const {
    messages, isLoading, isSpeaking, isListening, liveTranscript,
    voiceEnabled, setVoiceEnabled, sendMessage, startListening, stopListening,
  } = useChat();

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      <BuddyHeader />
      <BuddyRobot isTalking={isLoading || isSpeaking} isListening={isListening} />
      <BuddySpeechBubble messages={messages} isLoading={isLoading} />
      <BuddyControlBar
        onSendMessage={sendMessage}
        isLoading={isLoading}
        isListening={isListening}
        liveTranscript={liveTranscript}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
        onStartListening={startListening}
        onStopListening={stopListening}
      />
    </div>
  );
};

export default Index;
