export interface ParsedReminderIntent {
  title: string;
  dateTime: string;
  earlyMinutes: number;
  rawInput: string;
  parsedDateTimeLocal: string;
}

const REMINDER_INTENT_REGEX = /(ingatkan|pengingat|reminder|remind me|buat reminder|buat pengingat|set reminder)/i;
const TIME_REGEX = /(?:jam|pukul|at)\s*(\d{1,2})[:.](\d{2})/i;
const ISO_DATE_REGEX = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const LOCAL_DATE_REGEX = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/;
const EARLY_REGEX = /(\d+)\s*menit\s*(?:lebih awal|sebelumnya|sebelum)/i;

function parseBaseDate(input: string, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (/\b(besok|tomorrow)\b/i.test(input)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  }

  const isoMatch = input.match(ISO_DATE_REGEX);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const localMatch = input.match(LOCAL_DATE_REGEX);
  if (localMatch) {
    const [, day, month, year] = localMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return today;
}

function extractTitle(input: string) {
  const title = input
    .replace(/^(tolong\s+)?(ingatkan saya(?:\s+untuk)?|buat(?:kan)?(?:\s+saya)?\s+(?:reminder|pengingat)|set(?:kan)?\s+reminder|remind me(?:\s+to)?)/i, "")
    .replace(/\b(hari ini|today|besok|tomorrow)\b/gi, " ")
    .replace(ISO_DATE_REGEX, " ")
    .replace(LOCAL_DATE_REGEX, " ")
    .replace(TIME_REGEX, " ")
    .replace(EARLY_REGEX, " ")
    .replace(/\b(untuk|di|pada)\b/gi, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return title || "Pengingat";
}

export function parseReminderIntent(input: string, now = new Date()): ParsedReminderIntent | null {
  const rawInput = input.trim();
  if (!rawInput || !REMINDER_INTENT_REGEX.test(rawInput)) return null;

  const timeMatch = rawInput.match(TIME_REGEX);
  if (!timeMatch) return null;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return null;

  const baseDate = parseBaseDate(rawInput, now);
  const targetDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0,
  );

  if (Number.isNaN(targetDate.getTime())) return null;

  const earlyMinutesMatch = rawInput.match(EARLY_REGEX);
  const earlyMinutes = earlyMinutesMatch ? Number(earlyMinutesMatch[1]) : 0;

  return {
    title: extractTitle(rawInput),
    dateTime: targetDate.toISOString(),
    earlyMinutes: Number.isNaN(earlyMinutes) ? 0 : earlyMinutes,
    rawInput,
    parsedDateTimeLocal: targetDate.toLocaleString("id-ID"),
  };
}

export function formatReminderConfirmation(dateTime: string) {
  return new Date(dateTime).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}