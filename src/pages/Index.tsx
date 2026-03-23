import { useState, useCallback } from "react";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BottomNav from "@/components/BottomNav";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import AddReminderDialog from "@/components/AddReminderDialog";
import ReminderList from "@/components/ReminderList";
import { useChat } from "@/hooks/useChat";
import { useReminders } from "@/hooks/useReminders";
import { formatReminderConfirmation, parseReminderIntent } from "@/lib/reminderIntent";

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

  const handleSendMessage = useCallback((input: string, attachment?: { file: File | Blob; type: "image" | "document" | "voice" }) => {
    const parsedReminder = attachment ? null : parseReminderIntent(input);

    if (parsedReminder) {
      console.log(`[Reminder Chat] Raw user input: ${parsedReminder.rawInput}`);
      console.log(`[Reminder Chat] Parsed date/time: ${parsedReminder.parsedDateTimeLocal}`);
      console.log("[Reminder Chat] Final reminder payload:", parsedReminder);

      addReminder(parsedReminder.title, parsedReminder.dateTime, parsedReminder.earlyMinutes);

      const confirmation = `Siap, pengingat ${parsedReminder.title} sudah aku simpan untuk ${formatReminderConfirmation(parsedReminder.dateTime)}.`;
      void injectReminderMessage(confirmation, voiceEnabled);
      return;
    }

    void sendMessage(input, attachment);
  }, [addReminder, injectReminderMessage, sendMessage, voiceEnabled]);

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
        onSendMessage={handleSendMessage}
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
      <BottomNav />
    </div>
  );
};

export default Index;
