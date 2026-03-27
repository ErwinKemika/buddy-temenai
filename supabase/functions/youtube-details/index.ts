import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY is not configured");
    }

    const { videoId } = await req.json();

    if (!videoId || typeof videoId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'videoId' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      part: "snippet",
      id: videoId,
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", response.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.error?.message || "YouTube API error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const item = data.items?.[0];
    if (!item) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const snippet = item.snippet;
    const result = {
      videoId: item.id,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      description: (snippet.description || "").slice(0, 300),
      thumbnail: snippet.thumbnails?.medium?.url,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-details error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
