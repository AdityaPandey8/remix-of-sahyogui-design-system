import { supabase } from "@/integrations/supabase/client";

export interface AIInput {
  title: string;
  description?: string;
  urgency?: "High" | "Medium" | "Low" | string;
  category?: string;
  location?: string;
}

export interface AIResult {
  priority: number;
  responders: string[];
  reasoning: string;
  source: "edge" | "local";
}

/** Deterministic local fallback if the edge function is unavailable. */
function localAI(input: AIInput): AIResult {
  if (!input.title) {
    return { priority: 0, responders: [], reasoning: "Missing title", source: "local" };
  }
  let priority = 60;
  if (input.urgency === "High") priority = 90;
  else if (input.urgency === "Low") priority = 35;

  const responders: string[] = [];
  if ((input.category || "").toLowerCase().includes("health")) responders.push("CareLine Initiative", "Local Hospital");
  if ((input.category || "").toLowerCase().includes("food")) responders.push("HelpBridge Foundation", "Volunteer Pool");
  if ((input.category || "").toLowerCase().includes("disaster")) responders.push("NDRF Team", "HelpBridge Foundation");
  if (!responders.length) responders.push("Nearest NGO", "Volunteer Pool");

  return {
    priority,
    responders,
    reasoning: `Auto-scored from urgency=${input.urgency || "Medium"} and category=${input.category || "General"}.`,
    source: "local",
  };
}

export async function runAI(input: AIInput): Promise<AIResult> {
  if (!input.title) return localAI(input);
  try {
    const { data, error } = await supabase.functions.invoke("run-ai", { body: input });
    if (error || !data) throw error ?? new Error("Empty AI response");
    return { ...(data as AIResult), source: "edge" };
  } catch (err) {
    console.warn("[ai-runtime] Edge function unavailable, using local fallback", err);
    return localAI(input);
  }
}