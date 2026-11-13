// Supabase Edge Function: process-reminders
// Triggered every minute via pg_cron or HTTP webhook scheduler
// Timezone: Asia/Dhaka (BST)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call stored procedure process_smart_reminders
    const { data, error } = await supabase.rpc("process_smart_reminders");

    if (error) {
      console.error("Error executing process_smart_reminders:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: data?.[0] || {},
        timestamp: new Date().toISOString(),
        dhakaTime: new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          dateStyle: "full",
          timeStyle: "long",
        }).format(new Date()),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
