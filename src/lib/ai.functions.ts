import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
  lang: z.enum(["bn", "en"]).default("bn"),
});

type Msg = { role: "user" | "assistant" | "system"; content: string };

async function viaLovable(apiKey: string, sys: string, messages: Msg[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [{ role: "system", content: sys }, ...messages],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "") as string;
}

/** Direct Google Gemini fallback so the assistant also works on Vercel /
 *  custom domains where only GEMINI_API_KEY is configured. */
async function viaGemini(apiKey: string, sys: string, messages: Msg[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      }),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return (j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "") as string;
}

export const chatWithRis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const sys = data.lang === "bn"
      ? "তোমার নাম Ris। তুমি Ristop Management সফটওয়্যারের স্মার্ট এআই অ্যাসিস্ট্যান্ট। তুমি বাংলায় সংক্ষিপ্ত, বন্ধুসুলভ উত্তর দাও। স্টক, সেলস, প্রফিট, কাস্টমার, ইনভয়েস ও ব্যবসা ম্যানেজমেন্ট সম্পর্কিত সব প্রশ্নের উত্তর দাও।"
      : "Your name is Ris. You are the AI assistant for Ristop Management, a business management platform. Reply concisely and friendly in English. Help with stock, sales, profit, customers, invoices and business management.";

    const messages = data.messages as Msg[];

    if (lovableKey) {
      try {
        return { reply: await viaLovable(lovableKey, sys, messages) };
      } catch (e) {
        if (!geminiKey) throw e;
      }
    }
    if (geminiKey) return { reply: await viaGemini(geminiKey, sys, messages) };

    throw new Error(
      data.lang === "bn"
        ? "AI কী কনফিগার করা নেই। হোস্টিং (Vercel) এনভায়রনমেন্টে LOVABLE_API_KEY অথবা GEMINI_API_KEY যোগ করুন।"
        : "AI key is not configured. Add LOVABLE_API_KEY or GEMINI_API_KEY to the hosting (Vercel) environment.",
    );
  });
