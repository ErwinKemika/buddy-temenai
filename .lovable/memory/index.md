User preferences: dark space theme, purple-blue accent, Orbitron + Poppins fonts, mobile-only app.
Robot is the central focus - no separate chat page, speech bubbles appear below robot.
Language: Bahasa Indonesia throughout the app.
AI backend: Lovable AI for chat, ElevenLabs for TTS + STT.
Voice flow: type/speak → AI text reply (streaming) → auto TTS playback via ElevenLabs edge function.
BuddyState: "idle" | "listening" | "thinking" | "speaking" — single state drives all UI.
ElevenLabs voice: Sarah (EXAVITQu4vr4xnSDxMaL), model: eleven_multilingual_v2.
STT: ElevenLabs Scribe v2 realtime via @elevenlabs/react useScribe hook.
