import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Convert UTC to WIB (UTC+7)
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD in WIB
  const currentDow = now.getUTCDay(); // day of week in WIB
  const dowMap: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
  const todayDow = dowMap[currentDow];

  // Current time in HH:MM format (WIB)
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  try {
    // Fetch incomplete todos with user whatsapp numbers
    const { data: todos, error: todosErr } = await supabase
      .from('todos')
      .select('id, user_id, title, date, start_time, recurrence, status, done')
      .eq('done', false)
      .neq('status', 'done');

    if (todosErr) throw todosErr;
    if (!todos || todos.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending todos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter todos that are relevant for today
    const relevantTodos = todos.filter((t: any) => {
      const rec = t.recurrence || 'once';
      const todoDate = t.date;
      if (rec === 'once') return todoDate === todayStr || todoDate < todayStr;
      if (rec === 'daily') return todoDate <= todayStr;
      if (rec === 'weekly') return todoDate <= todayStr; // day-of-week check done below
      return false;
    });

    // Collect unique user_ids
    const userIds = [...new Set(relevantTodos.map((t: any) => t.user_id))];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No relevant todos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profiles with whatsapp numbers
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('user_id, whatsapp_number')
      .in('user_id', userIds)
      .not('whatsapp_number', 'is', null);

    if (profErr) throw profErr;

    const waMap = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
      if (p.whatsapp_number) waMap.set(p.user_id, p.whatsapp_number);
    });

    let sentCount = 0;

    for (const todo of relevantTodos) {
      const waNumber = waMap.get(todo.user_id);
      if (!waNumber) continue;

      // Weekly recurrence: check day of week matches original todo date
      if (todo.recurrence === 'weekly') {
        const origDate = new Date(todo.date + 'T00:00:00Z');
        const origDow = origDate.getUTCDay();
        if (origDow !== currentDow) continue;
      }

      const reminders: { type: string; message: string }[] = [];

      if (todo.start_time) {
        // Parse start_time "HH:MM:SS" or "HH:MM"
        const parts = todo.start_time.split(':');
        const startMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const diff = startMinutes - nowMinutes; // positive = future

        // EARLY: 1-5 minutes before
        if (diff >= 1 && diff <= 5) {
          reminders.push({
            type: 'early',
            message: `Halo, ${diff} menit lagi kamu ada tugas: ${todo.title}. Siap-siap ya! ⏰`,
          });
        }

        // EXACT: 0 to -1 minute (just started)
        if (diff <= 0 && diff >= -1) {
          reminders.push({
            type: 'exact',
            message: `Halo, sekarang waktunya ${todo.title}. Semangat ya! 💪`,
          });
        }
      } else {
        // No start_time, check overdue (date < today)
        if (todo.date < todayStr) {
          reminders.push({
            type: 'overdue',
            message: `Eh, kamu punya tugas yang belum selesai: ${todo.title}. Yuk dikerjain! 📝`,
          });
        }
      }

      for (const rem of reminders) {
        // Insert into reminder_logs, skip if already sent today
        const { data: logData, error: logErr } = await supabase
          .from('reminder_logs')
          .insert({
            todo_id: todo.id,
            reminder_type: rem.type,
            sent_date: todayStr,
          })
          .select('id')
          .single();

        if (logErr) {
          // Conflict = already sent, skip
          console.log(`[check-reminders] Skip duplicate: ${todo.id} ${rem.type}`);
          continue;
        }

        // Send WhatsApp
        try {
          const { error: waErr } = await supabase.functions.invoke('send-whatsapp', {
            body: { to: waNumber, message: rem.message },
          });
          if (waErr) {
            console.error(`[check-reminders] WA error for ${todo.id}:`, waErr);
          } else {
            sentCount++;
            console.log(`[check-reminders] Sent ${rem.type} for "${todo.title}" to ${waNumber}`);
          }
        } catch (e) {
          console.error(`[check-reminders] WA invoke error:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, checked: relevantTodos.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[check-reminders] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
