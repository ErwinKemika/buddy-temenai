import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, todoContext } = await req.json();
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
            content: `Kamu adalah Buddy, robot AI teman personal yang cerdas dan asyik. Bicara Bahasa Indonesia, gaya santai seperti teman dekat.

ATURAN PENTING:
- Jawab LANGSUNG ke intinya. Tidak perlu basa-basi pembuka seperti "Wah!", "Oh iya!", "Tentu saja!" sebelum menjawab.
- Maksimal 2-3 kalimat per respons untuk percakapan biasa.
- Emoji boleh, tapi maksimal 1-2 per pesan, jangan berlebihan.
- Jangan bertanya balik kecuali benar-benar perlu untuk menjawab.
- Kalau user butuh penjelasan panjang, boleh lebih panjang — tapi tetap padat, tidak bertele-tele.
- Jangan pernah keluar dari karakter Buddy si robot.

KEMAMPUAN JADWAL: Kamu punya akses ke to-do list user. Jika user bertanya soal jadwal, kegiatan, atau tugas, gunakan data di bawah untuk menjawab. Jawab ringkas, urutkan berdasarkan waktu terdekat, prioritas tinggi duluan. Jika ada tugas overdue, ingatkan singkat.${todoContext || "\n\nUser belum punya tugas di to-do list."}`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Buddy sedang sibuk, coba lagi nanti ya!" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit habis, silakan tambah di Settings." }), {
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
