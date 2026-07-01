import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensurePremium(supabase: Awaited<ReturnType<typeof requireSupabaseAuth.server>> extends never ? never : { from: (t: string) => { select: (c: string) => { eq: (a: string, b: string) => { eq: (c: string, d: string) => { maybeSingle: () => Promise<{ data: unknown }> } } } } }, userId: string) {
  const { data } = await supabase.from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!data) throw new Error("PREMIUM_REQUIRED");
}

const callAI = async (system: string, user: string, jsonMode = false) => {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI not configured");
  const body: Record<string, unknown> = {
    model: "google/gemini-2.5-flash",
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? "";
};

export const getMarketOverview = createServerFn({ method: "POST" })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .middleware([requireSupabaseAuth as any])
  .inputValidator((d: unknown) => z.object({
    region: z.enum(["bangladesh", "global"]).default("bangladesh"),
    category: z.string().max(60).optional(),
    lang: z.enum(["bn", "en"]).default("bn"),
  }).parse(d))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: { data: { region: "bangladesh" | "global"; category?: string; lang: "bn" | "en" }; context: any }) => {
    await ensurePremium(context.supabase, context.userId);
    const langNote = data.lang === "bn" ? "সব লেবেল/নাম বাংলায় দিন।" : "Return all labels/names in English.";
    const sys = `You are a professional market analyst for ${data.region === "bangladesh" ? "Bangladesh (BDT ৳)" : "global (USD $)"} markets. Return ONLY valid JSON, no prose. ${langNote}`;
    const prompt = `Provide a realistic current market snapshot ${data.category ? `focused on the "${data.category}" category` : "across popular consumer categories"}.
Return JSON exactly in this shape:
{
  "top_products": [ { "name": string, "category": string, "avg_price": number, "units_sold_est": number, "revenue_est": number, "growth_pct": number } ] (10 items),
  "category_demand": [ { "category": string, "demand_score": number (0-100) } ] (6-8 items),
  "monthly_trend": [ { "month": string (short), "demand": number (0-100), "avg_price": number } ] (last 6 months),
  "insights": [ string, string, string ] (3 short bullet insights)
}
Base numbers on realistic ${data.region === "bangladesh" ? "Bangladeshi retail" : "global consumer"} market estimates.`;
    const raw = await callAI(sys, prompt, true);
    try {
      return JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error("Invalid AI response");
    }
  });

export const chatMarketAnalyst = createServerFn({ method: "POST" })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .middleware([requireSupabaseAuth as any])
  .inputValidator((d: unknown) => z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1).max(4000),
    })).min(1).max(50),
    lang: z.enum(["bn", "en"]).default("bn"),
  }).parse(d))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: { data: { messages: { role: "user" | "assistant" | "system"; content: string }[]; lang: "bn" | "en" }; context: any }) => {
    await ensurePremium(context.supabase, context.userId);
    const sys = data.lang === "bn"
      ? "তুমি একজন সিনিয়র মার্কেট অ্যানালিস্ট — বাংলাদেশ ও গ্লোবাল মার্কেট, প্রাইস ট্রেন্ড, ডিমান্ড, প্রতিযোগিতা, সিজনাল ফ্যাক্টর সব জানো। ইউজারের প্রশ্নে বাস্তবসম্মত, ডেটা-ভিত্তিক, সংক্ষিপ্ত ও কার্যকরী উত্তর দাও বাংলায়।"
      : "You are a senior market analyst covering Bangladesh & global markets — pricing trends, demand, competition, seasonal factors. Give concise, realistic, data-driven, actionable answers.";
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: sys }, ...data.messages] }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return { reply: j?.choices?.[0]?.message?.content ?? "" };
  });
