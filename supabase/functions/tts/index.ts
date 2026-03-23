import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Log auth header presence
    const authHeader = req.headers.get("authorization");
    console.log("[TTS] Auth header present:", !!authHeader);
    console.log("[TTS] Method:", req.method);

    const { text, voiceId } = await req.json();
    console.log("[TTS] Text length:", text?.length, "voiceId:", voiceId);

    // Check ElevenLabs key
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    console.log("[TTS] ELEVENLABS_API_KEY exists:", !!ELEVENLABS_API_KEY);
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedVoice = voiceId || "SCDJ1Fy4al0KS1awS6H9";
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`;
    console.log("[TTS] Using voice_id:", selectedVoice);
    console.log("[TTS] Calling ElevenLabs:", ttsUrl);

    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    });

    console.log("[TTS] ElevenLabs response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[TTS] ElevenLabs error:", response.status, errText);
      // Return 502 (Bad Gateway) instead of forwarding ElevenLabs' status
      // This prevents confusing ElevenLabs 401 (quota) with Supabase 401 (auth)
      return new Response(JSON.stringify({ 
        error: `ElevenLabs API error`, 
        detail: errText,
        upstream_status: response.status 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("[TTS] ✅ Audio received, size:", audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (e) {
    console.error("[TTS] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
