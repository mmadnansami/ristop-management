import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
  lang: z.enum(["bn", "en"]).default("bn"),
  mode: z.enum(["free", "advance"]).default("free"),
  isSubscribed: z.boolean().default(false),
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

function getFreeKnowledgeReply(userMsg: string, lang: "bn" | "en"): string {
  const msg = userMsg.toLowerCase();

  if (lang === "bn") {
    if (msg.includes("স্টক") || msg.includes("ইনভেন্টরি") || msg.includes("stock")) {
      return "Ristop-এ স্টক ম্যানেজ করতে Dashboard > Products এ যান। সেখানে নতুন প্রোডাক্ট যোগ, পরিমাণ আপডেট এবং লো-স্টক এলার্ট দেখতে পাবেন।";
    }
    if (msg.includes("বিক্রি") || msg.includes("সেল") || msg.includes("sales") || msg.includes("pos")) {
      return "বিক্রি বা POS রেজিস্টারের জন্য Dashboard > Sales এ যান। সেখানে দ্রুত বিলিং, কাস্টমার সিলেক্ট ও ইনভয়েস প্রিন্ট করতে পারবেন।";
    }
    if (msg.includes("বকেয়া") || msg.includes("due") || msg.includes("কাস্টমার")) {
      return "কাস্টমার বকেয়া হিসাব রাখতে Dashboard > Customers এ যান। সেখানে কাস্টমারের বকেয়া লিস্ট এবং পেমেন্ট রিসিভ করতে পারবেন।";
    }
    if (msg.includes("প্রাইস") || msg.includes("দাম") || msg.includes("সাবসক্রিপশন") || msg.includes("প্যাকেজ")) {
      return "Ristop-এর ফ্রি লেয়ারে Ris AI ফ্রি! এডভান্সড এআই ফিচার ও ক্লাউড ব্যাকআপ পেতে /subscribe পেইজে গিয়ে যেকোনো প্রিমিয়াম প্যাকেজ বেছে নিতে পারেন।";
    }
    return "আমি Ris AI (Free Mode)। Ristop Management সফটওয়্যার নেভিগেশন, সেলস, ইনভেন্টরি, বকেয়া এবং সাধারণ ব্যবহারবিধি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন। গভীর মার্কেট ও বিজনেস অ্যানালাইসিসের জন্য Advance Mode নির্বাচন করুন।";
  } else {
    if (msg.includes("stock") || msg.includes("inventory")) {
      return "To manage stock in Ristop, go to Dashboard > Products. You can add items, update quantities, and view low-stock alerts.";
    }
    if (msg.includes("sale") || msg.includes("pos") || msg.includes("invoice")) {
      return "For billing and sales, go to Dashboard > Sales to quickly generate invoices and select customers.";
    }
    if (msg.includes("due") || msg.includes("customer")) {
      return "To manage customer dues, visit Dashboard > Customers where you can view balances and process payments.";
    }
    if (msg.includes("price") || msg.includes("package") || msg.includes("subscription")) {
      return "Ris AI Free layer is always free! For Advanced AI analytics and full features, check our subscription plans at /subscribe.";
    }
    return "I am Ris AI (Free Mode). You can ask me about software navigation, sales, inventory, and general system guidance. For deep AI market & business analysis, switch to Advance Mode!";
  }
}

export const chatWithRis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { mode, isSubscribed, lang } = data;

    // Check Advance Mode requirement
    if (mode === "advance" && !isSubscribed) {
      return {
        reply: lang === "bn"
          ? "Ris AI Advance Mode ব্যবহার করার জন্য সক্রিয় প্রিমিয়াম সাবসক্রিপশন প্রয়োজন। প্রিমিয়াম প্ল্যান দেখতে /subscribe ভিজিট করুন।"
          : "Active premium subscription is required for Ris AI Advance Mode. Please visit /subscribe to upgrade.",
      };
    }

    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const lastUserMsg = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const sys = lang === "bn"
      ? (mode === "advance"
          ? "তোমার নাম Ris AI (Advance Mode)। তুমি Ristop Management সফটওয়্যারের একজন উচ্চমানের বিজনেস ও মার্কেট এনালিস্ট। তুমি গভীর ব্যবসায়িক বিশ্লেষণ, পূর্বাভাস, বিক্রয় বৃদ্ধি এবং কৌশলগত পরামর্শ বিস্তারিত ও পেশাদার বাংলায় দাও।"
          : "তোমার নাম Ris AI (Free Mode)। তুমি Ristop Management সফটওয়্যারের স্মার্ট সহকারী। স্টক, সেলস, বকেয়া, ইনভয়েস ও সফটওয়্যার ব্যবহার সম্পর্কিত প্রশ্নের বাংলা উত্তর সহজে দাও।")
      : (mode === "advance"
          ? "Your name is Ris AI (Advance Mode). You are an advanced business and market analytics advisor for Ristop Management. Provide deep business insights, forecasting, sales growth strategies, and strategic advice."
          : "Your name is Ris AI (Free Mode). You are the smart assistant for Ristop Management. Help concisely with stock, sales, dues, invoices, and software navigation.");

    const messages = data.messages as Msg[];

    if (lovableKey) {
      try {
        return { reply: await viaLovable(lovableKey, sys, messages) };
      } catch (e) {
        if (!geminiKey && mode === "free") return { reply: getFreeKnowledgeReply(lastUserMsg, lang) };
        if (!geminiKey) throw e;
      }
    }

    if (geminiKey) {
      try {
        return { reply: await viaGemini(geminiKey, sys, messages) };
      } catch (e) {
        if (mode === "free") return { reply: getFreeKnowledgeReply(lastUserMsg, lang) };
        throw e;
      }
    }

    // Fallback if no API key is set in Free mode
    if (mode === "free") {
      return { reply: getFreeKnowledgeReply(lastUserMsg, lang) };
    }

    throw new Error(
      lang === "bn"
        ? "AI কী কনফিগার করা নেই। হোস্টিং (Vercel) এনভায়রনমেন্টে LOVABLE_API_KEY অথবা GEMINI_API_KEY যোগ করুন।"
        : "AI key is not configured. Add LOVABLE_API_KEY or GEMINI_API_KEY to the hosting (Vercel) environment.",
    );
  });
