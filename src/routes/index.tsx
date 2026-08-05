import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RisAssistant } from "@/components/RisAssistant";
import { SiteFooter, CareersCta } from "@/components/SiteFooter";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PLAN_LIST, formatPrice, priceOf, originalPriceOf, discountPercent, type Currency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import demoVideo1Asset from "@/assets/ristop-demo-1.mp4.asset.json";
import demoVideo2Asset from "@/assets/ristop-demo-2.mp4.asset.json";
import {
  Boxes, TrendingUp, PieChart, Bell, Users, FileText,
  Sparkles, Cloud, ShieldCheck, ArrowRight, Check, Star,
  LineChart, Wallet,
} from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Best Business Management Software | Ristop" },
      { name: "description", content: "Ristop is a complete business management software for Bangladesh with sales, stock, customer, supplier, dues, reports and AI tools." },
      { property: "og:title", content: "Best Business Management Software | Ristop" },
      { property: "og:description", content: "Manage sales, inventory, customers, suppliers, dues and reports from one secure workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, lang } = useI18n();
  const [currency, setCurrency] = useState<Currency>("BDT");
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2"><Logo className="h-16 w-auto" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">{t("features")}</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">{t("pricing")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/auth" search={{ mode: "signin" }}><Button variant="outline" size="sm" className="border-primary/40">{t("signIn")}</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}><Button size="sm" className="bg-gradient-primary shadow-glow hidden sm:inline-flex">{t("signUp")}</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-primary-glow mb-6">
            <Sparkles className="h-3.5 w-3.5" /> {lang === "bn" ? "AI দ্বারা চালিত" : "Powered by AI"}
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
            <span className="text-gradient">{t("heroTitle")}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t("heroSub")}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="bg-gradient-primary shadow-glow text-base h-12 px-7">
                {t("getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base h-12 px-7 border-primary/40">{t("watchDemo")}</Button>
            </a>
          </div>
          <div className="mt-12 flex justify-center">
            <div className="animate-float w-full max-w-4xl rounded-2xl glass border border-primary/30 shadow-glow p-2">
              <div className="rounded-xl bg-gradient-card p-6 md:p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                  {[
                    { k: t("totalSales"), v: "৳ 1,24,500", c: "from-fuchsia-500/30" },
                    { k: t("totalProfit"), v: "৳ 38,200", c: "from-violet-500/30" },
                    { k: t("totalOrders"), v: "342", c: "from-purple-500/30" },
                    { k: t("lowStock"), v: "5", c: "from-rose-500/30", warn: true },
                  ].map((s) => (
                    <div key={s.k} className={`rounded-xl p-4 bg-gradient-to-br ${s.c} to-transparent border border-border ${s.warn ? "border-destructive/50" : ""}`}>
                      <div className="text-xs text-muted-foreground">{s.k}</div>
                      <div className={`text-xl font-bold mt-1 ${s.warn ? "text-destructive" : ""}`}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo videos */}
      <section id="demo" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-5xl font-bold text-center">
          <span className="text-gradient">{lang === "bn" ? "ডেমো ভিডিও" : "Demo videos"}</span>
        </h2>
        <p className="text-center text-muted-foreground mt-3 max-w-2xl mx-auto">
          {lang === "bn" ? "এক নজরে দেখে নিন Ristop Management কীভাবে কাজ করে।" : "See how Ristop Management works, in under a minute."}
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[demoVideo1Asset.url, demoVideo2Asset.url].map((src, i) => (
            <div key={src} className="rounded-2xl glass border border-primary/30 p-2 shadow-glow">
              <video
                src={src}
                controls
                playsInline
                muted
                loop
                preload="metadata"
                aria-label={`Ristop Management demo video ${i + 1}`}
                className="w-full rounded-xl bg-black"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}

      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-5xl font-bold text-center"><span className="text-gradient">{lang === "bn" ? "যা যা পাবেন" : "Everything you need"}</span></h2>
        <p className="text-center text-muted-foreground mt-3 max-w-2xl mx-auto">{lang === "bn" ? "একটাই সফটওয়্যার, পুরো ব্যবসার কন্ট্রোল।" : "One software, complete control of your business."}</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { i: Boxes, t: lang === "bn" ? "স্মার্ট স্টক ম্যানেজমেন্ট" : "Smart Stock Management", d: lang === "bn" ? "রিয়েল টাইম স্টক ট্র্যাকিং।" : "Real-time stock tracking." },
            { i: TrendingUp, t: lang === "bn" ? "স্মার্ট সেলস ট্র্যাকিং" : "Smart Sales Tracking", d: lang === "bn" ? "দৈনিক বিক্রি ও রিপোর্ট।" : "Daily sales & reports." },
            { i: PieChart, t: lang === "bn" ? "স্মার্ট প্রফিট এনালাইসিস" : "Smart Profit Analysis", d: lang === "bn" ? "লাভ-ক্ষতি সহজ বিশ্লেষণ।" : "Easy profit/loss analytics." },
            { i: Bell, t: lang === "bn" ? "ইনভেন্টরি এলার্ট" : "Inventory Alerts", d: lang === "bn" ? "স্টক কমলেই ওয়ার্নিং।" : "Get notified on low stock." },
            { i: Users, t: lang === "bn" ? "কাস্টমার ম্যানেজমেন্ট" : "Customer Management", d: lang === "bn" ? "কাস্টমার লিস্ট ও ব্যালেন্স।" : "Customer list & balances." },
            { i: FileText, t: lang === "bn" ? "ইনভয়েস ও বিল" : "Invoices & Billing", d: lang === "bn" ? "দ্রুত ইনভয়েস জেনারেট।" : "Generate invoices fast." },
            { i: Sparkles, t: lang === "bn" ? "Ris — AI অ্যাসিস্ট্যান্ট" : "Ris — AI Assistant", d: lang === "bn" ? "সবসময় আপনার পাশে।" : "Always by your side." },
            { i: Cloud, t: lang === "bn" ? "ক্লাউড ব্যাকাপ" : "Cloud Backup", d: lang === "bn" ? "সেরা ক্লাউড সুবিধা।" : "Best-in-class cloud." },
            { i: ShieldCheck, t: lang === "bn" ? "ভাষা ট্রান্সলেটর" : "Language Translator", d: lang === "bn" ? "বাংলা / English টগল।" : "Bangla / English toggle." },
            { i: LineChart, t: lang === "bn" ? "স্মার্ট মার্কেট অ্যানালাইসিস" : "Smart Market Analysis", d: lang === "bn" ? "রিয়েল-টাইম মার্কেট ট্রেন্ড ও ইনসাইট।" : "Real-time market trends & insights." },
            { i: Wallet, t: lang === "bn" ? "স্মার্ট বকেয়া" : "Smart Bakeya (Dues)", d: lang === "bn" ? "কাস্টমার ও সাপ্লায়ার বকেয়া ট্র্যাক করুন।" : "Track customer & supplier dues easily." },
          ].map((f) => (
            <div key={f.t} className="group rounded-2xl glass border border-border p-6 hover:border-primary/50 hover:shadow-glow transition-all">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-4">
                <f.i className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-5xl font-bold text-center"><span className="text-gradient">{lang === "bn" ? "সাবসক্রিপশন প্ল্যান" : "Subscription Plans"}</span></h2>
        <p className="text-center text-muted-foreground mt-3">{lang === "bn" ? "AI ফ্রি, প্রিমিয়াম ফিচারের জন্য একটা প্ল্যান বাছাই করুন।" : "AI is free forever. Choose a plan to unlock premium features."}</p>
        <div className="mt-6 flex justify-center gap-2">
          {(["BDT", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-1.5 text-sm border transition ${currency === c ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {c === "BDT" ? "৳ BDT" : "$ USD / USDT"}
            </button>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLAN_LIST.map((p) => (
            <div key={p.id} className={`relative rounded-2xl glass p-7 border ${p.popular ? "border-primary shadow-glow glow-ring" : "border-border"}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Star className="h-3 w-3" /> {t("popular")}
                </div>
              )}
              <h3 className="font-semibold text-xl">{lang === "bn" ? p.label_bn : p.label_en}</h3>
              <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-bold text-gradient">{formatPrice(priceOf(p, currency), currency)}</span>
                {originalPriceOf(p, currency) && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPriceOf(p, currency)!, currency)}</span>
                )}
                <span className="text-muted-foreground text-sm">{lang === "bn" ? p.period_bn : p.period_en}</span>
              </div>
              {discountPercent(p, currency) > 0 && (
                <div className="mt-2 inline-flex rounded-full bg-success/15 px-2.5 py-1 text-xs text-success">
                  {lang === "bn" ? `লঞ্চিং ডিসকাউন্ট ${discountPercent(p, currency)}%` : `Launch discount ${discountPercent(p, currency)}%`}
                </div>
              )}

              <ul className="mt-6 space-y-2 text-sm">
                {[
                  lang === "bn" ? "সব ফিচার আনলিমিটেড" : "All features unlimited",
                  lang === "bn" ? "ক্লাউড ব্যাকাপ" : "Cloud backup",
                  lang === "bn" ? "Ris AI অ্যাসিস্ট্যান্ট" : "Ris AI assistant",
                  lang === "bn" ? "প্রায়োরিটি সাপোর্ট" : "Priority support",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{x}</li>
                ))}
              </ul>
              <Link to="/subscribe" search={{ plan: p.id as "monthly" | "quarterly" | "biannual" }}>
                <Button className={`mt-7 w-full ${p.popular ? "bg-gradient-primary shadow-glow" : ""}`} variant={p.popular ? "default" : "outline"}>
                  {t("buyNow")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews & case studies */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { t: lang === "bn" ? "কাস্টমার রিভিউ" : "Customer reviews", d: lang === "bn" ? "বাস্তব ব্যবসায়ীদের অভিজ্ঞতা পড়ুন।" : "Read what real business owners say.", slug: "reviews" },
            { t: lang === "bn" ? "কেস স্টাডি" : "Case studies", d: lang === "bn" ? "কীভাবে দোকান ও ডিস্ট্রিবিউটররা লাভ বাড়িয়েছে।" : "How shops and distributors improved profit.", slug: "case-studies" },
            { t: lang === "bn" ? "দ্রুত সাপোর্ট" : "Fast support", d: lang === "bn" ? "WhatsApp-এ ১৫ মিনিটের মধ্যে উত্তর।" : "WhatsApp replies within 15 minutes.", slug: "support" },
          ].map((c) => (
            <Link key={c.slug} to="/info/$slug" params={{ slug: c.slug }} className="rounded-2xl glass border border-border p-6 transition hover:border-primary/50 hover:shadow-glow">
              <h3 className="font-semibold text-lg">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary-glow">{lang === "bn" ? "দেখুন" : "Explore"} <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl glass border border-primary/30 p-6 text-center">
          <h2 className="text-xl font-semibold">{lang === "bn" ? "ক্যারিয়ার" : "Careers"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">আমরা ক্রিয়েটিভ মানুষের সাথে কথা বলতে আগ্রহী</p>
          <div className="mt-4 flex justify-center"><CareersCta /></div>
        </div>
      </section>

      <SiteFooter />


      <RisAssistant />
    </div>
  );
}
