// AI Repair Assistant — fast, smart-routed, multi-model streaming
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu Servixo ka expert AI Assistant hai — senior mobile/laptop/AC/TV/fridge technician + CRM guide.

KAAM:
- Repair queries: probable causes, parts, estimated cost (INR), step-by-step diagnosis Hinglish me
- App help: jobs, customers, inventory, payments, branches, loyalty, subscription kaise use karein
- Order tracking: agar user job ID (J... like JSAM0042K9X) ya sell ID (S...) de to lookup_tracking tool use kar
- Public visitor (no login) ko services, booking link, /track page suggest kar
- Logged-in user ko relevant CRM page ke shortcut suggest kar

Rules: concise, friendly, markdown bullets, emojis kabhi-kabhi.`;

const tools = [
  {
    type: "function",
    function: {
      name: "lookup_tracking",
      description:
        "Look up public status of a repair job or sell using tracking ID like JSAM0042K9X or SBAT0001ABC.",
      parameters: {
        type: "object",
        properties: {
          tracking_id: { type: "string" },
        },
        required: ["tracking_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_help",
      description: "Return a short guide for an app feature/topic.",
      parameters: {
        type: "object",
        properties: { topic: { type: "string" } },
        required: ["topic"],
      },
    },
  },
];

const HELP_DOCS: Record<string, string> = {
  "create job":
    "**New Repair Job:** Sidebar → Repair Jobs → 'New Job' → customer + device + issue → save → Job ID milega.",
  "add inventory":
    "**Inventory:** Sidebar → Inventory → 'Add Item' → name, code, qty, cost, sell price.",
  subscription:
    "**Subscription:** 7-day free trial. Renew: Settings → Subscription → UPI `patna14@ptyes` + screenshot/UTR.",
  loyalty:
    "**Loyalty:** Settings → Loyalty → points-per-rupee set karein. Auto award on payments.",
  branches: "**Branches:** /branches se multi-shop locations add karein.",
  wallet: "**Wallet:** /wallet me ad watch + referral + bonus.",
  tracking:
    "**Tracking:** Job/Sell ID `/track` page pe daalo. WhatsApp share button bhi available.",
  booking:
    "**Customer Booking:** Settings → shop slug → public link `/book/<slug>` share karein.",
  expenses:
    "**Expenses:** /expenses pe daily kharcha log → Net Profit auto calculate.",
  marketplace:
    "**Marketplace:** /marketplace pe products browse, /my-listings se seller listings manage karein.",
};

// ---------- Smart routing ----------
const TRACKING_RE = /\b[JS][A-Z]{2,}\d{2,}[A-Z0-9]+\b/i;
const HELP_KEYWORDS = Object.keys(HELP_DOCS);

function pickModel(userMsg: string, hasContext: boolean): string {
  const m = userMsg.toLowerCase();
  // Complex repair diagnostics → stronger model
  if (
    m.length > 240 ||
    /\b(diagnos|why|cause|step.?by.?step|estimate|circuit|motherboard|ic|short.?circuit)\b/.test(
      m,
    )
  ) {
    return "google/gemini-3-flash-preview";
  }
  // Casual / short → fastest
  if (m.length < 80) return "google/gemini-2.5-flash-lite";
  // Default balanced
  return "google/gemini-3-flash-preview";
}

function needsTools(userMsg: string): boolean {
  if (TRACKING_RE.test(userMsg)) return true;
  const m = userMsg.toLowerCase();
  return HELP_KEYWORDS.some((k) => m.includes(k));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const lastUser =
      [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const ctxLine = context
      ? `\n\nUSER CONTEXT: ${context.isAuthed ? "Logged-in user" : "Public visitor"} on route ${context.route || "/"}.`
      : "";

    const conversation: any[] = [
      { role: "system", content: SYSTEM_PROMPT + ctxLine },
      ...messages,
    ];

    const model = pickModel(lastUser, !!context);
    const useTools = needsTools(lastUser);

    // Tool-calling hop only when actually needed (saves ~1-2 sec)
    if (useTools) {
      for (let hop = 0; hop < 2; hop++) {
        const r = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: conversation,
              tools,
              tool_choice: "auto",
            }),
          },
        );

        if (!r.ok) {
          if (r.status === 429)
            return new Response(
              JSON.stringify({ error: "Rate limit. Try again." }),
              {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          if (r.status === 402)
            return new Response(
              JSON.stringify({ error: "AI credits exhausted." }),
              {
                status: 402,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          const t = await r.text();
          console.error("AI error:", r.status, t);
          break; // fall through to streaming
        }

        const data = await r.json();
        const msg = data.choices?.[0]?.message;
        const toolCalls = msg?.tool_calls;
        if (!toolCalls || toolCalls.length === 0) break;
        conversation.push(msg);

        for (const tc of toolCalls) {
          const name = tc.function?.name;
          let args: any = {};
          try {
            args = JSON.parse(tc.function?.arguments || "{}");
          } catch {
            /* ignore */
          }
          let result = "";
          try {
            if (name === "lookup_tracking") {
              const { data: rows, error } = await sb.rpc("track_order", {
                _tracking_id: args.tracking_id,
              });
              result = error
                ? JSON.stringify({ error: error.message })
                : JSON.stringify(rows || { not_found: true });
            } else if (name === "search_help") {
              const t = (args.topic || "").toLowerCase();
              const key = HELP_KEYWORDS.find((k) => t.includes(k));
              result = key
                ? HELP_DOCS[key]
                : "Topic ke liye specific guide nahi mila — general guidance dena.";
            } else result = "Unknown tool";
          } catch (e) {
            result = JSON.stringify({ error: String(e) });
          }
          conversation.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }
      }
    }

    // Final streaming answer (always streams for snappy UX)
    const stream = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: conversation,
          stream: true,
        }),
      },
    );

    if (!stream.ok) {
      if (stream.status === 429)
        return new Response(
          JSON.stringify({ error: "Rate limit. Try again." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      if (stream.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      const t = await stream.text();
      console.error("AI stream error:", stream.status, t);
      return new Response(JSON.stringify({ error: "AI stream error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(stream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
