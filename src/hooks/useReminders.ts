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
    const parsed = raw ? JSON.parse(raw) : [];
    console.log("[Reminder Load] Loaded reminders:", parsed);
    return parsed;
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]) {
  console.log("[Reminder Save] Persisting reminder list:", reminders);
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
        console.log(`[Reminder Check] Total reminders: ${prev.length}`);
        console.log("[Reminder Check] Full reminder list:", prev);

        if (prev.length === 0) {
          console.log("[Reminder Check] No reminders saved");
          return prev;
        }

        let changed = false;
        const triggers: Array<() => void> = [];
        const updated = prev.map(r => {
          const target = new Date(r.dateTime).getTime();
          const copy = { ...r };

          console.log(
            `[Reminder Check] title="${r.title}" target="${new Date(target).toLocaleString()}" iso="${r.dateTime}" fired=${r.fired} earlyFired=${r.earlyFired} diff=${Math.round((target - now) / 1000)}s`
          );

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
            console.log(`[Reminder Check] "${r.title}" already fired, skipping.`);
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
    console.log(`[Reminder Save] Raw input -> title="${title}" dateTime="${dateTime}" earlyMinutes=${earlyMinutes}`);
    console.log(`[Reminder Save] Parsed target local: ${new Date(dateTime).toLocaleString()}`);
    setReminders(prev => {
      const updated = [...prev, newReminder];
      console.log("[Reminder Save] Saved reminder:", newReminder);
      console.log("[Reminder Save] Updated reminder list:", updated);
      return updated;
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const activeReminders = reminders.filter(r => !r.fired);
  const pastReminders = reminders.filter(r => r.fired);

  return { reminders, activeReminders, pastReminders, addReminder, deleteReminder };
}
