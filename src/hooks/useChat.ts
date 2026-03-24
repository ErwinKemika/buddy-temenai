import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface TodoItem {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  category: string;
  recurrence: string;
  completed: boolean;
}

function buildTodoContext(): string {
  try {
    const raw = localStorage.getItem("buddy-todos");
    if (!raw) return "";
    const todos: TodoItem[] = JSON.parse(raw);
    if (!todos.length) return "";

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");

    const enriched = todos.map(t => {
      let deadlineState = "upcoming";
      if (t.date === todayStr) deadlineState = "today";
      else if (t.date < todayStr && !t.completed) deadlineState = "overdue";
      return { ...t, deadlineState };
    });

    const lines = enriched.map(t => {
      const parts = [`- "${t.title}"`];
      parts.push(`tanggal: ${t.date}`);
      if (t.startTime) parts.push(`mulai: ${t.startTime}`);
      if (t.endTime) parts.push(`selesai: ${t.endTime}`);
      parts.push(`status: ${t.status}`);
      parts.push(`prioritas: ${t.priority}`);
      parts.push(`kategori: ${t.category}`);
      parts.push(`pengulangan: ${t.recurrence}`);
      parts.push(`state: ${t.deadlineState}`);
      if (t.completed) parts.push(`(selesai)`);
      return parts.join(", ");
    });

    return `\n\nDATA TO-DO LIST USER (tanggal hari ini: ${format(today, "EEEE, d MMMM yyyy", { locale: idLocale })}, besok: ${tomorrowStr}):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export type Attachment = {
  type: "image" | "document" | "voice";
  url: string;
  name: string;
  mimeType: string;
};

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachment?: Attachment;
  pinned?: boolean;
  created_at?: string;
};

export type BuddyState = "idle" | "thinking" | "speaking";

async function uploadFile(file: File | Blob, folder: string): Promise<string> {
  const ext = file instanceof File ? file.name.split(".").pop() : "webm";
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("chat-attachments")
    .upload(fileName, file, { contentType: file instanceof File ? file.type : "audio/webm" });
  if (error) throw error;
  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
  return data.publicUrl;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function transcribeVoice(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob, "voice-note.webm");
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
    method: "POST",
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Gagal mentranskrip voice note (${response.status})`);
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("Voice note tidak terbaca, coba rekam lebih jelas ya.");
  return text;
}

async function playTTS(text: string): Promise<void> {
  const cleanText = text.replace(/[#*_~`>\[\]()!]/g, "").replace(/\n+/g, " ").trim();
  if (!cleanText || cleanText.length < 2) return;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text: cleanText.slice(0, 500), voiceId: "SCDJ1Fy4al0KS1awS6H9" }),
  });
  if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
  const rawBlob = await response.blob();
  const audioBlob = new Blob([rawBlob], { type: "audio/mpeg" });
  if (audioBlob.size < 100) throw new Error("TTS returned invalid audio");
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.volume = 1.0;
  return new Promise<void>((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(audioUrl); reject(new Error("Audio playback failed")); };
    audio.play().catch((e) => { URL.revokeObjectURL(audioUrl); reject(e); });
  });
}

