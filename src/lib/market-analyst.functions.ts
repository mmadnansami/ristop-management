import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDeploymentAuth } from "@/lib/deployment-auth-middleware";
import * as marketCore from "@/lib/market-analyst-core";

type Region = "bangladesh" | "global";
type Lang = "bn" | "en";

type SourceArticle = {
  title: string;
  url: string;
  source: string;
  published_at: string;
};

type MarketOverview = {
  generated_at: string;
  date_label: string;
  source_count: number;
  source_note: string;
  top_products: Array<{
    name: string;
    category: string;
    mentions: number;
    source_count: number;
    trend: "up" | "down" | "stable" | "unknown";
    confidence: "high" | "medium" | "low";
    summary: string;
    citations: string[];
  }>;
  category_demand: Array<{ category: string; demand_score: number; source_count: number }>;
  monthly_trend: Array<{ day: string; mention_count: number; source_count: number }>;
  insights: string[];
  sources: SourceArticle[];
};

async function ensurePremium(supabase: { from: (t: string) => { select: (c: string) => { eq: (a: string, b: string) => { eq: (c: string, d: string) => { maybeSingle: () => Promise<{ data: unknown }> } } } } }, userId: string) {
  const { data } = await supabase.from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!data) throw new Error("PREMIUM_REQUIRED");
}

const safeText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

const PRODUCT_KEYWORDS = [
  { name: "Rice", bn: "চাল", category: "Food staples", bnCategory: "খাদ্যপণ্য", terms: ["rice", "paddy", "beras", "চাল", "ধান"] },
  { name: "Onion", bn: "পেঁয়াজ", category: "Vegetables", bnCategory: "সবজি", terms: ["onion", "onions", "পেঁয়াজ"] },
  { name: "Potato", bn: "আলু", category: "Vegetables", bnCategory: "সবজি", terms: ["potato", "potatoes", "আলু"] },
  { name: "Egg", bn: "ডিম", category: "Protein", bnCategory: "প্রোটিন", terms: ["egg", "eggs", "ডিম"] },
  { name: "Chicken", bn: "মুরগি", category: "Protein", bnCategory: "প্রোটিন", terms: ["chicken", "broiler", "poultry", "মুরগি", "ব্রয়লার"] },
  { name: "Beef", bn: "গরুর মাংস", category: "Protein", bnCategory: "প্রোটিন", terms: ["beef", "cattle", "গরুর মাংস"] },
  { name: "Fish", bn: "মাছ", category: "Protein", bnCategory: "প্রোটিন", terms: ["fish", "hilsa", "seafood", "মাছ", "ইলিশ"] },
  { name: "Soybean Oil", bn: "সয়াবিন তেল", category: "Edible oil", bnCategory: "ভোজ্যতেল", terms: ["soybean oil", "edible oil", "cooking oil", "সয়াবিন", "ভোজ্যতেল"] },
  { name: "Sugar", bn: "চিনি", category: "Food staples", bnCategory: "খাদ্যপণ্য", terms: ["sugar", "চিনি"] },
  { name: "Wheat", bn: "গম", category: "Food staples", bnCategory: "খাদ্যপণ্য", terms: ["wheat", "flour", "atta", "গম", "আটা", "ময়দা"] },
  { name: "Lentil", bn: "ডাল", category: "Food staples", bnCategory: "খাদ্যপণ্য", terms: ["lentil", "pulse", "pulses", "dal", "ডাল"] },
  { name: "Cotton", bn: "তুলা", category: "Textile", bnCategory: "টেক্সটাইল", terms: ["cotton", "yarn", "তুলা", "সুতা"] },
  { name: "Garments", bn: "গার্মেন্টস", category: "Textile", bnCategory: "টেক্সটাইল", terms: ["garment", "apparel", "rmg", "গার্মেন্টস", "পোশাক"] },
  { name: "Fuel", bn: "জ্বালানি", category: "Energy", bnCategory: "জ্বালানি", terms: ["fuel", "diesel", "petrol", "gas", "oil price", "জ্বালানি", "ডিজেল", "গ্যাস"] },
];

function todayLabel(lang: Lang) {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    dateStyle: "full",
    timeZone: "Asia/Dhaka",
  }).format(new Date());
}

