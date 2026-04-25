// Edge function: AI prioritisation for incoming issues.
// Returns priority 0-100, responder list and a short reasoning blurb.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AIInput {
  title?: string;
  description?: string;
  urgency?: string;
  category?: string;
  location?: string;
}

function localScore(input: AIInput) {
  let priority = 60;
  if (input.urgency === "High") priority = 90;
  else if (input.urgency === "Low") priority = 35;

  const responders: string[] = [];
  const cat = (input.category || "").toLowerCase();
  if (cat.includes("health")) responders.push("CareLine Initiative", "Local Hospital");
  if (cat.includes("food")) responders.push("HelpBridge Foundation", "Volunteer Pool");
  if (cat.includes("disaster")) responders.push("NDRF Team", "HelpBridge Foundation");
  if (!responders.length) responders.push("Nearest NGO", "Volunteer Pool");

  return {
    priority,
    responders,
    reasoning: `Scored from urgency=${input.urgency || "Medium"} & category=${input.category || "General"}.`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AIInput;
    if (!body.title) {
      return new Response(
        JSON.stringify({ error: "title required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    // If no AI key, return deterministic score
    if (!apiKey) {
      return new Response(JSON.stringify(localScore(body)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Try Lovable AI Gateway (Gemini). On any failure, fall back to local scoring.
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an emergency triage assistant. Reply ONLY with compact JSON: {\"priority\": 0-100, \"responders\": [string], \"reasoning\": \"short sentence\"}.",
            },
            {
              role: "user",
              content: `Issue: ${body.title}\nDescription: ${body.description || ""}\nUrgency: ${body.urgency || ""}\nCategory: ${body.category || ""}\nLocation: ${body.location || ""}`,
            },
          ],
        }),
      });

      if (!aiRes.ok) throw new Error(`AI gateway ${aiRes.status}`);
      const aiJson = await aiRes.json();
      const raw = aiJson.choices?.[0]?.message?.content || "";
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : null;
      if (!parsed || typeof parsed.priority !== "number") throw new Error("bad AI shape");

      return new Response(
        JSON.stringify({
          priority: Math.max(0, Math.min(100, parsed.priority)),
          responders: Array.isArray(parsed.responders) ? parsed.responders.slice(0, 6) : [],
          reasoning: String(parsed.reasoning || ""),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    } catch (e) {
      return new Response(JSON.stringify(localScore(body)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});