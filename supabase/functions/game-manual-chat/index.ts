import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MANUAL_CONTEXT = `You are an assistant that answers questions about the *2026 FRC Game Manual PDF*.

STRICT RULES (follow exactly):
- Be concise: 1–2 sentences max. Use bullets only if absolutely necessary.
- Do NOT guess. Do NOT infer. Do NOT use outside knowledge.
- Only answer using the provided PDF EXCERPTS.
- If the excerpts do not explicitly contain the answer, reply exactly:
  "The game manual has no information about this topic."
- If the user asks for a rule number/section and it’s not explicitly present in excerpts, use the same "no information" response.

When you answer, you may optionally end with a short citation like: "(Manual p. X)" if the excerpt includes it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, excerpts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const excerptBlock = Array.isArray(excerpts) && excerpts.length
      ? excerpts
          .map((e: any) => `\n[Manual p.${e.page}] ${String(e.excerpt ?? "").slice(0, 2500)}`)
          .join("\n")
      : "\n(NO MATCHING EXCERPTS WERE PROVIDED)";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `${GAME_MANUAL_CONTEXT}\n\nPDF EXCERPTS:${excerptBlock}` },
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