function sourceNote(lang: Lang, count: number, unavailable?: string) {
  if (unavailable) {
    return lang === "bn"
      ? "লাইভ পাবলিক সোর্স সাময়িকভাবে সীমিত/অনুপলব্ধ—তাই fake অনুমান দেখানো হচ্ছে না। কিছুক্ষণ পর রিফ্রেশ করুন।"
      : "Live public sources are temporarily limited/unavailable, so fake estimates are not shown. Refresh again shortly.";
  }
  return lang === "bn"
    ? `আজকের ${count}টি পাবলিক নিউজ/ওয়েব সোর্স যাচাই করে এই বিশ্লেষণ তৈরি হয়েছে।`
    : `Built from ${count} current public news/web sources.`;
}

function emptyOverview(lang: Lang, note?: string): MarketOverview {
  return {
    generated_at: new Date().toISOString(),
    date_label: todayLabel(lang),
    source_count: 0,
    source_note: note ?? sourceNote(lang, 0, "empty"),
    top_products: [],
    category_demand: [],
    monthly_trend: [],
    insights: [],
    sources: [],
  };
}

function buildMarketQuery(region: Region, category?: string, userQuestion?: string) {
  const regionPart = region === "bangladesh" ? "Bangladesh" : "global OR world OR international";
  const topic = safeText(category || userQuestion || "retail product commodity market price demand supply inflation").slice(0, 140);
  return `(${regionPart}) (${topic}) (price OR demand OR market OR retail OR commodity OR inflation OR supply OR shortage OR export OR import)`;
}

async function fetchMarketSources(region: Region, category?: string, userQuestion?: string, days = 1): Promise<{ articles: SourceArticle[]; note?: string }> {
  const params = new URLSearchParams({
    query: buildMarketQuery(region, category, userQuestion),
    mode: "artlist",
    format: "json",
    maxrecords: "50",
    sort: "datedesc",
    timespan: `${days}d`,
  });

  try {
    const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
      headers: { "User-Agent": "RestockAI-Market-Analyst/1.0" },
    });
    if (!res.ok) {
      const msg = await res.text();
      return { articles: [], note: `SOURCE_${res.status}_${msg.slice(0, 120)}` };
    }
    const json = await res.json() as { articles?: Array<Record<string, unknown>> };
    const articles = (json.articles ?? [])
      .map((a) => ({
        title: safeText(a.title),
        url: safeText(a.url),
        source: safeText(a.sourceCommonName || a.domain || a.sourceCountry || "source"),
        published_at: safeText(a.seendate || a.publishedDate || new Date().toISOString()),
      }))
      .filter((a) => a.title && a.url)
      .slice(0, 35);
    return { articles };
  } catch (error) {
    return { articles: [], note: error instanceof Error ? error.message : "SOURCE_FETCH_FAILED" };
  }
}

function dailyTrendFromSources(articles: SourceArticle[]) {
  const byDay = new Map<string, { mention_count: number; sources: Set<string> }>();
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dhaka" });
  articles.forEach((a) => {
    const parsed = Date.parse(a.published_at);
    const day = Number.isNaN(parsed) ? formatter.format(new Date()) : formatter.format(new Date(parsed));
    const item = byDay.get(day) ?? { mention_count: 0, sources: new Set<string>() };
    item.mention_count += 1;
    item.sources.add(a.source);
    byDay.set(day, item);
  });
  return Array.from(byDay.entries()).reverse().map(([day, item]) => ({
    day,
    mention_count: item.mention_count,
    source_count: item.sources.size,
  }));
}

