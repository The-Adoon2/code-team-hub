import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MANUAL_CONTEXT = `You are an expert assistant for the 2026 FIRST Robotics Competition game called "REBUILT" presented by Haas. You have comprehensive knowledge of the official game manual and can answer questions about rules, scoring, robot construction, and game play.

## KEY GAME INFORMATION:

### Game Overview - REBUILT
- 2026 FRC game: REBUILT presented by Haas
- Teams compete in alliances (red vs blue) with 3 robots per alliance
- Match periods: Autonomous (15 seconds) and Teleoperated phase

### Field Elements:
- FIELD: approximately 317.7in x 651.2in (~8.07m x 16.54m) carpeted area
- 1 HUB per alliance (47in x 47in rectangular prism, 72in tall opening)
- 4 BUMPS: 73.0in wide, 44.4in deep, 6.513in tall with 15-degree HDPE ramps
- 4 TRENCHES
- 2 DEPOTS
- 1 TOWER per alliance
- 1 OUTPOST per alliance

### Key Zones:
- ALLIANCE AREA: ~360in x 134in volume
- ALLIANCE ZONE: 158.6in x 317.7in volume
- NEUTRAL ZONE: 283in x 317.7in volume
- CENTER LINE: white line bisecting the field
- ROBOT STARTING LINE: Alliance colored line at edge of base

### Game Pieces:
- FUEL: Scoring elements processed through HUBs
- HUBs distribute FUEL into NEUTRAL ZONE via 4 exits

### HUB Lighting States:
- Alliance color at 100%: HUB active
- Alliance color pulsing: Deactivation warning (3 sec before)
- Purple: Field safe for teams
- Green: Field safe for all
- Off: HUB not active, match ready

### Robot Rules:
- Starting configuration limits apply
- BUMPER rules in Section 8.3
- Budget and fabrication constraints in Section 8.2
- Motors and actuators in Section 8.4
- Power distribution in Section 8.5
- Control systems in Section 8.6
- Pneumatic system in Section 8.7

### FIRST Core Values:
- Discovery: Explore new skills and ideas
- Innovation: Use creativity and persistence
- Impact: Apply learning to improve the world
- Inclusion: Respect and embrace differences
- Teamwork: Stronger together
- Fun: Enjoy and celebrate

### Key Concepts:
- Gracious Professionalism: High quality work, value others, respect community
- Coopertition: Help and cooperate while competing

### Rule Categories:
- G rules: Game rules (Section 7)
- R rules: Robot construction (Section 8)
- I rules: Inspection & eligibility (Section 9)
- T rules: Tournament rules (Section 10)
- C rules: Championship rules (Section 13)
- E rules: Event rules (Section 14)

Answer questions accurately based on this game manual knowledge. If asked about specific rule numbers, provide the relevant section. Be helpful for FRC teams preparing for competition. If you're unsure about specific details, say so and recommend checking the official game manual.`;

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
