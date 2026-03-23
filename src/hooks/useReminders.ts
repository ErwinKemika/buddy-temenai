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

  // Check every 5 seconds
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const nowDate = new Date(now);
      console.log(`[Reminder Check] Current time: ${nowDate.toLocaleString()}`);

      setReminders(prev => {
        let changed = false;
        const triggers: Array<() => void> = [];
        const updated = prev.map(r => {
          const target = new Date(r.dateTime).getTime();
          const copy = { ...r };

          console.log(`[Reminder] "${r.title}" target: ${new Date(target).toLocaleString()}, fired: ${r.fired}, earlyFired: ${r.earlyFired}, diff: ${Math.round((target - now) / 1000)}s`);

          // Early reminder
          if (r.earlyMinutes > 0 && !r.earlyFired) {
            const earlyTime = target - r.earlyMinutes * 60_000;
            if (now >= earlyTime && now < target) {
              copy.earlyFired = true;
              changed = true;
              const msg = `Halo, ${r.earlyMinutes} menit lagi kamu ada ${r.title}.`;
              console.log(`[Reminder EARLY TRIGGERED] "${r.title}": ${msg}`);
              triggers.push(() => onTriggerRef.current(msg));
            }
          }

          // Main reminder
          if (!r.fired && now >= target) {
            copy.fired = true;
            changed = true;
            const msg = `Halo, sekarang waktunya ${r.title}. Semangat ya! 💪`;
            console.log(`[Reminder TRIGGERED] "${r.title}": ${msg}`);
            triggers.push(() => onTriggerRef.current(msg));
          } else if (r.fired) {
            console.log(`[Reminder] "${r.title}" already fired, skipping.`);
          }

          return copy;
        });

        // Fire triggers outside setState to avoid issues
        if (triggers.length > 0) {
          setTimeout(() => triggers.forEach(fn => fn()), 0);
        }

        return changed ? updated : prev;
      });
    };

    // Run immediately on mount
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
    console.log(`[Reminder Added]`, JSON.stringify(newReminder, null, 2));
    console.log(`[Reminder Added] Target local: ${new Date(dateTime).toLocaleString()}`);
    setReminders(prev => [...prev, newReminder]);
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const activeReminders = reminders.filter(r => !r.fired);
  const pastReminders = reminders.filter(r => r.fired);

  return { reminders, activeReminders, pastReminders, addReminder, deleteReminder };
}
