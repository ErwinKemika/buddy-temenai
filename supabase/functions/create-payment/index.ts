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
    const { plan, user_id, email, name } = await req.json();

    if (!plan || !user_id || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: plan, user_id, email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (plan !== "pro" && plan !== "max") {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be 'pro' or 'max'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = plan === "pro" ? 29000 : 49000;
    const planLabel = plan === "pro" ? "Pro" : "Max";
    const timestamp = Date.now();
    const externalId = `buddy-${plan}-${user_id}-${timestamp}`;

    const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");
    if (!XENDIT_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://buddy-temenai.lovable.app";

    const authToken = btoa(`${XENDIT_SECRET_KEY}:`);

    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
        amount,
        payer_email: email,
        description: `Buddy ${planLabel} - 1 Bulan`,
        currency: "IDR",
        invoice_duration: 86400,
        success_redirect_url: `${siteUrl}/upgrade?status=success`,
        failure_redirect_url: `${siteUrl}/upgrade?status=failed`,
      }),
    });

    const xenditData = await xenditResponse.json();

    if (!xenditResponse.ok) {
      console.error("Xendit API error:", xenditData);
      return new Response(
        JSON.stringify({ error: "Failed to create invoice", details: xenditData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        invoice_url: xenditData.invoice_url,
        invoice_id: xenditData.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
