type Region = "bangladesh" | "global";
type Lang = "bn" | "en";

export type SourceArticle = { title: string; url: string; source: string; published_at: string };
export type MarketOverview = {
  generated_at: string; date_label: string; source_count: number; source_note: string;
  top_products: Array<{ name: string; category: string; mentions: number; source_count: number; trend: "up" | "down" | "stable" | "unknown"; confidence: "high" | "medium" | "low"; summary: string; citations: string[] }>;
  category_demand: Array<{ category: string; demand_score: number; source_count: number }>;
  monthly_trend: Array<{ day: string; mention_count: number; source_count: number }>;
  insights: string[]; sources: SourceArticle[];
};

const safeText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const PRODUCTS = [
  { en: "Rice", bn: "চাল", catEn: "Food staples", catBn: "খাদ্যপণ্য", terms: ["rice", "paddy", "চাল", "ধান"] },
  { en: "Onion", bn: "পেঁয়াজ", catEn: "Vegetables", catBn: "সবজি", terms: ["onion", "পেঁয়াজ"] },
  { en: "Potato", bn: "আলু", catEn: "Vegetables", catBn: "সবজি", terms: ["potato", "আলু"] },
  { en: "Egg", bn: "ডিম", catEn: "Protein", catBn: "প্রোটিন", terms: ["egg", "ডিম"] },
  { en: "Chicken", bn: "মুরগি", catEn: "Protein", catBn: "প্রোটিন", terms: ["chicken", "broiler", "poultry", "মুরগি"] },
  { en: "Soybean Oil", bn: "সয়াবিন তেল", catEn: "Edible oil", catBn: "ভোজ্যতেল", terms: ["soybean", "edible oil", "cooking oil", "ভোজ্যতেল"] },
  { en: "Sugar", bn: "চিনি", catEn: "Food staples", catBn: "খাদ্যপণ্য", terms: ["sugar", "চিনি"] },
  { en: "Wheat", bn: "গম", catEn: "Food staples", catBn: "খাদ্যপণ্য", terms: ["wheat", "flour", "atta", "গম", "আটা"] },
  { en: "Garments", bn: "গার্মেন্টস", catEn: "Textile", catBn: "টেক্সটাইল", terms: ["garment", "apparel", "rmg", "গার্মেন্টস"] },
  { en: "Fuel", bn: "জ্বালানি", catEn: "Energy", catBn: "জ্বালানি", terms: ["fuel", "diesel", "gas", "oil price", "জ্বালানি"] },
];

export async function ensurePremium(supabase: { from: (t: string) => { select: (c: string) => { eq: (a: string, b: string) => { eq: (c: string, d: string) => { maybeSingle: () => Promise<{ data: unknown }> } } } } }, userId: string) {
  const { data } = await supabase.from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!data) throw new Error("PREMIUM_REQUIRED");
}

export function todayLabel(lang: Lang) {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "full", timeZone: "Asia/Dhaka" }).format(new Date());
}

export function sourceNote(lang: Lang, count: number, unavailable?: string) {
  if (unavailable) return lang === "bn" ? "লাইভ পাবলিক সোর্স সাময়িকভাবে সীমিত/অনুপলব্ধ—তাই fake অনুমান দেখানো হচ্ছে না।" : "Live public sources are temporarily limited/unavailable, so fake estimates are not shown.";
  return lang === "bn" ? `আজকের ${count}টি পাবলিক নিউজ/ওয়েব সোর্স যাচাই করে এই বিশ্লেষণ তৈরি হয়েছে।` : `Built from ${count} current public news/web sources.`;
}

export function emptyOverview(lang: Lang, note?: string): MarketOverview {
  return { generated_at: new Date().toISOString(), date_label: todayLabel(lang), source_count: 0, source_note: note ?? sourceNote(lang, 0, "empty"), top_products: [], category_demand: [], monthly_trend: [], insights: [], sources: [] };
}

function buildMarketQuery(region: Region, category?: string, userQuestion?: string) {
  const regionPart = region === "bangladesh" ? "Bangladesh" : "global OR world OR international";
  const topic = safeText(category || userQuestion || "retail product commodity market price demand supply inflation").slice(0, 140);
  return `(${regionPart}) (${topic}) (price OR demand OR market OR retail OR commodity OR inflation OR supply OR shortage OR export OR import)`;
}

