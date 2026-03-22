import { useState, useCallback, useRef, useEffect } from "react";
import { CommitStrategy, useScribe } from "@elevenlabs/react";

export type Message = { role: "user" | "assistant"; content: string };

async function playTTS(text: string): Promise<void> {
  const cleanText = text
    .replace(/[#*_~`>\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (!cleanText || cleanText.length < 2) return;

  const truncated = cleanText.slice(0, 5000);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text: truncated }),
    }
  );

  if (!response.ok) {
    console.error("TTS failed:", response.status);
    return;
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return new Promise<void>((resolve) => {
    audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.play().catch(() => resolve());
  });
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");
  const scribeFinalTextRef = useRef("");
  const sendMessageRef = useRef<(input: string) => Promise<void>>(async () => {});

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

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
        setIsSpeaking(true);
        try {
          await playTTS(assistantSoFar);
        } catch (e) {
          console.error("TTS playback error:", e);
        } finally {
          setIsSpeaking(false);
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("Maaf, aku sedang gangguan. Coba lagi ya! 😅");
    } finally {
      setIsLoading(false);
    }
  }, [messages, voiceEnabled]);

  sendMessageRef.current = sendMessage;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "id",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => {
      setIsListening(true);
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

      scribeFinalTextRef.current = [scribeFinalTextRef.current, committed].filter(Boolean).join(" ").trim();
      setLiveTranscript(scribeFinalTextRef.current);
    },
    onDisconnect: () => {
      setIsListening(false);
    },
    onError: (error) => {
      console.error("STT error:", error);
      setIsListening(false);
    },
  });

  useEffect(() => {
    return () => {
      if (scribe.isConnected) {
        scribe.disconnect();
      }
    };
  }, [scribe]);

  const startListening = useCallback(async () => {
    try {
      if (scribe.isConnected) return;

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

      if (!tokenResp.ok) {
        throw new Error("Gagal mendapatkan token STT");
      }

      const { token } = await tokenResp.json();
      if (!token) throw new Error("Token STT kosong");

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      console.error("Start listening error:", e);
      setIsListening(false);
    }
  }, [scribe]);

  const stopListening = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }

    setIsListening(false);

    const finalText = scribeFinalTextRef.current.trim();
    if (finalText) {
      scribeFinalTextRef.current = "";
      setLiveTranscript("");
      void sendMessageRef.current(finalText);
    } else {
      setLiveTranscript("");
    }
  }, [scribe]);

  return {
    messages, isLoading, isSpeaking, isListening, liveTranscript,
    voiceEnabled, setVoiceEnabled, sendMessage, startListening, stopListening,
  };
}
