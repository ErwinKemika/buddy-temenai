import { format } from "date-fns";

interface ParsedTask {
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
}

/**
 * Parse natural language input into a task.
 * Examples:
 * - "Meeting besok jam 3" → title: "Meeting", date: tomorrow, startTime: "15:00"
 * - "Olahraga tiap pagi" → title: "Olahraga tiap pagi", date: today
 * - "Beli susu jam 10 pagi" → title: "Beli susu", date: today, startTime: "10:00"
 * - "Presentasi lusa jam 14:30" → title: "Presentasi", date: day after tomorrow, startTime: "14:30"
 */
export function parseTodoInput(input: string): ParsedTask {
  const trimmed = input.trim();
  const now = new Date();
  let date = new Date(now);
  let startTime: string | undefined;
  let endTime: string | undefined;
  let title = trimmed;

  // Extract date keywords
  const besokMatch = /\bbesok\b/i.test(trimmed);
  const lusaMatch = /\blusa\b/i.test(trimmed);
  const hariIniMatch = /\bhari\s*ini\b/i.test(trimmed);

  if (besokMatch) {
    date.setDate(date.getDate() + 1);
    title = title.replace(/\bbesok\b/gi, "").trim();
  } else if (lusaMatch) {
    date.setDate(date.getDate() + 2);
    title = title.replace(/\blusa\b/gi, "").trim();
  } else if (hariIniMatch) {
    title = title.replace(/\bhari\s*ini\b/gi, "").trim();
  }

  // Extract time: "jam 3", "jam 3 sore", "jam 10 pagi", "jam 14:30", "jam 3.30"
  const timeRegex = /\bjam\s+(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/i;
  const timeMatch = trimmed.match(timeRegex);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === "sore" || period === "malam") {
      if (hour < 12) hour += 12;
    } else if (period === "pagi" && hour === 12) {
      hour = 0;
    } else if (!period && hour < 8) {
      // Assume PM for ambiguous small numbers without period
      hour += 12;
    }

    startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    title = title.replace(timeRegex, "").trim();
  }

  // Extract time range: "10:00 - 11:00", "10-11"
  const rangeRegex = /\b(\d{1,2})[:.]?(\d{2})?\s*[-–]\s*(\d{1,2})[:.]?(\d{2})?\b/;
  const rangeMatch = trimmed.match(rangeRegex);
  if (rangeMatch && !startTime) {
    const h1 = parseInt(rangeMatch[1], 10);
    const m1 = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const h2 = parseInt(rangeMatch[3], 10);
    const m2 = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    startTime = `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`;
    endTime = `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`;
    title = title.replace(rangeRegex, "").trim();
  }

  // Clean up title
  title = title.replace(/\s+/g, " ").replace(/^[,.\-–]+|[,.\-–]+$/g, "").trim();
  if (!title) title = trimmed; // fallback to original

  return {
    title,
    date: format(date, "yyyy-MM-dd"),
    startTime,
    endTime,
  };
}

const BUDDY_RESPONSES = [
  "Oke, udah aku tambahin ya! ✅",
  "Siap, udah dicatat! 📝",
  "Noted! Semangat ya! 💪",
  "Udah aku masukin, jangan lupa ya! 😉",
  "Oke bos, udah masuk! 🎯",
  "Siap! Aku bantu ingetin nanti ya 😊",
];

export function getRandomBuddyResponse(): string {
  return BUDDY_RESPONSES[Math.floor(Math.random() * BUDDY_RESPONSES.length)];
}
