import { useEffect, useRef, useCallback } from "react";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BottomNav from "@/components/BottomNav";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import { useChat } from "@/hooks/useChat";
import { format, isSameDay, startOfDay, isBefore } from "date-fns";

const TODO_STORAGE_KEY = "buddy-todos";
const REMINDED_KEY = "buddy-todo-reminded";

interface TodoTask {
  id: string;
  title: string;
  done: boolean;
  date: string;
  startTime?: string;
  status: string;
  recurrence: string;
}

function loadRemindedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(REMINDED_KEY) || "[]"));
  } catch { return new Set(); }
}

function saveRemindedSet(s: Set<string>) {
  localStorage.setItem(REMINDED_KEY, JSON.stringify([...s]));
}

const Index = () => {
  const {
    messages, buddyState,
    voiceEnabled, setVoiceEnabled,
    autoPlayVoice, setAutoPlayVoice,
    sendMessage, injectReminderMessage,
    togglePin, startReply, cancelReply, replyingTo,
  } = useChat();

  const remindedRef = useRef(loadRemindedSet());

  // Check To-Do list every 10 seconds and remind user
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let tasks: TodoTask[] = [];
      try {
        tasks = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || "[]");
      } catch { return; }

      const reminded = remindedRef.current;

      for (const task of tasks) {
        if (task.done || task.status === "done") continue;

        // Check if task is relevant for today
        const isForToday =
          task.date === todayStr ||
          task.recurrence === "daily" && task.date <= todayStr ||
          task.recurrence === "weekly" && new Date(task.date).getDay() === now.getDay() && task.date <= todayStr;

        if (!isForToday) continue;

        // Remind at start time
        if (task.startTime) {
          const [h, m] = task.startTime.split(":").map(Number);
          const taskMinutes = h * 60 + m;
          const diff = taskMinutes - currentMinutes;

          // 5 min before reminder
          const earlyKey = `early-${task.id}-${todayStr}`;
          if (diff > 0 && diff <= 5 && !reminded.has(earlyKey)) {
            reminded.add(earlyKey);
            saveRemindedSet(reminded);
            const msg = `Halo, ${diff} menit lagi kamu ada tugas: ${task.title}. Siap-siap ya! ⏰`;
            console.log(`[Todo Reminder] EARLY: ${msg}`);
            void injectReminderMessage(msg, voiceEnabled);
          }

          // Exact time reminder
          const exactKey = `exact-${task.id}-${todayStr}`;
          if (diff <= 0 && diff > -2 && !reminded.has(exactKey)) {
            reminded.add(exactKey);
            saveRemindedSet(reminded);
            const msg = `Halo, sekarang waktunya ${task.title}. Semangat ya! 💪`;
            console.log(`[Todo Reminder] NOW: ${msg}`);
            void injectReminderMessage(msg, voiceEnabled);
          }
        }

        // Overdue task reminder (no startTime, or past due)
        const overdueKey = `overdue-${task.id}-${todayStr}`;
        if (!task.startTime && isBefore(startOfDay(new Date(task.date)), startOfDay(now)) && !isSameDay(new Date(task.date), now)) {
          if (!reminded.has(overdueKey)) {
            reminded.add(overdueKey);
            saveRemindedSet(reminded);
            const msg = `Eh, kamu punya tugas yang belum selesai: ${task.title}. Yuk dikerjain! 📝`;
            console.log(`[Todo Reminder] OVERDUE: ${msg}`);
            void injectReminderMessage(msg, voiceEnabled);
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [injectReminderMessage, voiceEnabled]);

  const handleSendMessage = useCallback((input: string, attachment?: { file: File | Blob; type: "image" | "document" | "voice" }) => {
    void sendMessage(input, attachment);
  }, [sendMessage]);

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset">
      <BuddyHeader />
      <BuddyRobot buddyState={buddyState} />
      <BuddySpeechBubble messages={messages} buddyState={buddyState} />
      <BuddyControlBar
        onSendMessage={handleSendMessage}
        buddyState={buddyState}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(v => !v)}
      />
      <BottomNav />
    </div>
  );
};

export default Index;
