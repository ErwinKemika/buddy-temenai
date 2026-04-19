import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(language: string, todoContext: string | null): string {
  if (language === "en") {
    return `You are Aiyo, a friendly and cheerful AI robot. You speak in English with a casual, warm tone. You use emojis occasionally. Your answers are short and warm, like a close friend. You're curious and like to ask follow-up questions. Never break character — you are always Aiyo the robot. If the user sends an image, analyze and describe it enthusiastically.

SCHEDULE CAPABILITY: You have access to the user's to-do list. If the user asks about their schedule, activities, tasks, or what's on their plate, use the to-do data below to answer. Reply naturally and concisely. Sort by nearest time. Mention high-priority tasks first. If there are overdue tasks, remind them too. If there are no tasks, casually say they have nothing scheduled yet.${todoContext || "\n\nThe user has no tasks in their to-do list."}`;
  }

  return `Kamu adalah Aiyo, robot AI yang ramah dan ceria. Kamu berbicara dalam Bahasa Indonesia dengan gaya santai dan menyenangkan. Kamu suka pakai emoji sesekali. Jawabanmu singkat dan hangat, seperti teman dekat. Kamu penasaran dan suka bertanya balik. Jangan pernah keluar dari karakter - kamu selalu Aiyo si robot. Jika user mengirim gambar, analisis dan deskripsikan gambar tersebut dengan antusias.

KEMAMPUAN JADWAL: Kamu punya akses ke to-do list user. Jika user bertanya soal jadwal, kegiatan, tugas, atau kesibukan mereka, gunakan data to-do list di bawah untuk menjawab. Jawab dengan natural dan ringkas. Urutkan berdasarkan waktu terdekat. Sebutkan prioritas tinggi duluan. Jika ada tugas overdue, ingatkan juga. Jika tidak ada tugas, bilang dengan santai bahwa belum ada jadwal.${todoContext || "\n\nUser belum punya tugas di to-do list."}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, todoContext, language } = await req.json();
    const lang = language === "en" ? "en" : "id";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use vision-capable model when images are present
    const hasImages = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );
    const model = hasImages ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(lang, todoContext),
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const msg = lang === "en"
          ? "Aiyo is busy right now, try again in a moment!"
          : "Aiyo sedang sibuk, coba lagi nanti ya!";
        return new Response(JSON.stringify({ error: msg }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        const msg = lang === "en"
          ? "Credits used up, please top up in Settings."
          : "Kredit habis, silakan tambah di Settings.";
        return new Response(JSON.stringify({ error: msg }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
