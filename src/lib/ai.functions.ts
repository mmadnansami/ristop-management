import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { DEFAULT_RIS_RELAY, risSystemPrompt, viaGemini, viaLovable, viaRelay, type RisMsg } from "./ris-ai.server";

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
  lang: z.enum(["bn", "en"]).default("bn"),
  mode: z.enum(["free", "advance"]).default("free"),
  isSubscribed: z.boolean().default(false),
});

export const chatWithRis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const { mode, isSubscribed, lang } = data;

    if (mode === "advance" && !isSubscribed) {
      return {
        reply: lang === "bn"
          ? "Ris AI Advance Mode ব্যবহার করার জন্য সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন। প্রিমিয়াম প্ল্যান দেখতে /subscribe ভিজিট করুন।"
          : "Active premium subscription is required for Ris AI Advance Mode. Please visit /subscribe to upgrade.",
      };
    }

    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const sys = risSystemPrompt(lang, mode);
    const messages = data.messages as RisMsg[];

    if (lovableKey) {
      try {
        return { reply: await viaLovable(lovableKey, sys, messages) };
      } catch (e) {
        if (!geminiKey) throw e;
      }
    }
    if (geminiKey) {
      return { reply: await viaGemini(geminiKey, sys, messages) };
    }

    // No AI key on this host (e.g. Vercel): relay to the Lovable-hosted app with the user's sign-in token.
    const auth = getRequest()?.headers.get("authorization");
    if (!auth) {
      throw new Error(lang === "bn" ? "অনুগ্রহ করে আবার লগইন করুন।" : "Please sign in again.");
    }
    const relayUrl = process.env.RIS_AI_RELAY_URL || DEFAULT_RIS_RELAY;
    const relayMessages = messages.filter((m) => m.role !== "system");
    try {
      return { reply: await viaRelay(relayUrl, auth, { messages: relayMessages, lang, mode }) };
    } catch (e) {
      console.error("Ris AI relay failed", e);
      throw new Error(lang === "bn" ? "Ris AI এখন সংযোগ করতে পারছে না, একটু পরে আবার চেষ্টা করুন।" : "Ris AI can't connect right now, please try again shortly.");
    }
  });
