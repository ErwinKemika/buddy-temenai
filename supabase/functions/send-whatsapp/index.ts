import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const TWILIO_FROM = 'whatsapp:+14155238886';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const twilioApiKeys = [Deno.env.get('TWILIO_API_KEY'), Deno.env.get('TWILIO_API_KEY_1')].filter(
    (value): value is string => Boolean(value),
  );

  if (!twilioApiKeys.length) {
    return new Response(JSON.stringify({ error: 'TWILIO_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: 'Missing "to" or "message" field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    let lastError: string | null = null;

    for (const twilioApiKey of twilioApiKeys) {
      const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': twilioApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: whatsappTo,
          From: TWILIO_FROM,
          Body: message,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        return new Response(JSON.stringify({ success: true, sid: data.sid }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const details = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
      lastError = `Twilio API error [${response.status}]: ${details}`;

      if (response.status !== 401 || !String(details).toLowerCase().includes('credential not found')) {
        throw new Error(lastError);
      }
    }

    throw new Error(lastError ?? 'No valid Twilio credential found');

    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending WhatsApp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