const callAI = async (system: string, user: string, jsonMode = false) => {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return "";
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

function fallbackOverview(articles: SourceArticle[], lang: Lang, note?: string): MarketOverview {
  const matched = new Map<string, { category: string; titles: Set<string>; sources: Set<string> }>();
  for (const article of articles) {
    const haystack = `${article.title} ${article.source}`.toLowerCase();
    for (const item of PRODUCT_KEYWORDS) {
      if (!item.terms.some((term) => haystack.includes(term.toLowerCase()))) continue;
      const key = lang === "bn" ? item.bn : item.name;
      const current = matched.get(key) ?? {
        category: lang === "bn" ? item.bnCategory : item.category,
        titles: new Set<string>(),
        sources: new Set<string>(),
      };
      current.titles.add(article.title);
      current.sources.add(article.source);
      matched.set(key, current);
    }
  }

  const products = Array.from(matched.entries())
    .map(([name, item]) => ({ name, item }))
    .sort((a, b) => b.item.titles.size - a.item.titles.size)
    .slice(0, 10);

  const categories = new Map<string, { mentions: number; sources: Set<string> }>();
  for (const { item } of products) {
    const current = categories.get(item.category) ?? { mentions: 0, sources: new Set<string>() };
    current.mentions += item.titles.size;
    item.sources.forEach((source) => current.sources.add(source));
    categories.set(item.category, current);
  }

  const maxMentions = Math.max(1, ...Array.from(categories.values()).map((item) => item.mentions));

  return normalizeOverview({
    top_products: products.map(({ name, item }) => ({
      name,
      category: item.category,
      mentions: item.titles.size,
      source_count: item.sources.size,
      trend: "unknown" as const,
      confidence: item.sources.size > 2 ? "medium" as const : "low" as const,
      summary: lang === "bn"
        ? `যাচাই করা সোর্সে ${name} নিয়ে ${item.titles.size}টি রিপোর্ট/উল্লেখ পাওয়া গেছে; স্পষ্ট দাম/দিক না থাকলে ট্রেন্ড unknown রাখা হয়েছে।`
        : `${name} appears in ${item.titles.size} verified source mention(s); trend is kept unknown unless the source states a clear direction.`,
      citations: Array.from(item.titles).slice(0, 3),
    })),
    category_demand: Array.from(categories.entries()).map(([category, item]) => ({
      category,
      demand_score: Math.round((item.mentions / maxMentions) * 100),
      source_count: item.sources.size,
    })),
    insights: articles.slice(0, 3).map((article) => lang === "bn"
      ? `সোর্স রিপোর্ট: ${article.title} — ${article.source}`
      : `Source report: ${article.title} — ${article.source}`),
  }, articles, lang, note);
}

function normalizeOverview(value: Partial<MarketOverview>, articles: SourceArticle[], lang: Lang, note?: string): MarketOverview {
  return {
    generated_at: new Date().toISOString(),
    date_label: todayLabel(lang),
    source_count: articles.length,
    source_note: sourceNote(lang, articles.length, note),
    top_products: (value.top_products ?? []).slice(0, 10).map((p) => ({
      name: safeText(p.name) || (lang === "bn" ? "সোর্সে উল্লেখিত পণ্য" : "Source-mentioned product"),
      category: safeText(p.category) || (lang === "bn" ? "সাধারণ" : "General"),
      mentions: Number.isFinite(Number(p.mentions)) ? Number(p.mentions) : 1,
      source_count: Number.isFinite(Number(p.source_count)) ? Number(p.source_count) : 1,
      trend: ["up", "down", "stable", "unknown"].includes(String(p.trend)) ? p.trend as "up" | "down" | "stable" | "unknown" : "unknown",
      confidence: ["high", "medium", "low"].includes(String(p.confidence)) ? p.confidence as "high" | "medium" | "low" : "low",
      summary: safeText(p.summary),
      citations: Array.isArray(p.citations) ? p.citations.map(safeText).filter(Boolean).slice(0, 3) : [],
    })).filter((p) => p.summary || p.citations.length > 0),
    category_demand: (value.category_demand ?? []).slice(0, 8).map((c) => ({
      category: safeText(c.category),
      demand_score: Math.max(0, Math.min(100, Number(c.demand_score) || 0)),
      source_count: Number.isFinite(Number(c.source_count)) ? Number(c.source_count) : 1,
    })).filter((c) => c.category),
    monthly_trend: dailyTrendFromSources(articles),
    insights: (value.insights ?? []).map(safeText).filter(Boolean).slice(0, 3),
    sources: articles.slice(0, 12),
  };
}

export const getMarketOverview = createServerFn({ method: "POST" })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .middleware([requireDeploymentAuth as any])
  .inputValidator((d: unknown) => z.object({
    region: z.enum(["bangladesh", "global"]).default("bangladesh"),
    category: z.string().max(60).optional(),
    lang: z.enum(["bn", "en"]).default("bn"),
  }).parse(d))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: { data: { region: Region; category?: string; lang: Lang }; context: any }) => {
    await marketCore.ensurePremium(context.supabase, context.userId);
    const windowDays = data.region === "bangladesh" ? 7 : 10;
    const { articles, note } = await marketCore.fetchMarketSources(data.region, data.category, undefined, windowDays);
    if (articles.length === 0) return marketCore.emptyOverview(data.lang, marketCore.sourceNote(data.lang, 0, note));

    const langNote = data.lang === "bn" ? "সব লেবেল/নাম বাংলায় দিন।" : "Return all labels/names in English.";
    const sys = `You are a strict source-grounded market analyst. Return ONLY valid JSON, no prose. ${langNote} Never invent events, prices, festivals, demand, growth, or product names. Use ONLY the source list supplied by the app. If a claim is not clearly supported by the sources, omit it or mark trend as unknown.`;
    const prompt = `Today is ${marketCore.todayLabel(data.lang)} in Bangladesh time. Analyze the past ${windowDays} days of public sources for ${data.region === "bangladesh" ? "Bangladesh" : "global"} market movement ${data.category ? `focused on ${data.category}` : "across products"}. Aggregate trends across the window; do NOT invent daily numbers.

SOURCES:
${articles.map((a, i) => `${i + 1}. ${a.title} | ${a.source} | ${a.published_at} | ${a.url}`).join("\n")}

Return JSON exactly in this shape:
{
  "top_products": [ { "name": string, "category": string, "mentions": number, "source_count": number, "trend": "up"|"down"|"stable"|"unknown", "confidence": "high"|"medium"|"low", "summary": string, "citations": [source title or domain] } ],
  "category_demand": [ { "category": string, "demand_score": number, "source_count": number } ],
  "insights": [ string, string, string ]
}
Rules: mention counts and source_count must be based on the source list only. No estimated price/revenue unless a source explicitly states it; prefer summaries over numbers.`;
    const raw = await marketCore.callAI(sys, prompt, true);
    if (!raw) return marketCore.fallbackOverview(articles, data.lang, note);
    try {
      return marketCore.normalizeOverview(JSON.parse(raw), articles, data.lang, note);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return marketCore.normalizeOverview(JSON.parse(m[0]), articles, data.lang, note);
      return marketCore.fallbackOverview(articles, data.lang, note);
    }
  });

