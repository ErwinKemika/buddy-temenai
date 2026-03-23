import { useState, useEffect, useCallback, useRef } from "react";

export interface Reminder {
  id: string;
  title: string;
  dateTime: string; // ISO string
  earlyMinutes: number; // 0 = no early reminder
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

export function useReminders(onTrigger: (message: string) => void) {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  // Persist on change
  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  // Check every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          const target = new Date(r.dateTime).getTime();
          const copy = { ...r };

          // Early reminder
          if (r.earlyMinutes > 0 && !r.earlyFired) {
            const earlyTime = target - r.earlyMinutes * 60_000;
            if (now >= earlyTime && now < target) {
              copy.earlyFired = true;
              changed = true;
              onTriggerRef.current(`Halo, ${r.earlyMinutes} menit lagi kamu ada ${r.title}.`);
            }
          }

          // Main reminder
          if (!r.fired && now >= target) {
            copy.fired = true;
            changed = true;
            onTriggerRef.current(`Halo, sekarang waktunya ${r.title}. Semangat ya! 💪`);
          }

          return copy;
        });

        return changed ? updated : prev;
      });
    }, 15_000);

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
