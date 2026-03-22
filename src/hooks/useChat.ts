import { useState, useCallback, useRef, useEffect } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";

export type Message = { role: "user" | "assistant"; content: string };
export type BuddyState = "idle" | "listening" | "thinking" | "speaking";

async function playTTS(text: string): Promise<void> {
  const cleanText = text
    .replace(/[#*_~`>\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (!cleanText || cleanText.length < 2) {
    console.log("[TTS] Text too short, skipping");
    return;
  }
  const truncated = cleanText.slice(0, 500); // keep short to save credits

  const payload = { text: truncated, voiceId: "EXAVITQu4vr4xnSDxMaL" };
  console.log("[TTS] Request payload:", JSON.stringify(payload).slice(0, 120));

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
  console.log("[TTS] Calling:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("[TTS] Response status:", response.status, "Content-Type:", response.headers.get("content-type"));

  if (!response.ok) {
    const errBody = await response.text();
    console.error("[TTS] Request failed:", response.status, errBody);
    throw new Error(`TTS failed: ${response.status} - ${errBody}`);
  }

  const rawBlob = await response.blob();
  // Force correct MIME type regardless of what the response says
  const audioBlob = new Blob([rawBlob], { type: "audio/mpeg" });
  console.log("[TTS] Audio blob size:", audioBlob.size, "type:", audioBlob.type, "rawType:", rawBlob.type);

  if (audioBlob.size < 100) {
    console.error("[TTS] Audio blob too small, likely invalid");
    throw new Error("TTS returned invalid audio");
  }

  const audioUrl = URL.createObjectURL(audioBlob);
  console.log("[TTS] Created audio URL:", audioUrl);
  const audio = new Audio(audioUrl);
  audio.volume = 1.0;

  return new Promise<void>((resolve, reject) => {
    audio.oncanplaythrough = () => {
      console.log("[TTS] ✅ Audio can play through, duration:", audio.duration);
    };
    audio.onended = () => {
      console.log("[TTS] ✅ Playback finished");
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = (e) => {
      console.error("[TTS] ❌ Playback error:", e, "code:", audio.error?.code, "msg:", audio.error?.message);
      URL.revokeObjectURL(audioUrl);
      reject(new Error("Audio playback failed"));
    };
    audio.play().then(() => {
      console.log("[TTS] ▶️ Audio play started, volume:", audio.volume, "muted:", audio.muted, "paused:", audio.paused);
    }).catch((e) => {
      console.error("[TTS] ❌ Play blocked (autoplay policy?):", e.name, e.message);
      URL.revokeObjectURL(audioUrl);
      reject(e);
    });
  });
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");
  const scribeFinalTextRef = useRef("");
  const sendMessageRef = useRef<(input: string) => Promise<void>>(async () => {});

  const isLoading = buddyState === "thinking";
  const isSpeaking = buddyState === "speaking";
  const isListening = buddyState === "listening";

  const sendMessage = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    console.log("[Chat] User:", trimmed);
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

      console.log("[Chat] AI response:", assistantSoFar.slice(0, 80) + "...");

      // Auto TTS
      if (voiceEnabled && assistantSoFar) {
        setBuddyState("speaking");
        try {
          await playTTS(assistantSoFar);
        } catch (e) {
          console.error("[TTS] Error:", e);
        }
      }
    } catch (e) {
      console.error("[Chat] Error:", e);
      upsertAssistant("Maaf, aku sedang gangguan. Coba lagi ya! 😅");
    } finally {
      setBuddyState("idle");
    }
  }, [messages, voiceEnabled]);

  sendMessageRef.current = sendMessage;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "id",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => {
      console.log("[Mic] Active - listening started");
      setBuddyState("listening");
      setLiveTranscript("");
      scribeFinalTextRef.current = "";
    },
    onPartialTranscript: (data) => {
      const finalText = scribeFinalTextRef.current;
      const nextText = [finalText, data.text.trim()].filter(Boolean).join(" ").trim();
      setLiveTranscript(nextText);
    },
    onCommittedTranscript: (data) => {
      const committed = data.text.trim();
      if (!committed) return;
      console.log("[Mic] Transcript committed:", committed);
      scribeFinalTextRef.current = [scribeFinalTextRef.current, committed].filter(Boolean).join(" ").trim();
      setLiveTranscript(scribeFinalTextRef.current);
    },
    onDisconnect: () => {
      console.log("[Mic] Inactive - disconnected");
    },
    onError: (error) => {
      console.error("[Mic] STT error:", error);
      setBuddyState("idle");
    },
  });

  useEffect(() => {
    return () => {
      if (scribe.isConnected) scribe.disconnect();
    };
  }, [scribe]);

  const startListening = useCallback(async () => {
    try {
      if (scribe.isConnected) return;
      console.log("[Mic] Requesting token...");

      const tokenResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scribe-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!tokenResp.ok) throw new Error("Gagal mendapatkan token STT");
      const { token } = await tokenResp.json();
      if (!token) throw new Error("Token STT kosong");

      console.log("[Mic] Token received, connecting...");
      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      console.error("[Mic] Start error:", e);
      setBuddyState("idle");
    }
  }, [scribe]);

  const stopListening = useCallback(() => {
    if (scribe.isConnected) scribe.disconnect();

    const finalText = scribeFinalTextRef.current.trim();
    if (finalText) {
      console.log("[Mic] Final transcript:", finalText);
      scribeFinalTextRef.current = "";
      setLiveTranscript("");
      void sendMessageRef.current(finalText);
    } else {
      console.log("[Mic] No transcript captured");
      setLiveTranscript("");
      setBuddyState("idle");
    }
  }, [scribe]);

  return {
    messages, buddyState, isLoading, isSpeaking, isListening, liveTranscript,
    voiceEnabled, setVoiceEnabled, sendMessage, startListening, stopListening,
  };
}
