import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BottomNav from "@/components/BottomNav";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import { useChat } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
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
  } catch {
    return new Set();
  }
}

function saveRemindedSet(s: Set<string>) {
  localStorage.setItem(REMINDED_KEY, JSON.stringify([...s]));
}

async function sendWhatsAppReminder(message: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("whatsapp_number").eq("user_id", user.id).single();
    if (!profile?.whatsapp_number) return;
    await supabase.functions.invoke("send-whatsapp", {
      body: { to: profile.whatsapp_number, message },
    });
  } catch (err) {
    console.error("[WhatsApp Reminder]", err);
  }
}

const Index = () => {
  const navigate = useNavigate();
  const {
    messages,
    buddyState,
    voiceEnabled,
    setVoiceEnabled,
    sendMessage,
    injectReminderMessage,
    clearMessages,
  } = useChat();

  const remindedRef = useRef(loadRemindedSet());

  // Redirect new users to onboarding upgrade page
  useEffect(() => {
    if (localStorage.getItem("buddy-new-user") === "true") {
      navigate("/upgrade?onboarding=true", { replace: true });
    }
  }, [navigate]);

  // Check To-Do list every 10 seconds and remind user
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let tasks: TodoTask[] = [];
      try {
        tasks = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || "[]");
      } catch {
        return;
      }

      const reminded = remindedRef.current;

      for (const task of tasks) {
        if (task.done || task.status === "done") continue;

        const isForToday =
          task.date === todayStr ||
          (task.recurrence === "daily" && task.date <= todayStr) ||
          (task.recurrence === "weekly" && new Date(task.date).getDay() === now.getDay() && task.date <= todayStr);

        if (!isForToday) continue;

        if (task.startTime) {
          const [h, m] = task.startTime.split(":").map(Number);
          const taskMinutes = h * 60 + m;
          const diff = taskMinutes - currentMinutes;

          const earlyKey = `early-${task.id}-${todayStr}`;
          if (diff > 0 && diff <= 5 && !reminded.has(earlyKey)) {
            reminded.add(earlyKey);
            saveRemindedSet(reminded);
            const msg = `Halo, ${diff} menit lagi kamu ada tugas: ${task.title}. Siap-siap ya! ⏰`;
            void injectReminderMessage(msg, voiceEnabled);
            void sendWhatsAppReminder(msg);
          }

          const exactKey = `exact-${task.id}-${todayStr}`;
          if (diff <= 0 && diff > -2 && !reminded.has(exactKey)) {
            reminded.add(exactKey);
            saveRemindedSet(reminded);
            const msg = `Halo, sekarang waktunya ${task.title}. Semangat ya! 💪`;
            void injectReminderMessage(msg, voiceEnabled);
            void sendWhatsAppReminder(msg);
          }
        }

        const overdueKey = `overdue-${task.id}-${todayStr}`;
        if (
          !task.startTime &&
          isBefore(startOfDay(new Date(task.date)), startOfDay(now)) &&
          !isSameDay(new Date(task.date), now)
        ) {
          if (!reminded.has(overdueKey)) {
            reminded.add(overdueKey);
            saveRemindedSet(reminded);
            const msg = `Eh, kamu punya tugas yang belum selesai: ${task.title}. Yuk dikerjain! 📝`;
            void injectReminderMessage(msg, voiceEnabled);
            void sendWhatsAppReminder(msg);
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 10_000);
    return () => clearInterval(interval);
  }, [injectReminderMessage, voiceEnabled]);

  const handleSendMessage = useCallback(
    (input: string, attachment?: { file: File | Blob; type: "image" | "document" | "voice" }) => {
      void sendMessage(input, attachment);
    },
    [sendMessage],
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset relative">
      {/* Buddy fixed in background - full opacity when no messages, faded when chatting */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className={`transition-opacity duration-700 ${messages.length > 0 ? "opacity-30" : "opacity-100"}`}>
          <BuddyRobot buddyState={buddyState} />
        </div>
      </div>

      {/* Foreground: Header + Chat + Input + Nav */}
      <div className="relative z-10 flex flex-col h-full">
        <BuddyHeader onClearChat={clearMessages} hasMessages={messages.length > 0} />

        {/* Glass chat container */}
        <div className="flex-1 min-h-0 flex flex-col">
          <BuddySpeechBubble messages={messages} buddyState={buddyState} />
        </div>

        <BuddyControlBar
          onSendMessage={handleSendMessage}
          buddyState={buddyState}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
        />
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
