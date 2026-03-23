import { useState, useCallback } from "react";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import AddReminderDialog from "@/components/AddReminderDialog";
import ReminderList from "@/components/ReminderList";
import { useChat } from "@/hooks/useChat";
import { useReminders } from "@/hooks/useReminders";

const Index = () => {
  const {
    messages, buddyState,
    voiceEnabled, setVoiceEnabled,
    autoPlayVoice, setAutoPlayVoice,
    sendMessage, injectReminderMessage,
  } = useChat();

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showReminderList, setShowReminderList] = useState(false);

  const handleReminderTrigger = useCallback((message: string) => {
    injectReminderMessage(message, voiceEnabled);
  }, [injectReminderMessage, voiceEnabled]);

  const { activeReminders, reminders, addReminder, deleteReminder } = useReminders(handleReminderTrigger);

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      <BuddyHeader
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
        autoPlayVoice={autoPlayVoice}
        onToggleAutoPlay={() => setAutoPlayVoice(v => !v)}
        activeReminderCount={activeReminders.length}
        onOpenReminders={() => setShowReminderList(true)}
      />
      <BuddyRobot buddyState={buddyState} />
      <BuddySpeechBubble messages={messages} buddyState={buddyState} />
      <BuddyControlBar
        onSendMessage={sendMessage}
        buddyState={buddyState}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
        onAddReminder={() => setShowAddReminder(true)}
      />

      <AddReminderDialog
        open={showAddReminder}
        onClose={() => setShowAddReminder(false)}
        onAdd={addReminder}
      />
      <ReminderList
        open={showReminderList}
        onClose={() => setShowReminderList(false)}
        reminders={reminders}
        onDelete={deleteReminder}
      />
    </div>
  );
};

export default Index;