function shouldSpeak(text: string): boolean {
  const clean = text.replace(/[#*_~`>\[\]()!]/g, "").trim();
  if (clean.length > 200) return false;
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 3);
  if (sentences.length > 2) return false;
  if (/```/.test(text) || /^\s*[-*]\s/m.test(text) || /^\s*\d+\.\s/m.test(text)) return false;
  return true;
}

function extractSpeakableText(text: string): string {
  const clean = text.replace(/[#*_~`>\[\]()!]/g, "").replace(/\n+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  let result = "";
  for (const s of sentences.slice(0, 2)) {
    if ((result + s).length > 150) break;
    result += s;
  }
  return result.trim() || clean.slice(0, 100);
}

// Save a message to Supabase
async function saveMessageToDB(userId: string, msg: Message): Promise<string | undefined> {
  const { data, error } = await supabase.from("messages").insert({
    user_id: userId,
    role: msg.role,
    content: msg.content,
    pinned: msg.pinned || false,
    attachment_type: msg.attachment?.type || null,
    attachment_url: msg.attachment?.url || null,
    attachment_name: msg.attachment?.name || null,
    attachment_mime: msg.attachment?.mimeType || null,
  } as any).select("id").single();
  if (error) { console.error("[DB Save]", error); return undefined; }
  return (data as any)?.id;
}

// Load messages from Supabase
async function loadMessagesFromDB(userId: string): Promise<Message[]> {
  const { data, error } = await supabase.from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }) as any;
  if (error) { console.error("[DB Load]", error); return []; }
  return (data || []).map((row: any) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    pinned: row.pinned,
    created_at: row.created_at,
    ...(row.attachment_type ? {
      attachment: {
        type: row.attachment_type,
        url: row.attachment_url,
        name: row.attachment_name,
        mimeType: row.attachment_mime,
      }
    } : {}),
  }));
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("buddy-voice-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => {
    const saved = localStorage.getItem("buddy-autoplay-voice");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const loadedRef = useRef(false);

  // Load messages from DB on mount
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;
    loadMessagesFromDB(user.id).then(msgs => {
      if (msgs.length > 0) setMessages(msgs);
    });
  }, [user]);

  // Persist voice settings
  useEffect(() => { localStorage.setItem("buddy-voice-enabled", JSON.stringify(voiceEnabled)); }, [voiceEnabled]);
  useEffect(() => { localStorage.setItem("buddy-autoplay-voice", JSON.stringify(autoPlayVoice)); }, [autoPlayVoice]);

  const togglePin = useCallback(async (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, pinned: !m.pinned } : m
    ));
    // Update in DB
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      await (supabase.from("messages").update({ pinned: !msg.pinned }).eq("id", msgId) as any);
    }
  }, [messages]);

  const streamChat = useCallback(async (
    chatMessages: Array<{ role: string; content: any }>,
    upsertAssistant: (chunk: string) => void,
    todoContext?: string,
  ) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, todoContext }),
      }
    );

    if (!resp.ok || !resp.body) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || "Gagal menghubungi Buddy");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, idx);
        textBuffer = textBuffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) upsertAssistant(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) upsertAssistant(content);
        } catch { /* ignore */ }
      }
    }
  }, []);

  const sendMessage = useCallback(async (input: string, attachment?: { file: File | Blob; type: "image" | "document" | "voice" }) => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;

    setBuddyState("thinking");

    let attachmentData: Attachment | undefined;
    let resolvedText = trimmed;

    if (attachment?.type === "voice") {
      try {
        resolvedText = await transcribeVoice(attachment.file);
      } catch (e) {
        console.error("[Transcribe] Error:", e);
        setMessages(prev => [...prev, { role: "assistant", content: e instanceof Error ? e.message : "Voice note gagal diproses." }]);
        setBuddyState("idle");
        return;
      }
    }

    if (attachment && attachment.type !== "voice") {
      try {
        const folder = attachment.type === "image" ? "images" : "documents";
        const fileUrl = await uploadFile(attachment.file, folder);
        attachmentData = {
          type: attachment.type,
          url: fileUrl,
          name: attachment.file instanceof File ? attachment.file.name : "voice-note.webm",
          mimeType: attachment.file instanceof File ? attachment.file.type : "audio/webm",
        };
      } catch (e) {
        console.error("[Upload] Error:", e);
        if (attachment.file instanceof File) {
          attachmentData = {
            type: attachment.type,
            url: URL.createObjectURL(attachment.file),
            name: attachment.file.name,
            mimeType: attachment.file.type,
          };
        }
      }
    }

    const userMsg: Message = {
      role: "user",
      content: resolvedText || (attachmentData ? `[${attachmentData.type === "image" ? "Gambar" : "Dokumen"}]` : ""),
      attachment: attachmentData,
      pinned: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    // Save user message to DB
    if (user) {
      const savedId = await saveMessageToDB(user.id, userMsg);
      if (savedId) {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m === userMsg ? { ...m, id: savedId } : m));
      }
    }

    // Build multimodal content for AI
    let userContent: any;
    if (attachmentData?.type === "image" && attachment?.file instanceof File) {
      try {
        const base64 = await fileToBase64(attachment.file);
        userContent = [
          { type: "image_url", image_url: { url: `data:${attachment.file.type};base64,${base64}` } },
        ];
        if (resolvedText) userContent.push({ type: "text", text: resolvedText });
        else userContent.push({ type: "text", text: "Apa yang kamu lihat di gambar ini?" });
      } catch {
        userContent = resolvedText || "Aku mengirim gambar tapi gagal diproses.";
      }
    } else if (attachmentData?.type === "document") {
      userContent = resolvedText || `Aku mengirim dokumen: ${attachmentData.name}`;
    } else {
      userContent = resolvedText;
    }

    const todoContext = buildTodoContext();
    const chatMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.id) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar, pinned: false, created_at: new Date().toISOString() }];
      });
    };

    try {
      await streamChat(chatMessages, upsertAssistant, todoContext);

      // Save assistant message to DB
      if (user && assistantSoFar) {
        const assistantMsg: Message = { role: "assistant", content: assistantSoFar, pinned: false, created_at: new Date().toISOString() };
        const savedId = await saveMessageToDB(user.id, assistantMsg);
        if (savedId) {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === "assistant" ? { ...m, id: savedId } : m));
        }
      }

      if (voiceEnabled && autoPlayVoice && assistantSoFar && shouldSpeak(assistantSoFar)) {
        setBuddyState("speaking");
        const speakText = extractSpeakableText(assistantSoFar);
        try { await playTTS(speakText); } catch (e) { console.error("[TTS] Error:", e); }
      }
    } catch (e) {
      console.error("[Chat] Error:", e);
      upsertAssistant("Maaf, aku sedang gangguan. Coba lagi ya! 😅");
    } finally {
      setBuddyState("idle");
    }
  }, [messages, voiceEnabled, autoPlayVoice, streamChat, user]);

  const injectReminderMessage = useCallback(async (text: string, speak: boolean) => {
    const msg: Message = { role: "assistant", content: text, pinned: false, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    if (user) {
      const savedId = await saveMessageToDB(user.id, msg);
      if (savedId) {
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, id: savedId } : m));
      }
    }
    if (speak) {
      setBuddyState("speaking");
      try { await playTTS(text); } catch (e) { console.error("[TTS Reminder]", e); }
      setBuddyState("idle");
    }
  }, [user]);

  return { messages, buddyState, voiceEnabled, setVoiceEnabled, autoPlayVoice, setAutoPlayVoice, sendMessage, injectReminderMessage, togglePin };
}
