import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Reminder {
  id: string;
  title: string;
  dateTime: string;
  earlyMinutes: number;
  earlyFired: boolean;
  fired: boolean;
}

const STORAGE_KEY = "buddy-reminders";

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

async function sendWhatsAppReminder(message: string) {
  try {
    // Get user's WhatsApp number from profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("whatsapp_number")
      .eq("user_id", user.id)
      .single();

    if (!profile?.whatsapp_number) return;

    const { error } = await supabase.functions.invoke("send-whatsapp", {
      body: { to: profile.whatsapp_number, message },
    });

    if (error) {
      console.error("[WhatsApp] Failed to send:", error);
    } else {
      console.log("[WhatsApp] Reminder sent successfully");
    }
  } catch (err) {
    console.error("[WhatsApp] Error:", err);
  }
}

export function useReminders(onTrigger: (message: string) => void) {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();

      setReminders(prev => {
        if (prev.length === 0) return prev;

        let changed = false;
        const triggers: Array<() => void> = [];
        const updated = prev.map(r => {
          const target = new Date(r.dateTime).getTime();
          const copy = { ...r };

          // Early reminder
          if (r.earlyMinutes > 0 && !r.earlyFired) {
            const earlyTime = target - r.earlyMinutes * 60_000;
            if (now >= earlyTime && now < target) {
              copy.earlyFired = true;
              changed = true;
              const msg = `⏰ Halo, ${r.earlyMinutes} menit lagi kamu ada ${r.title}.`;
              triggers.push(() => {
                onTriggerRef.current(msg);
                sendWhatsAppReminder(msg);
              });
            }
          }

          // Main reminder
          if (!r.fired && now >= target) {
            copy.fired = true;
            changed = true;
            const msg = `⏰ Halo, sekarang waktunya ${r.title}. Semangat ya! 💪`;
            triggers.push(() => {
              onTriggerRef.current(msg);
              sendWhatsAppReminder(msg);
            });
          }

          return copy;
        });

        if (triggers.length > 0) {
          setTimeout(() => triggers.forEach(fn => fn()), 0);
        }

        return changed ? updated : prev;
      });
    };

    check();
    const interval = setInterval(check, 5_000);
    return () => clearInterval(interval);
  }, []);

  const addReminder = useCallback((title: string, dateTime: string, earlyMinutes: number) => {
    const newReminder: Reminder = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      dateTime,
      earlyMinutes,
      earlyFired: false,
      fired: false,
    };
    setReminders(prev => [...prev, newReminder]);
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const activeReminders = reminders.filter(r => !r.fired);
  const pastReminders = reminders.filter(r => r.fired);

  return { reminders, activeReminders, pastReminders, addReminder, deleteReminder };
}
