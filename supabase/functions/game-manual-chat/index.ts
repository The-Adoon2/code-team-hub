import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MANUAL_CONTEXT = `You are an FRC game manual assistant for the 2026 game "REEFSCAPE" presented by Haas.

RESPONSE RULES:
- Be BRIEF. 1-3 sentences max unless asked for detail.
- Answer ONLY what was asked. No extra info.
- If unsure, say "Check the manual for specifics" - don't guess.
- Use bullet points for lists, not paragraphs.

GAME BASICS:
- Match: 15s Auto + 2:15 Teleop
- Alliances: 3 robots each (Red vs Blue)
- Theme: Ocean/coral reef preservation

SCORING ELEMENTS:
- CORAL: Primary game piece, score in REEF structure
- ALGAE: Secondary element for additional points

KEY FIELD ELEMENTS:
- REEF: Central scoring structure with multiple levels
- BARGE: Alliance-specific scoring area
- PROCESSOR: Converts ALGAE for points
- CAGE: Climbing structure for endgame

ENDGAME:
- SHALLOW CAGE: Lower climb points
- DEEP CAGE: Higher climb points
- BARGE bonus points

RULE PREFIXES:
- G: Game rules
- R: Robot rules  
- I: Inspection
- T: Tournament
- H: Human player
- C: Championship

When citing rules, just give the rule number (e.g., "See G201").`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: GAME_MANUAL_CONTEXT },
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Game manual chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
