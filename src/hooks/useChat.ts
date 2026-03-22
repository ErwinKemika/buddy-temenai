import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Attachment = {
  type: "image" | "document" | "voice";
  url: string;
  name: string;
  mimeType: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  attachment?: Attachment;
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
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
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
    body: JSON.stringify({ text: cleanText.slice(0, 500), voiceId: "EXAVITQu4vr4xnSDxMaL" }),
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

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const streamChat = useCallback(async (
    chatMessages: Array<{ role: string; content: any }>,
    upsertAssistant: (chunk: string) => void,
  ) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages }),
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

    // flush
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
        const folder = attachment.type === "image" ? "images" : attachment.type === "voice" ? "voice" : "documents";
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
    };

    setMessages(prev => [...prev, userMsg]);

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

    const chatMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat(chatMessages, upsertAssistant);

      if (voiceEnabled && assistantSoFar) {
        setBuddyState("speaking");
        try { await playTTS(assistantSoFar); } catch (e) { console.error("[TTS] Error:", e); }
      }
    } catch (e) {
      console.error("[Chat] Error:", e);
      upsertAssistant("Maaf, aku sedang gangguan. Coba lagi ya! 😅");
    } finally {
      setBuddyState("idle");
    }
  }, [messages, voiceEnabled, streamChat]);

  return { messages, buddyState, voiceEnabled, setVoiceEnabled, sendMessage };
}