/** fetch with a hard timeout so a slow public source can never hang the page. */
export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Admin-curated insights are the trusted fallback when public sources fail. */
export async function fetchAdminInsights(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  region: Region,
): Promise<{ articles: SourceArticle[]; brief: string }> {
  try {
    const { data } = await supabase
      .from("market_insights")
      .select("title, summary, source_name, source_url, published_at, region, product_name, price_direction, category")
      .in("region", [region, "both"])
      .order("published_at", { ascending: false })
      .limit(20);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const articles: SourceArticle[] = rows.map((r) => ({
      title: safeText(r.title),
      url: safeText(r.source_url) || "admin-curated",
      source: safeText(r.source_name) || "Ristop admin desk",
      published_at: safeText(r.published_at) || new Date().toISOString(),
    })).filter((a) => a.title);
    const brief = rows
      .map((r) => `- ${safeText(r.product_name) || safeText(r.category) || "market"} (${safeText(r.price_direction)}): ${safeText(r.title)} — ${safeText(r.summary)} [${safeText(r.source_name) || "Ristop admin desk"}]`)
      .join("\n");
    return { articles, brief };
  } catch {
    return { articles: [], brief: "" };
  }
}

export async function fetchMarketSources(region: Region, category?: string, userQuestion?: string, days = 1): Promise<{ articles: SourceArticle[]; note?: string }> {
  const params = new URLSearchParams({ query: buildMarketQuery(region, category, userQuestion), mode: "artlist", format: "json", maxrecords: "50", sort: "datedesc", timespan: `${days}d` });
  try {
    const res = await fetchWithTimeout(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, { headers: { "User-Agent": "Ristop-Market-Analyst/1.0" } });
    if (!res.ok) return { articles: [], note: `SOURCE_${res.status}` };
    const json = await res.json() as { articles?: Array<Record<string, unknown>> };
    return { articles: (json.articles ?? []).map((a) => ({ title: safeText(a.title), url: safeText(a.url), source: safeText(a.sourceCommonName || a.domain || "source"), published_at: safeText(a.seendate || a.publishedDate || new Date().toISOString()) })).filter((a) => a.title && a.url).slice(0, 35) };
  } catch (error) { return { articles: [], note: error instanceof Error ? error.message : "SOURCE_FETCH_FAILED" }; }
}

export async function fetchMarketSourcesWithFallback(region: Region, category?: string, userQuestion?: string) {
  const windows = region === "bangladesh" ? [7, 30, 365] : [10, 30, 365];
  let lastNote: string | undefined;
  for (const days of windows) {
    const result = await fetchMarketSources(region, category, userQuestion, days);
    lastNote = result.note;
    if (result.articles.length > 0) return { ...result, days };
  }
  return { articles: [] as SourceArticle[], days: windows[windows.length - 1], note: lastNote ?? "NO_VERIFIED_SOURCES" };
}

function dailyTrendFromSources(articles: SourceArticle[]) {
  const byDay = new Map<string, { mention_count: number; sources: Set<string> }>();
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dhaka" });
  articles.forEach((a) => { const parsed = Date.parse(a.published_at); const day = Number.isNaN(parsed) ? formatter.format(new Date()) : formatter.format(new Date(parsed)); const item = byDay.get(day) ?? { mention_count: 0, sources: new Set<string>() }; item.mention_count += 1; item.sources.add(a.source); byDay.set(day, item); });
  return Array.from(byDay.entries()).reverse().map(([day, item]) => ({ day, mention_count: item.mention_count, source_count: item.sources.size }));
}

export async function callAI(system: string, user: string, jsonMode = false) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return "";
  const body: Record<string, unknown> = { model: "google/gemini-2.5-flash", messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  if (jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json())?.choices?.[0]?.message?.content ?? "";
}

export function normalizeOverview(value: Partial<MarketOverview>, articles: SourceArticle[], lang: Lang, note?: string): MarketOverview {
  return { generated_at: new Date().toISOString(), date_label: todayLabel(lang), source_count: articles.length, source_note: sourceNote(lang, articles.length, note), top_products: (value.top_products ?? []).slice(0, 10).map((p) => ({ name: safeText(p.name) || (lang === "bn" ? "সোর্সে উল্লেখিত পণ্য" : "Source-mentioned product"), category: safeText(p.category) || (lang === "bn" ? "সাধারণ" : "General"), mentions: Number(p.mentions) || 1, source_count: Number(p.source_count) || 1, trend: ["up", "down", "stable", "unknown"].includes(String(p.trend)) ? p.trend as "up" | "down" | "stable" | "unknown" : "unknown", confidence: ["high", "medium", "low"].includes(String(p.confidence)) ? p.confidence as "high" | "medium" | "low" : "low", summary: safeText(p.summary), citations: Array.isArray(p.citations) ? p.citations.map(safeText).filter(Boolean).slice(0, 3) : [] })).filter((p) => p.summary || p.citations.length > 0), category_demand: (value.category_demand ?? []).slice(0, 8).map((c) => ({ category: safeText(c.category), demand_score: Math.max(0, Math.min(100, Number(c.demand_score) || 0)), source_count: Number(c.source_count) || 1 })).filter((c) => c.category), monthly_trend: dailyTrendFromSources(articles), insights: (value.insights ?? []).map(safeText).filter(Boolean).slice(0, 3), sources: articles.slice(0, 12) };
}

