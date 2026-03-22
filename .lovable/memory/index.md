User preferences: dark space theme, purple-blue accent, Orbitron + Poppins fonts, mobile-only app.
Robot is the central focus - no separate chat page, speech bubbles appear below robot.
Language: Bahasa Indonesia throughout the app.
AI backend: Lovable AI for chat, ElevenLabs for TTS output only.
Voice INPUT (mic/STT) removed — app is text-only input for now.
TTS flow: AI text reply → auto TTS playback via ElevenLabs edge function (when voice toggle on).
BuddyState: "idle" | "thinking" | "speaking" — no more "listening" state.
ElevenLabs voice: Sarah (EXAVITQu4vr4xnSDxMaL), model: eleven_multilingual_v2.
Dark/Light mode toggle available in gear menu.
Chat features: WhatsApp-like attachments (image, document, camera, voice note).
Storage: chat-attachments bucket (public) for uploaded files.
Multimodal AI: images sent as base64 to Gemini for visual understanding.
Voice notes: recorded via MediaRecorder API (webm/opus), uploaded to storage.
