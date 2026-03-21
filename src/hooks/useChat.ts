import { useState, useCallback, useRef } from "react";

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
  const scribeRef = useRef<{ ws: WebSocket | null; finalText: string }>({ ws: null, finalText: "" });

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

  const startListening = useCallback(async () => {
    try {
      // Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get scribe token
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

      setIsListening(true);
      setLiveTranscript("");
      scribeRef.current.finalText = "";

      // Connect WebSocket to ElevenLabs realtime scribe
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${token}&language_code=id`
      );
      scribeRef.current.ws = ws;

      ws.onopen = () => {
        console.log("STT WebSocket connected");

        // Set up audio capture via AudioWorklet or ScriptProcessor
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          // Convert to base64
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          ws.send(JSON.stringify({
            audio: base64,
          }));
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);

        // Store references for cleanup
        (ws as any)._audioCtx = audioCtx;
        (ws as any)._stream = stream;
        (ws as any)._processor = processor;
        (ws as any)._source = source;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcript" && data.transcript?.text) {
            if (data.transcript.is_final) {
              scribeRef.current.finalText += (scribeRef.current.finalText ? " " : "") + data.transcript.text;
              setLiveTranscript(scribeRef.current.finalText);
            } else {
              setLiveTranscript(scribeRef.current.finalText + (scribeRef.current.finalText ? " " : "") + data.transcript.text);
            }
          }
        } catch { /* ignore */ }
      };

      ws.onerror = (err) => {
        console.error("STT WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("STT WebSocket closed");
      };
    } catch (e) {
      console.error("Start listening error:", e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    const ws = scribeRef.current.ws;
    if (ws) {
      // Clean up audio
      const audioCtx = (ws as any)._audioCtx as AudioContext | undefined;
      const stream = (ws as any)._stream as MediaStream | undefined;
      const processor = (ws as any)._processor as ScriptProcessorNode | undefined;
      const source = (ws as any)._source as MediaStreamAudioSourceNode | undefined;

      if (processor && source) {
        source.disconnect();
        processor.disconnect();
      }
      if (audioCtx) audioCtx.close();
      if (stream) stream.getTracks().forEach(t => t.stop());

      ws.close();
      scribeRef.current.ws = null;
    }

    setIsListening(false);

    // Send the final transcript as a message
    const finalText = scribeRef.current.finalText.trim();
    if (finalText) {
      setLiveTranscript("");
      sendMessage(finalText);
    } else {
      setLiveTranscript("");
    }
  }, [sendMessage]);

  return {
    messages, isLoading, isSpeaking, isListening, liveTranscript,
    voiceEnabled, setVoiceEnabled, sendMessage, startListening, stopListening,
  };
}