export function fallbackOverview(articles: SourceArticle[], lang: Lang, note?: string): MarketOverview {
  const matched = new Map<string, { category: string; titles: Set<string>; sources: Set<string> }>();
  for (const article of articles) for (const p of PRODUCTS) if (p.terms.some((term) => article.title.toLowerCase().includes(term.toLowerCase()))) { const key = lang === "bn" ? p.bn : p.en; const cur = matched.get(key) ?? { category: lang === "bn" ? p.catBn : p.catEn, titles: new Set<string>(), sources: new Set<string>() }; cur.titles.add(article.title); cur.sources.add(article.source); matched.set(key, cur); }
  const top = Array.from(matched.entries()).sort((a, b) => b[1].titles.size - a[1].titles.size).slice(0, 10);
  return normalizeOverview({ top_products: top.map(([name, item]) => ({ name, category: item.category, mentions: item.titles.size, source_count: item.sources.size, trend: "unknown", confidence: item.sources.size > 2 ? "medium" : "low", summary: lang === "bn" ? `যাচাই করা সোর্সে ${name} নিয়ে ${item.titles.size}টি রিপোর্ট/উল্লেখ পাওয়া গেছে; স্পষ্ট দাম/দিক না থাকলে ট্রেন্ড unknown রাখা হয়েছে।` : `${name} appears in ${item.titles.size} verified source mention(s); trend is unknown unless sources state a clear direction.`, citations: Array.from(item.titles).slice(0, 3) })), category_demand: top.map(([, item]) => ({ category: item.category, demand_score: Math.min(100, item.titles.size * 20), source_count: item.sources.size })), insights: articles.slice(0, 3).map((a) => lang === "bn" ? `সোর্স রিপোর্ট: ${a.title} — ${a.source}` : `Source report: ${a.title} — ${a.source}`) }, articles, lang, note);
}

export function aiMissingReply(articles: SourceArticle[], lang: Lang) {
  const sourceLines = articles.slice(0, 5).map((a, i) => `${i + 1}. ${a.title} — ${a.source}`).join("\n");
  return lang === "bn" ? `ভেরিফাইড লাইভ সোর্স পেয়েছি, কিন্তু Vercel সার্ভারে AI key নেই—তাই কোনো অনুমান করছি না। সোর্স-ভিত্তিক সারাংশ:\n${sourceLines}` : `Verified live sources were found, but the Vercel server has no AI key, so I will not infer beyond sources. Source-backed summary:\n${sourceLines}`;
}
/**
 * Google Gemini with the built-in google_search tool. This returns REAL,
 * freshly searched web data plus the grounded source list.
 */
export async function geminiGroundedSearch(prompt: string): Promise<{ text: string; sources: SourceArticle[]; note?: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { text: "", sources: [], note: "GEMINI_KEY_MISSING" };
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
        }),
      },
    );
    if (!res.ok) return { text: "", sources: [], note: `GEMINI_${res.status}` };
    const j = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
      }>;
    };
    const cand = j.candidates?.[0];
    const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("\n").trim();
    const nowIso = new Date().toISOString();
    const seen = new Set<string>();
    const sources: SourceArticle[] = [];
    for (const chunk of cand?.groundingMetadata?.groundingChunks ?? []) {
      const uri = safeText(chunk.web?.uri);
      const title = safeText(chunk.web?.title);
      if (!uri || !title || seen.has(title)) continue;
      seen.add(title);
      sources.push({ title, url: uri, source: title, published_at: nowIso });
    }
    return { text, sources };
  } catch (error) {
    return { text: "", sources: [], note: error instanceof Error ? error.message : "GEMINI_FAILED" };
  }
}

export function mergeSources(a: SourceArticle[], b: SourceArticle[]): SourceArticle[] {
  const out: SourceArticle[] = [];
  const seen = new Set<string>();
  for (const item of [...a, ...b]) {
    const k = item.url || item.title;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out.slice(0, 35);
}
