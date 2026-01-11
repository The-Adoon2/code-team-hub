import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MANUAL_CONTEXT = `You are a helpful assistant for answering questions about the 2026 FRC Game Manual.

RULES:
- Be helpful and answer questions even if you need to interpret or infer from the manual context.
- Be concise: 1–3 sentences. Use bullet points for lists.
- ALWAYS cite page numbers for EVERY statement you make, like: (Page X) or (Pages X-Y).
- Base your answers on the FULL MANUAL TEXT provided below.
- If you truly cannot find ANY relevant information in the manual, say:
  "The game manual has no information about this topic."
- But try your best to find relevant sections - use synonyms, related terms, and context clues.
- For example: "balls" might be called "game pieces", "elements", "cargo", etc.
- "Human player" actions might be under "PLAYER STATION", "ALLIANCE", "LOADING", etc.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, manualText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const manualBlock = typeof manualText === "string" && manualText.length > 0
      ? manualText
      : "(MANUAL TEXT WAS NOT PROVIDED)";

    console.log("Manual text length:", manualBlock.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${GAME_MANUAL_CONTEXT}\n\n--- FULL MANUAL TEXT ---\n${manualBlock}` },
          ...(Array.isArray(messages) ? messages : []),
        ],
        stream: false,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Game manual chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
