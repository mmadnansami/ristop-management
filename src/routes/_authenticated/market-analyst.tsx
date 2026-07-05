import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMarketOverview, chatMarketAnalyst } from "@/lib/market-analyst.functions";
import { useI18n } from "@/lib/i18n";
import { RisMascot } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Sparkles, Send, TrendingUp, Crown, Lock, RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/market-analyst")({ component: MarketAnalyst });

type Msg = { role: "user" | "assistant"; content: string };
type Overview = {
  generated_at: string;
  date_label: string;
  source_count: number;
  source_note: string;
  top_products: { name: string; category: string; mentions: number; source_count: number; trend: "up" | "down" | "stable" | "unknown"; confidence: "high" | "medium" | "low"; summary: string; citations: string[] }[];
  category_demand: { category: string; demand_score: number; source_count: number }[];
  monthly_trend: { day: string; mention_count: number; source_count: number }[];
  insights: string[];
  sources: { title: string; url: string; source: string; published_at: string }[];
};

const COLORS = ["#a855f7", "#7c3aed", "#c084fc", "#8b5cf6", "#d8b4fe", "#6d28d9", "#e9d5ff", "#5b21b6"];

function MarketAnalyst() {
  const { lang } = useI18n();
  const [region, setRegion] = useState<"bangladesh" | "global">("bangladesh");
  const [category, setCategory] = useState("");

  const { data: premium } = useQuery({
    queryKey: ["premium-check"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("subscriptions").select("id").eq("user_id", u.user.id).eq("status", "active").maybeSingle();
      return !!data;
    },
  });

  const fetchOverview = useServerFn(getMarketOverview);
  const { data: overview, isFetching, refetch, error } = useQuery<Overview>({
    queryKey: ["market-overview", region, category, lang, premium],
    queryFn: () => fetchOverview({ data: { region, category: category || undefined, lang } }),
    enabled: !!premium,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (!premium) return <LockedView lang={lang} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
            <TrendingUp className="h-7 w-7" /> {lang === "bn" ? "মার্কেট অ্যানালিস্ট" : "Market Analyst"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "bn" ? "আজকের পাবলিক সোর্স যাচাই করে মার্কেট রিসার্চ" : "Daily market research verified against current public sources"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={region} onValueChange={(v) => setRegion(v as "bangladesh" | "global")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bangladesh">🇧🇩 {lang === "bn" ? "বাংলাদেশ" : "Bangladesh"}</SelectItem>
              <SelectItem value="global">🌐 {lang === "bn" ? "গ্লোবাল" : "Global"}</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={lang === "bn" ? "ক্যাটাগরি (অপশনাল)" : "Category (optional)"} value={category} onChange={(e) => setCategory(e.target.value)} className="w-48" />
          <Button onClick={() => refetch()} disabled={isFetching} className="bg-gradient-primary shadow-glow">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && <div className="rounded-2xl glass border border-destructive/40 p-4 text-sm text-destructive">{(error as Error).message}</div>}

      {isFetching && !overview && (
        <div className="rounded-3xl glass-strong p-12 text-center">
          <Sparkles className="h-8 w-8 mx-auto animate-pulse text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{lang === "bn" ? "আজকের সোর্স যাচাই করছে..." : "Checking today's sources..."}</p>
        </div>
      )}

      {overview && (
        <>
          <div className="rounded-2xl glass border border-primary/30 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase text-primary-glow flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {lang === "bn" ? "ভেরিফাইড সোর্স" : "Verified sources"}</div>
              <div className="font-semibold">{overview.source_count} {lang === "bn" ? "টি সোর্স" : "sources"} • {overview.date_label}</div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">{overview.source_note}</p>
          </div>

          {overview.source_count === 0 ? (
            <div className="rounded-3xl glass-strong p-10 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                {lang === "bn" ? "যাচাইযোগ্য ডেটা না থাকায় কোনো fake graph/insight দেখানো হচ্ছে না।" : "No fake graph or insight is shown without verifiable data."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {overview.insights.map((ins, i) => (
                  <div key={i} className="rounded-2xl glass-strong border border-primary/30 p-4">
                    <div className="text-xs text-primary-glow mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> {lang === "bn" ? "সোর্স ইনসাইট" : "Source Insight"} #{i + 1}</div>
                    <div className="text-sm">{ins}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl glass border border-border p-5">
                  <h3 className="font-semibold mb-3">{lang === "bn" ? "দৈনিক সোর্স সিগন্যাল" : "Daily Source Signal"}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={overview.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3b2a55" />
                      <XAxis dataKey="day" stroke="#a78bfa" fontSize={11} />
                      <YAxis stroke="#a78bfa" fontSize={11} />
                      <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="mention_count" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#c084fc", r: 4 }} />
                      <Line type="monotone" dataKey="source_count" stroke="#c084fc" strokeWidth={2} dot={{ fill: "#a855f7", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl glass border border-border p-5">
                  <h3 className="font-semibold mb-3">{lang === "bn" ? "সোর্স-ভিত্তিক ক্যাটাগরি সিগন্যাল" : "Source-Based Category Signal"}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={overview.category_demand} dataKey="demand_score" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={(e: { category: string }) => e.category}>
                        {overview.category_demand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl glass border border-border p-5">
                <h3 className="font-semibold mb-4">{lang === "bn" ? "সোর্সে আলোচিত প্রডাক্ট" : "Products Discussed in Sources"}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.top_products.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3b2a55" />
                    <XAxis dataKey="name" stroke="#a78bfa" fontSize={10} angle={-20} textAnchor="end" height={70} />
                    <YAxis stroke="#a78bfa" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
                    <Bar dataKey="mentions" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground text-xs uppercase">
                      <tr><th className="text-left py-2">{lang === "bn" ? "প্রডাক্ট" : "Product"}</th><th className="text-left">{lang === "bn" ? "ক্যাটাগরি" : "Category"}</th><th className="text-right">{lang === "bn" ? "উল্লেখ" : "Mentions"}</th><th className="text-right">{lang === "bn" ? "সোর্স" : "Sources"}</th><th className="text-left pl-4">{lang === "bn" ? "সারাংশ" : "Summary"}</th><th className="text-right">{lang === "bn" ? "ট্রেন্ড" : "Trend"}</th></tr>
                    </thead>
                    <tbody>
                      {overview.top_products.map((p, i) => (
                        <tr key={i} className="border-t border-border/50 align-top">
                          <td className="py-2 font-medium">{p.name}</td>
                          <td className="text-muted-foreground py-2">{p.category}</td>
                          <td className="text-right py-2">{p.mentions.toLocaleString()}</td>
                          <td className="text-right py-2">{p.source_count.toLocaleString()}</td>
                          <td className="py-2 pl-4 max-w-md text-muted-foreground">{p.summary}<div className="mt-1 text-xs text-primary-glow">{p.citations.slice(0, 2).join(" • ")}</div></td>
                          <td className="text-right py-2 font-semibold text-gradient">{p.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl glass border border-border p-5">
                <h3 className="font-semibold mb-3">{lang === "bn" ? "আজকের সোর্স তালিকা" : "Today's Source List"}</h3>
                <div className="space-y-2">
                  {overview.sources.slice(0, 6).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border/70 p-3 text-sm hover:bg-secondary/60 transition">
                      <span className="font-medium inline-flex items-center gap-1">{s.title}<ExternalLink className="h-3 w-3" /></span>
                      <span className="block text-xs text-muted-foreground mt-1">{s.source} • {s.published_at}</span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <AnalystChat lang={lang} />
    </div>
  );
}

function AnalystChat({ lang }: { lang: "bn" | "en" }) {
  const chat = useServerFn(chatMarketAnalyst);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: lang === "bn" ? "হ্যালো! আমি সোর্স-ভিত্তিক মার্কেট অ্যানালিস্ট। আজকের সোর্সে যা আছে শুধু সেটাই বলব।" : "Hi! I'm a source-grounded market analyst. I will only answer from today's sources." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999 }); }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const res = await chat({ data: { messages: next, lang } });
      setMsgs([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: (e as Error).message }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-3xl glass-strong border border-primary/30 shadow-glow overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-gradient-primary">
        <RisMascot className="h-9 w-9" />
        <div>
          <div className="font-bold text-primary-foreground">{lang === "bn" ? "মার্কেট অ্যানালিস্ট চ্যাট" : "Market Analyst Chat"}</div>
          <div className="text-xs text-primary-foreground/80">{lang === "bn" ? "সোর্স-ভিত্তিক মার্কেট ইনসাইট" : "Source-backed market insights"}</div>
        </div>
      </div>
      <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass border border-border"}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground animate-pulse">{lang === "bn" ? "সোর্স যাচাই করছে..." : "Checking sources..."}</div>}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={lang === "bn" ? "মার্কেট নিয়ে জিজ্ঞেস করুন..." : "Ask about the market..."} className="flex-1 bg-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-ring" />
        <Button onClick={send} disabled={loading} className="bg-gradient-primary shadow-glow"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function LockedView({ lang }: { lang: "bn" | "en" }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
          <TrendingUp className="h-7 w-7" /> {lang === "bn" ? "মার্কেট অ্যানালিস্ট" : "Market Analyst"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "সোর্স-ভিত্তিক রিয়েল-টাইম মার্কেট রিসার্চ" : "Source-backed real-time market research"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 opacity-40 pointer-events-none">
        {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl glass border border-border p-4 h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-40 pointer-events-none">
        <div className="rounded-2xl glass border border-border p-5 h-72" />
        <div className="rounded-2xl glass border border-border p-5 h-72" />
      </div>

      <div className="rounded-3xl glass-strong border-2 border-primary/40 shadow-glow p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="relative">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-primary shadow-glow mb-4">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gradient flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-primary-glow" /> {lang === "bn" ? "প্রিমিয়াম ফিচার" : "Premium Feature"}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {lang === "bn"
              ? "মার্কেট অ্যানালিস্ট শুধু প্রিমিয়াম প্ল্যান ব্যবহারকারীদের জন্য। সোর্স-ভিত্তিক রিসার্চ, সাইটেশন, ডিমান্ড সিগন্যাল ও AI চ্যাট পেতে সাবসক্রিপশন কিনুন।"
              : "Market Analyst is exclusive to premium users. Unlock source-backed research, citations, demand signals, and AI chat by subscribing."}
          </p>
          <Link to="/subscribe" search={{ plan: "quarterly" }}>
            <Button className="mt-6 bg-gradient-primary shadow-glow h-12 px-8 text-base">
              <Crown className="h-4 w-4 mr-2" /> {lang === "bn" ? "প্রিমিয়াম কিনুন" : "Buy Premium"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}