export const chatMarketAnalyst = createServerFn({ method: "POST" })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .middleware([requireDeploymentAuth as any])
  .inputValidator((d: unknown) => z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1).max(4000),
    })).min(1).max(50),
    lang: z.enum(["bn", "en"]).default("bn"),
  }).parse(d))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data, context }: { data: { messages: { role: "user" | "assistant" | "system"; content: string }[]; lang: Lang }; context: any }) => {
    await marketCore.ensurePremium(context.supabase, context.userId);
    const lastUserMessage = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "market prices demand";
    const { articles, note } = await marketCore.fetchMarketSources("bangladesh", undefined, lastUserMessage, 7);
    if (articles.length === 0) {
      return {
        reply: data.lang === "bn"
          ? "আজকের লাইভ সোর্স এখন পাওয়া যাচ্ছে না/রেট-লিমিটেড, তাই আমি কোনো অনুমান বা fake insight দেব না। একটু পরে আবার চেষ্টা করুন।"
          : "Live sources are unavailable/rate-limited right now, so I will not provide fake insights. Please try again shortly.",
      };
    }
    const sys = data.lang === "bn"
      ? `তুমি একজন সোর্স-ভিত্তিক মার্কেট অ্যানালিস্ট। শুধুমাত্র নিচের আজকের পাবলিক সোর্স থেকে উত্তর দাও। কোনো তথ্য বানাবে না, ঈদ/সিজন/দাম/ডিমান্ড উল্লেখ করবে না যদি সোর্সে স্পষ্ট না থাকে। প্রতিটি গুরুত্বপূর্ণ দাবিতে সোর্সের নাম দাও। Source note: ${note ?? "ok"}\n\nSOURCES:\n${articles.map((a, i) => `${i + 1}. ${a.title} | ${a.source} | ${a.published_at} | ${a.url}`).join("\n")}`
      : `You are a source-grounded market analyst. Answer only from today's public sources below. Do not invent prices, demand, seasonal/festival claims, or facts. Cite source names for important claims. Source note: ${note ?? "ok"}\n\nSOURCES:\n${articles.map((a, i) => `${i + 1}. ${a.title} | ${a.source} | ${a.published_at} | ${a.url}`).join("\n")}`;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: marketCore.aiMissingReply(articles, data.lang) };
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: sys }, ...data.messages] }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return { reply: j?.choices?.[0]?.message?.content ?? "" };
  });