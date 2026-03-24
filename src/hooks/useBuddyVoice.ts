import { useRef, useCallback, useState } from "react";

const VOICE_STORAGE_KEY = "buddy-voice-enabled";
const COOLDOWN_MS = 5000; // 5 second cooldown between speeches

export const useBuddyVoice = () => {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(VOICE_STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const lastSpokenRef = useRef<string>("");
  const lastSpokeAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem(VOICE_STORAGE_KEY, String(next));
      // Stop any playing audio when muting
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        isSpeakingRef.current = false;
      }
      return next;
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    // Guard: voice disabled
    if (!voiceEnabled) return;

    // Guard: same message
    if (text === lastSpokenRef.current) return;

    // Guard: cooldown
    const now = Date.now();
    if (now - lastSpokeAtRef.current < COOLDOWN_MS) return;

    // Guard: already speaking
    if (isSpeakingRef.current) {
      // Stop old audio first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      isSpeakingRef.current = false;
    }

    // Clean text (remove emojis for cleaner speech)
    const cleanText = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}✨🎉📝🔥💪]/gu, "").trim();
    if (!cleanText || cleanText.length < 3) return;

    lastSpokenRef.current = text;
    lastSpokeAtRef.current = now;
    isSpeakingRef.current = true;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          text: cleanText,
          voiceId: "SCDJ1Fy4al0KS1awS6H9",
        }),
      });

      if (!response.ok) {
        console.warn("[BuddyVoice] TTS failed:", response.status);
        isSpeakingRef.current = false;
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        isSpeakingRef.current = false;
        audioRef.current = null;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        isSpeakingRef.current = false;
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.warn("[BuddyVoice] Error:", err);
      isSpeakingRef.current = false;
    }
  }, [voiceEnabled]);

  return { voiceEnabled, toggleVoice, speak };
};
