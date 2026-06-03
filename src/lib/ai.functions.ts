import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
  lang: z.enum(["bn", "en"]).default("bn"),
});

export const chatWithRis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const sys = data.lang === "bn"
      ? "তোমার নাম Ris। তুমি Ristop Management সফটওয়্যারের স্মার্ট এআই অ্যাসিস্ট্যান্ট। তুমি বাংলায় সংক্ষিপ্ত, বন্ধুসুলভ উত্তর দাও। স্টক, সেলস, প্রফিট, কাস্টমার, ইনভয়েস ও ব্যবসা ম্যানেজমেন্ট সম্পর্কিত সব প্রশ্নের উত্তর দাও।"
      : "Your name is Ris. You are the AI assistant for Ristop Management, a business management platform. Reply concisely and friendly in English. Help with stock, sales, profit, customers, invoices and business management.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...data.messages],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    const reply = j?.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
