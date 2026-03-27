import { useEffect, useRef, useCallback, useState } from "react";
import { MessageSquare, Mic } from "lucide-react";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyControlBar from "@/components/BuddyControlBar";
import BottomNav from "@/components/BottomNav";
import BuddySpeechBubble from "@/components/BuddySpeechBubble";
import VoiceMode from "@/components/VoiceMode";

import { useChat, streamChat, playTTS, transcribeVoice, buildTodoContext, Message } from "@/hooks/useChat";
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

type ChatMode = "chat" | "voice";

const Index = () => {
  const {
    messages, buddyState,
    voiceEnabled, setVoiceEnabled,
    sendMessage, injectReminderMessage, clearMessages,
    importVoiceSession,
  } = useChat();

  const [mode, setMode] = useState<ChatMode>("chat");
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

        const isForToday =
          task.date === todayStr ||
          task.recurrence === "daily" && task.date <= todayStr ||
          task.recurrence === "weekly" && new Date(task.date).getDay() === now.getDay() && task.date <= todayStr;

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
          }

          const exactKey = `exact-${task.id}-${todayStr}`;
          if (diff <= 0 && diff > -2 && !reminded.has(exactKey)) {
            reminded.add(exactKey);
            saveRemindedSet(reminded);
            const msg = `Halo, sekarang waktunya ${task.title}. Semangat ya! 💪`;
            void injectReminderMessage(msg, voiceEnabled);
          }
        }

        const overdueKey = `overdue-${task.id}-${todayStr}`;
        if (!task.startTime && isBefore(startOfDay(new Date(task.date)), startOfDay(now)) && !isSameDay(new Date(task.date), now)) {
          if (!reminded.has(overdueKey)) {
            reminded.add(overdueKey);
            saveRemindedSet(reminded);
            const msg = `Eh, kamu punya tugas yang belum selesai: ${task.title}. Yuk dikerjain! 📝`;
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

  const handleEndVoiceCall = useCallback((voiceMessages: Message[]) => {
    importVoiceSession(voiceMessages);
    setMode("chat");
  }, [importVoiceSession]);

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg space-stars overflow-hidden safe-area-inset relative">
      {/* Buddy fixed in background - only in chat mode */}
      {mode === "chat" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className={`transition-opacity duration-700 ${messages.length > 0 ? 'opacity-30' : 'opacity-100'}`}>
            <BuddyRobot buddyState={buddyState} />
          </div>
        </div>
      )}

      {/* Foreground */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header — hidden in voice mode */}
        <div className={`transition-all duration-500 ${mode === "voice" ? "opacity-0 scale-95 h-0 overflow-hidden" : "opacity-100 scale-100"}`}>
          <BuddyHeader onClearChat={clearMessages} hasMessages={messages.length > 0} />
        </div>
        
        {/* Mode toggle — always visible */}
        <div className={`flex items-center justify-center gap-1 px-4 pt-2 pb-1 ${mode === "voice" ? "absolute top-2 left-0 z-20 w-full pointer-events-none" : ""}`}>
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 pointer-events-auto ${
              mode === "chat"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 pointer-events-auto ${
              mode === "voice"
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic size={14} />
            Ngobrol
          </button>
        </div>

        {/* Chat / Voice crossfade container */}
        <div className="flex-1 min-h-0 relative">
          {/* Chat content */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-in-out ${
            mode === "chat"
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none translate-y-4"
          }`}>
            <div className="flex-1 min-h-0 flex flex-col">
              <BuddySpeechBubble messages={messages} buddyState={buddyState} />
            </div>
            <BuddyControlBar
              onSendMessage={handleSendMessage}
              buddyState={buddyState}
              voiceEnabled={voiceEnabled}
              onToggleVoice={() => setVoiceEnabled(v => !v)}
            />
          </div>

          {/* Voice content */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-in-out ${
            mode === "voice"
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-4"
          }`}>
            <VoiceMode
              onEndCall={handleEndVoiceCall}
              streamChat={streamChat}
              playTTS={playTTS}
              transcribeVoice={transcribeVoice}
              buildTodoContext={buildTodoContext}
              chatHistory={messages}
            />
          </div>
        </div>

        {/* BottomNav — hidden in voice mode */}
        <div className={`transition-all duration-500 ${mode === "voice" ? "opacity-0 scale-95 h-0 overflow-hidden" : "opacity-100 scale-100"}`}>
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Index;
