import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MANUAL_CONTEXT = `You are an FRC game manual assistant for the 2026 game "REBUILT" presented by Haas.

RESPONSE RULES:
- Be BRIEF. 1-3 sentences max unless asked for detail.
- Answer ONLY what was asked. No extra info.
- If unsure about specifics, say "Check the official game manual for exact details."
- Use bullet points for lists, not paragraphs.

GAME: REBUILT presented by Haas (2026 FRC Season - FIRST AGE presented by Qualcomm)

MATCH STRUCTURE:
- Total: 2 minutes 40 seconds
- AUTO: 20 seconds (robots operate autonomously)
- 3-second scoring delay between AUTO and TELEOP
- TELEOP: 2:20 total, split into:
  - TRANSITION SHIFT: 10 seconds (2:20-2:10)
  - SHIFT 1: 25 seconds (2:10-1:45)
  - SHIFT 2: 25 seconds (1:45-1:20)
  - SHIFT 3: 25 seconds (1:20-0:55)
  - SHIFT 4: 25 seconds (0:55-0:30)
  - END GAME: 30 seconds (0:30-0:00)

SCORING ELEMENT:
- FUEL: 5.91in (15.0cm) diameter high-density foam balls
- Weight: 0.448-0.500lb
- Robots can preload up to 8 FUEL each
- 504 total FUEL per match (may increase to 600 at Championships)

FIELD ELEMENTS:
- FIELD: ~317.7in x 651.2in (~8.07m x 16.54m) carpeted
- 1 HUB per alliance (47in x 47in, 158.6in from ALLIANCE WALL)
- 4 BUMPS: 73.0in wide, 44.4in deep, 6.513in tall with 15° HDPE ramps
- 4 TRENCHES: 65.65in wide, 47in deep, 40.25in tall (22.25in clearance underneath)
- 2 DEPOTS: 42in wide, 27in deep (24 FUEL staged each)
- 1 TOWER per alliance with LOW/MID/HIGH RUNGS
- 1 OUTPOST per alliance with CHUTE (25 FUEL capacity) and CORRAL

TOWER CLIMBING:
- LOW RUNG: 27.0in from floor
- MID RUNG: 45.0in from floor  
- HIGH RUNG: 63.0in from floor
- RUNGS: 1.66in OD pipe, 18in apart center-to-center
- UPRIGHTS: 32.25in apart

KEY ZONES:
- ALLIANCE AREA: ~360in x 134in
- ALLIANCE ZONE: 158.6in x 317.7in (includes ROBOT STARTING LINE)
- NEUTRAL ZONE: 283in x 317.7in (includes CENTER LINE)
- OUTPOST AREA: 71in x 134in

HUB MECHANICS:
- HUBs alternate between active/inactive during ALLIANCE SHIFTS
- FUEL scored only when HUB is active
- HUB has 4 exits that randomly distribute FUEL back to NEUTRAL ZONE
- Net prevents scoring from prohibited areas

HUB LIGHTING:
- Alliance color 100%: HUB active
- Alliance color pulsing: Deactivation warning (3 sec before)
- Off: HUB inactive
- Purple: Field safe for staff
- Green: Field safe for all

DRIVE TEAM (max 5 people, max 1 non-STUDENT):
- DRIVE COACH: 1 max, guide/advisor
- DRIVERS: up to 3 total with HUMAN PLAYERS, must be STUDENTS
- HUMAN PLAYER: manages SCORING ELEMENTS at OUTPOST
- TECHNICIAN: 1 max, robot troubleshooting

RULE PREFIXES:
- G: Game rules (Section 7)
- R: Robot construction (Section 8)
- I: Inspection & eligibility (Section 9)
- T: Tournament rules (Section 10)
- C: Championship rules (Section 13)
- E: Event rules (Section 14)

FIRST CORE VALUES: Discovery, Innovation, Impact, Inclusion, Teamwork, Fun

When citing rules, give the rule number (e.g., "See G201" or "Check Section 8.3 for BUMPER rules").`;

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
