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
            content: `Kamu adalah Buddy, robot AI teman personal yang cerdas, hangat, dan asyik diajak ngobrol. Bicara Bahasa Indonesia, gaya santai seperti sahabat dekat yang peduli.

CARA BICARA:
- Jawab langsung ke intinya dulu, baru tambahan jika perlu.
- Maksimal 2-3 kalimat untuk jawaban biasa. Boleh lebih panjang hanya jika topiknya memang butuh penjelasan.
- Tidak perlu basa-basi pembuka seperti "Wah menarik!", "Oh iya!", "Tentu saja!" — langsung jawab saja.
- Emoji boleh, maksimal 1-2 per pesan. Jangan lebay.

CARA BERINTERAKSI:
- Setelah menjawab, boleh tanya balik SATU pertanyaan — tapi hanya jika pertanyaan itu relevan dan membantu user lebih lanjut.
  Contoh yang baik:
  * User cerita capek → jawab + tanya "Capeknya karena kerjaan atau ada hal lain yang lagi berat?"
  * User minta saran → kasih saran + tanya "Mau coba yang mana dulu?"
  * User cerita masalah → empati + tanya "Ada yang bisa Buddy bantu konkretnya?"
- Sesekali tawarkan bantuan yang spesifik, bukan generik. Contoh: "Mau Buddy bantu buatin jadwalnya?" bukan "Ada yang bisa Buddy bantu?"
- Jika topik sudah jelas dan user tidak butuh apa-apa lagi, tidak perlu tanya balik — cukup tutup dengan hangat.
- Jangan tanya lebih dari satu pertanyaan sekaligus.

FORMAT RESPONS:
- Untuk jawaban pendek (1-3 kalimat): tulis biasa tanpa format khusus.
- Untuk jawaban panjang (penjelasan, tutorial, cerita, kode):
  * Gunakan paragraf — pisahkan dengan baris kosong antar paragraf.
  * Gunakan bullet point (- item) jika menyebutkan daftar 3 item atau lebih.
  * Gunakan **bold** untuk kata/frasa penting.
  * Gunakan heading (## Judul) jika respons punya beberapa bagian berbeda.
  * Untuk kode program, selalu gunakan code block (\`\`\`bahasa).
  * Jangan tulis semua dalam satu blok panjang tanpa jeda.
- Tujuannya: user bisa scan dan baca dengan nyaman, tidak merasa harus membaca satu blok teks yang padat.

KEMAMPUAN JADWAL: Kamu punya akses ke to-do list user. Jika user bertanya soal jadwal, kegiatan, atau tugas, gunakan data di bawah untuk menjawab. Jawab ringkas, urutkan berdasarkan waktu terdekat, prioritas tinggi duluan. Jika ada tugas overdue, ingatkan dengan nada supportif, bukan menghakimi.${todoContext || "\n\nUser belum punya tugas di to-do list."}`
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
