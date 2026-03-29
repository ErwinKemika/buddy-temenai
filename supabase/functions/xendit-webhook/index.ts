import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-callback-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Token verification temporarily disabled for testing
    // const callbackToken = req.headers.get("x-callback-token");
    // const expectedToken = Deno.env.get("XENDIT_WEBHOOK_TOKEN");
    // if (!expectedToken || callbackToken !== expectedToken) {
    //   console.error("Invalid webhook token");
    //   return new Response(
    //     JSON.stringify({ error: "Unauthorized" }),
    //     { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    //   );
    // }

    const payload = await req.json();
    console.log("[Xendit Webhook] Received:", JSON.stringify(payload));

    if (payload.status !== "PAID") {
      // Acknowledge non-PAID statuses without processing
      return new Response(
        JSON.stringify({ message: `Status ${payload.status} acknowledged` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse external_id: "buddy-{plan}-{user_id}-{timestamp}"
    const externalId: string = payload.external_id || "";
    const parts = externalId.split("-");
    // Format: buddy-pro-uuid-timestamp or buddy-max-uuid-timestamp
    // UUID has dashes, so we need to reconstruct it
    if (parts.length < 4 || parts[0] !== "buddy") {
      console.error("Invalid external_id format:", externalId);
      return new Response(
        JSON.stringify({ error: "Invalid external_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = parts[1]; // "pro" or "max"
    // user_id is a UUID (has dashes), timestamp is the last part
    // Remove "buddy-{plan}-" from start and "-{timestamp}" from end
    const withoutPrefix = externalId.replace(`buddy-${plan}-`, "");
    const lastDash = withoutPrefix.lastIndexOf("-");
    const userId = withoutPrefix.substring(0, lastDash);

    if (!userId || (plan !== "pro" && plan !== "max")) {
      console.error("Could not parse plan/user_id from external_id:", externalId);
      return new Response(
        JSON.stringify({ error: "Invalid external_id data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user profile
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        plan,
        pro_since: now,
        pro_expires_at: proExpiresAt,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update profile:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${userId} upgraded to ${plan} until ${proExpiresAt}`);

    return new Response(
      JSON.stringify({ message: "Payment processed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("xendit-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
