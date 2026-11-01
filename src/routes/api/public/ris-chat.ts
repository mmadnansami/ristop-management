import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { risSystemPrompt, viaLovable } from "@/lib/ris-ai.server";

// Relay endpoint used by Vercel / custom-domain deployments that have no AI key.
// Callers must send a valid signed-in user token; advance access is checked here.
const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(50),
  lang: z.enum(["bn", "en"]).default("bn"),
  mode: z.enum(["free", "advance"]).default("free"),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  Response.json(b, { status, headers: { ...cors, "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/public/ris-chat")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const token = (request.headers.get("authorization") ?? "")
          .replace(/^Bearer\s+/i, "")
          .trim();
        if (!token) return json({ error: "Please sign in again" }, 401);

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request" }, 400);
        const { messages, lang, mode } = parsed.data;

        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (error || !userId)
          return json(
            { error: lang === "bn" ? "অনুগ্রহ করে আবার লগইন করুন" : "Please sign in again" },
            401,
          );

        if (mode === "advance") {
          const [{ data: subs }, { data: roles }] = await Promise.all([
            supabase
              .from("subscriptions")
              .select("id")
              .eq("user_id", userId)
              .eq("status", "active")
              .limit(1),
            supabase.from("user_roles").select("role").eq("user_id", userId),
          ]);
          const allowed = (subs ?? []).length > 0 || (roles ?? []).some((r) => r.role === "admin");
          if (!allowed) {
            return json({
              reply:
                lang === "bn"
                  ? "Ris AI Advance Mode ব্যবহার করার জন্য সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন। /subscribe ভিজিট করুন।"
                  : "An active premium subscription is required for Advance Mode. Visit /subscribe.",
            });
          }
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: "AI is not configured" }, 500);
        try {
          const reply = await viaLovable(apiKey, risSystemPrompt(lang, mode), messages);
          return json({ reply });
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "AI error" }, 502);
        }
      },
    },
  },
});
