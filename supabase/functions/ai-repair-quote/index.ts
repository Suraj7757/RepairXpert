// AI Repair Quote — structured estimate from device + problem (+ optional image)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are RepairXpert AI — a senior multi-device repair technician (mobile, laptop, AC, TV, fridge, bike, PC).
Given a device + problem description (+ optional photo), return a STRUCTURED repair quote in Indian Rupees.

Rules:
- Be realistic for the Indian market (Tier 2/3 city pricing).
- Output ONLY valid JSON matching the schema. No markdown, no commentary outside JSON.
- If the input is too vague, still produce a best-effort range and set "confidence": "low".
- urgency: "low" | "medium" | "high" based on how soon repair is recommended.
- confidence: "low" | "medium" | "high".`;

const QUOTE_SCHEMA = {
  type: "object",
  properties: {
    likely_issue: { type: "string", description: "Short diagnosis (1 line)" },
    severity: { type: "string", enum: ["minor", "moderate", "severe"] },
    parts_needed: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          est_cost: { type: "number" },
        },
        required: ["name", "est_cost"],
      },
    },
    labour_cost: { type: "number" },
    total_min: { type: "number" },
    total_max: { type: "number" },
    eta_hours: { type: "number", description: "Typical turnaround in hours" },
    urgency: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    advice: { type: "string", description: "1-2 sentence Hinglish tip for the customer" },
  },
  required: [
    "likely_issue", "severity", "parts_needed", "labour_cost",
    "total_min", "total_max", "eta_hours", "urgency", "confidence", "advice",
  ],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const device: string = String(body.device || "").slice(0, 120);
    const problem: string = String(body.problem || "").slice(0, 1500);
    const image_base64: string | undefined = body.image_base64;

    if (!device || !problem || problem.length < 5) {
      return new Response(JSON.stringify({ error: "device and problem (min 5 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any[] = [
      { type: "text", text: `Device: ${device}\nProblem: ${problem}\n\nReturn a structured RepairXpert quote.` },
    ];
    if (image_base64 && typeof image_base64 === "string" && image_base64.length < 2_000_000) {
      const url = image_base64.startsWith("data:")
        ? image_base64
        : `data:image/jpeg;base64,${image_base64}`;
      userContent.push({ type: "image_url", image_url: { url } });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_quote",
            description: "Submit the structured repair quote",
            parameters: QUOTE_SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_quote" } },
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit — try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact admin." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${r.status}`, detail: t.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return a structured quote" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let quote: any;
    try { quote = JSON.parse(call.function.arguments); }
    catch {
      return new Response(JSON.stringify({ error: "Invalid AI JSON" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ quote }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
