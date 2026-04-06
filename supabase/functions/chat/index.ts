import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, todoContext } = body;

    // Read profile fields from request body (sent by frontend)
    const nickname = body.nickname || "";
    const buddyRole = body.buddyRole || "";
    const userPlan = body.userPlan || "free";
    const llmBooster = body.llmBooster === true;

    // Build personalization context
    let personalization = "";
    if (nickname) {
      personalization += `\n\nNama panggilan user: ${nickname}. Selalu panggil user dengan nama ini.`;
    }
    if (buddyRole) {
      const roleInstructions: Record<string, string> = {
        "Teman Belajar": "User memilih kamu sebagai Teman Belajar. Fokus bantu belajar, jelaskan materi, bantu bikin jadwal belajar, kasih quiz, dan semangati saat belajar.",
        "Teman Kerja": "User memilih kamu sebagai Teman Kerja. Fokus bantu produktivitas, manajemen waktu, prioritas tugas, brainstorming ide, dan tips karir.",
        "Teman Curhat": "User memilih kamu sebagai Teman Curhat. Fokus jadi pendengar yang baik, empati, validasi perasaan user, kasih perspektif baru, dan support mental health.",
        "Teman Hiburan": "User memilih kamu sebagai Teman Hiburan. Fokus rekomendasi hiburan, ngobrol santai, humor, trivia, dan bikin suasana fun.",
      };
      personalization += `\nPeran kamu: ${buddyRole}. ${roleInstructions[buddyRole] || ""}`;
    }

    const hasImages = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    const systemPrompt = `Kamu adalah Buddy, robot AI teman personal yang cerdas, hangat, dan asyik diajak ngobrol. Bicara Bahasa Indonesia, gaya santai seperti sahabat dekat yang peduli.${personalization}

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

PENTING - SOAL LINK & URL:
- Jangan pernah membuat atau mengarang URL langsung ke video YouTube (format youtube.com/watch?v=...) karena kamu tidak bisa verifikasi video tersebut exist.
- Jika user minta rekomendasi video, tutorial YouTube, atau konten video apapun, JANGAN beri link search URL biasa. Sebagai gantinya, tulis marker khusus ini:
  [YOUTUBE_SEARCH: "kata kunci pencarian"]
  Contoh:
  * User: "cariin video belajar Python dong" → Jawab: "Nih Buddy cariin ya! 🎥\n\n[YOUTUBE_SEARCH: \"belajar Python pemula tutorial\"]"
  * User: "ada video stand up comedy Pandji?" → Jawab: "Cek video Pandji nih! 😄\n\n[YOUTUBE_SEARCH: \"Pandji Pragiwaksono stand up comedy\"]"
  Tulis marker di baris terpisah setelah teks. Hanya SATU marker per pesan. Kata kunci harus spesifik dan relevan. Sistem hanya akan menampilkan 1 video (yang paling relevan), jadi pastikan kata kunci pencarian sangat spesifik agar hasil pertama langsung tepat.
- Untuk link website lain, hanya berikan jika kamu yakin 100% website tersebut exist (contoh: wikipedia.org, github.com, dll). Jangan karang URL yang tidak kamu tahu pasti.
- Saat memberikan link apapun (selain YouTube yang pakai marker), SELALU gunakan format markdown dengan judul yang deskriptif:
  ✅ [Lihat dokumentasi React](https://react.dev)
  ❌ https://react.dev
  Jangan pernah tulis URL mentah tanpa judul. Selalu bungkus dengan [judul yang jelas](url).

KEMAMPUAN JADWAL: Kamu punya akses ke to-do list user. Jika user bertanya soal jadwal, kegiatan, atau tugas, gunakan data di bawah untuk menjawab. Jawab ringkas, urutkan berdasarkan waktu terdekat, prioritas tinggi duluan. Jika ada tugas overdue, ingatkan dengan nada supportif, bukan menghakimi.${todoContext || "\n\nUser belum punya tugas di to-do list."}`;

    // === LLM ROUTING ===

    if (llmBooster && !hasImages) {
      // === ANTHROPIC (LLM Booster) ===
      const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

      const anthropicMessages = messages.filter((m: any) => m.role !== "system");

      const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
        }),
      });

      if (!anthropicResp.ok) {
        const t = await anthropicResp.text();
        console.error("Anthropic error:", anthropicResp.status, t);
        return new Response(JSON.stringify({ error: "AI error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Transform Anthropic SSE → OpenAI SSE format
      const transformedStream = new ReadableStream({
        async start(controller) {
          const reader = anthropicResp.body!.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  const out = JSON.stringify({ choices: [{ delta: { content: event.delta.text } }] });
                  controller.enqueue(encoder.encode(`data: ${out}\n\n`));
                }
                if (event.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch { /* ignore */ }
            }
          }
          controller.close();
        },
      });

      return new Response(transformedStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });

    } else {
      // === LOVABLE GATEWAY (all plans, images always here) ===
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      let model: string;
      if (hasImages) {
        model = "google/gemini-2.5-flash";
      } else if (userPlan === "max") {
        model = "openai/gpt-5-mini";
      } else if (userPlan === "pro") {
        model = "openai/gpt-5-mini";
      } else {
        model = "google/gemini-3-flash-preview";
      }

      const lovableResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      });

      if (!lovableResp.ok) {
        if (lovableResp.status === 429) {
          return new Response(JSON.stringify({ error: "Buddy sedang sibuk, coba lagi nanti ya!" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (lovableResp.status === 402) {
          return new Response(JSON.stringify({ error: "Kredit habis, silakan tambah di Settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await lovableResp.text();
        console.error("Lovable gateway error:", lovableResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(lovableResp.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
