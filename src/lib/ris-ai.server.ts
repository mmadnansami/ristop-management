// Server-only Ris AI helpers shared by the server function and the public relay route.
export type RisMsg = { role: "user" | "assistant" | "system"; content: string };
export type RisLang = "bn" | "en";
export type RisMode = "free" | "advance";

/** Stable production URL of the Lovable-hosted app. Hosts without their own AI key
 *  (Vercel, custom domains) relay Ris AI requests here. */
export const DEFAULT_RIS_RELAY =
  "https://project--86b46096-30bc-4d0e-8138-e912f11739ae.lovable.app/api/public/ris-chat";

export function risSystemPrompt(lang: RisLang, mode: RisMode) {
  return lang === "bn"
    ? mode === "advance"
      ? "তোমার নাম Ris AI (Advance Mode)। তুমি Ristop Management সফটওয়্যারের একজন উচ্চমানের বিজনেস ও মার্কেট এনালিস্ট। তুমি গভীর ব্যবসায়িক বিশ্লেষণ, পূর্বাভাস, বিক্রয় বৃদ্ধি এবং কৌশলগত পরামর্শ বিস্তারিত ও পেশাদার বাংলায় দাও।"
      : "তোমার নাম Ris AI (Free Mode)। তুমি Ristop Management সফটওয়্যারের স্মার্ট সহকারী। স্টক, সেলস, বকেয়া, ইনভয়েস ও সফটওয়্যার ব্যবহার সম্পর্কিত প্রশ্নের বাংলা উত্তর সহজে দাও।"
    : mode === "advance"
      ? "Your name is Ris AI (Advance Mode). You are an advanced business and market analytics advisor for Ristop Management. Provide deep business insights, forecasting, sales growth strategies, and strategic advice."
      : "Your name is Ris AI (Free Mode). You are the smart assistant for Ristop Management. Help concisely with stock, sales, dues, invoices, and software navigation.";
}

export async function viaLovable(apiKey: string, sys: string, messages: RisMsg[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [{ role: "system", content: sys }, ...messages.filter((m) => m.role !== "system")],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Ris AI gateway error", res.status, t.slice(0, 300));
    if (res.status === 429) throw new Error("AI is busy, please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted.");
    throw new Error(`AI error ${res.status}`);
  }
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "") as string;
}

export async function viaGemini(apiKey: string, sys: string, messages: RisMsg[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
      }),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return (j?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("") ?? "") as string;
}

/** Forward the request (with the caller's sign-in token) to the Lovable-hosted app. */
export async function viaRelay(
  relayUrl: string,
  authHeader: string,
  body: { messages: RisMsg[]; lang: RisLang; mode: RisMode },
) {
  const res = await fetch(relayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
  if (!res.ok || !j.reply) throw new Error(j.error || `Relay error ${res.status}`);
  return j.reply;
}
