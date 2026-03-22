import { useState, useCallback } from "react";

export type Message = { role: "user" | "assistant"; content: string };
export type BuddyState = "idle" | "thinking" | "speaking";

async function playTTS(text: string): Promise<void> {
  const cleanText = text
    .replace(/[#*_~`>\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (!cleanText || cleanText.length < 2) return;
  const truncated = cleanText.slice(0, 500);

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text: truncated, voiceId: "EXAVITQu4vr4xnSDxMaL" }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`TTS failed: ${response.status} - ${errBody}`);
  }

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

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const allMessages = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setBuddyState("thinking");

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
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
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

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

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
  }, [messages, voiceEnabled]);

  return {
    messages, buddyState, voiceEnabled, setVoiceEnabled, sendMessage,
  };
}
