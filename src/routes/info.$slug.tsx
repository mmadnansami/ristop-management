import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter, CareersCta } from "@/components/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

type Page = {
  title_en: string;
  title_bn: string;
  desc: string;
  body_en: string[];
  body_bn: string[];
  careers?: boolean;
};

const PAGES: Record<string, Page> = {
  about: {
    title_en: "About Ristop Management",
    title_bn: "Ristop Management সম্পর্কে",
    desc: "Ristop Management is a cloud business management software built in Bangladesh for retailers, wholesalers and service businesses.",
    body_en: [
      "Ristop Management is a cloud business management platform built in Bangladesh for retailers, wholesalers, distributors and service businesses.",
      "We combine POS-style sales, inventory, purchases, customers, suppliers, dues (bakeya) and reporting in one professional workspace.",
      "Our market analyst uses live, source-grounded web search so business owners act on real data, never guesses.",
    ],
    body_bn: [
      "Ristop Management হলো বাংলাদেশে তৈরি একটি ক্লাউড বিজনেস ম্যানেজমেন্ট প্ল্যাটফর্ম—রিটেইল, হোলসেল, ডিস্ট্রিবিউশন ও সার্ভিস ব্যবসার জন্য।",
      "সেলস, ইনভেন্টরি, পারচেস, কাস্টমার, সাপ্লায়ার, বকেয়া ও রিপোর্ট—সবকিছু একটি প্রফেশনাল ওয়ার্কস্পেসে।",
      "আমাদের মার্কেট অ্যানালিস্ট লাইভ ওয়েব সার্চ থেকে সোর্স-ভিত্তিক তথ্য দেয়, অনুমান নয়।",
    ],
  },
  careers: {
    title_en: "Careers at Ristop",
    title_bn: "Ristop-এ ক্যারিয়ার",
    desc: "We love talking to creative people. Send your CV to Ristop Software on WhatsApp.",
    body_en: ["আমরা ক্রিয়েটিভ মানুষের সাথে কথা বলতে আগ্রহী", "Send your CV on WhatsApp and our team will get back to you."],
    body_bn: ["আমরা ক্রিয়েটিভ মানুষের সাথে কথা বলতে আগ্রহী", "WhatsApp-এ আপনার CV পাঠান, আমাদের টিম যোগাযোগ করবে।"],
    careers: true,
  },
  contact: {
    title_en: "Contact Ristop",
    title_bn: "যোগাযোগ",
    desc: "Contact Ristop Management support by WhatsApp, phone or email.",
    body_en: ["WhatsApp / Phone: +880 1317 680620", "Email: ristopsoftware@gmail.com", "Support hours: 24 hours a day, 7 days a week."],
    body_bn: ["WhatsApp / ফোন: +880 1317 680620", "ইমেইল: ristopsoftware@gmail.com", "সাপোর্ট সময়: ২৪ ঘণ্টা, সপ্তাহে ৭ দিন।"],
    careers: true,
  },
  blog: {
    title_en: "Ristop Blog",
    title_bn: "Ristop ব্লগ",
    desc: "Guides on inventory, dues management, pricing and growing a business in Bangladesh.",
    body_en: [
      "How to stop stock loss with daily inventory counts.",
      "Bakeya (dues) discipline: collecting customer credit without losing customers.",
      "Pricing for profit: reading your margin report every week.",
    ],
    body_bn: [
      "দৈনিক স্টক গণনা করে স্টক লস বন্ধ করার উপায়।",
      "বকেয়া ব্যবস্থাপনা: কাস্টমার না হারিয়ে বাকি আদায়।",
      "লাভের জন্য প্রাইসিং: প্রতি সপ্তাহে মার্জিন রিপোর্ট পড়ুন।",
    ],
  },
  help: {
    title_en: "Help Center",
    title_bn: "হেল্প সেন্টার",
    desc: "Answers to the most common Ristop Management questions.",
    body_en: [
      "Creating an account: sign up with your name, email and password.",
      "Signing in later: you can use email/password or Google sign-in.",
      "Adding products, sales, purchases and dues from the dashboard sidebar.",
      "Still stuck? Message us on WhatsApp for fast support.",
    ],
    body_bn: [
      "অ্যাকাউন্ট তৈরি: নাম, ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-আপ করুন।",
      "পরবর্তীতে লগইন: ইমেইল/পাসওয়ার্ড অথবা Google দিয়ে লগইন করা যাবে।",
      "ড্যাশবোর্ড সাইডবার থেকে প্রোডাক্ট, সেলস, পারচেস ও বকেয়া যোগ করুন।",
      "সমস্যা হলে WhatsApp-এ মেসেজ দিন—দ্রুত সাপোর্ট পাবেন।",
    ],
    careers: true,
  },
  docs: {
    title_en: "Documentation",
    title_bn: "ডকুমেন্টেশন",
    desc: "Module by module documentation of Ristop Management.",
    body_en: [
      "Products: catalogue, cost price, sale price and low-stock threshold.",
      "Sales: record a sale, auto profit calculation and invoice details.",
      "Purchases: supplier purchase entries that increase stock.",
      "Dues (Bakeya): customer and supplier ledgers with charges and payments.",
      "Reports: monthly sales, purchase and net profit charts.",
    ],
    body_bn: [
      "প্রোডাক্ট: ক্যাটালগ, ক্রয়মূল্য, বিক্রয়মূল্য ও লো-স্টক সীমা।",
      "সেলস: বিক্রি এন্ট্রি, অটো প্রফিট হিসাব ও ইনভয়েস তথ্য।",
      "পারচেস: সাপ্লায়ার পারচেস এন্ট্রি, স্টক বাড়ে।",
      "বকেয়া: কাস্টমার ও সাপ্লায়ার লেজার—চার্জ ও পেমেন্ট।",
      "রিপোর্ট: মাসিক সেলস, পারচেস ও নেট প্রফিট চার্ট।",
    ],
  },
  "case-studies": {
    title_en: "Case Studies",
    title_bn: "কেস স্টাডি",
    desc: "How Bangladeshi shops use Ristop Management to control stock, dues and profit.",
    body_en: [
      "Grocery shop, Dhaka: daily stock counting time reduced from 90 to 20 minutes.",
      "Electronics retailer, Chattogram: outstanding dues tracked in one ledger instead of notebooks.",
      "Distributor, Sylhet: monthly profit reporting moved from spreadsheets to automatic reports.",
    ],
    body_bn: [
      "মুদি দোকান, ঢাকা: দৈনিক স্টক গণনার সময় ৯০ মিনিট থেকে ২০ মিনিটে নেমেছে।",
      "ইলেকট্রনিক্স রিটেইলার, চট্টগ্রাম: খাতার বদলে একটি লেজারে সব বকেয়া।",
      "ডিস্ট্রিবিউটর, সিলেট: স্প্রেডশিটের বদলে অটোমেটিক মাসিক প্রফিট রিপোর্ট।",
    ],
  },
  reviews: {
    title_en: "Customer Reviews",
    title_bn: "কাস্টমার রিভিউ",
    desc: "What business owners say about Ristop Management.",
    body_en: [
      "\"Stock and dues in one place — I finally know my real profit.\" — Retail shop owner, Dhaka",
      "\"Bangla interface made it easy for my staff.\" — Wholesaler, Narayanganj",
      "\"Support replies on WhatsApp within minutes.\" — Distributor, Khulna",
    ],
    body_bn: [
      "\"স্টক ও বকেয়া একসাথে—এখন আসল লাভ বুঝতে পারি।\" — রিটেইল শপ ওনার, ঢাকা",
      "\"বাংলা ইন্টারফেসে স্টাফদের জন্য সহজ হয়েছে।\" — হোলসেলার, নারায়ণগঞ্জ",
      "\"WhatsApp-এ কয়েক মিনিটেই সাপোর্ট পাই।\" — ডিস্ট্রিবিউটর, খুলনা",
    ],
  },
  support: {
    title_en: "Fast Support",
    title_bn: "দ্রুত সাপোর্ট",
    desc: "Get fast Ristop Management support on WhatsApp, phone and email.",
    body_en: ["Average first response under 15 minutes during support hours.", "WhatsApp: +880 1317 680620", "Email: ristopsoftware@gmail.com"],
    body_bn: ["সাপোর্ট সময়ে গড়ে ১৫ মিনিটের মধ্যে প্রথম উত্তর।", "WhatsApp: +880 1317 680620", "ইমেইল: ristopsoftware@gmail.com"],
    careers: true,
  },
  security: {
    title_en: "Security",
    title_bn: "সিকিউরিটি",
    desc: "How Ristop Management protects your business data.",
    body_en: [
      "Every account's data is isolated with row-level security rules on the database.",
      "Passwords are never stored by us; authentication is handled by a managed auth provider.",
      "Traffic is encrypted end to end over HTTPS, and admin actions are role-checked on the server.",
    ],
    body_bn: [
      "প্রতিটি অ্যাকাউন্টের ডেটা ডেটাবেজে row-level security দিয়ে আলাদা রাখা হয়।",
      "পাসওয়ার্ড আমরা সংরক্ষণ করি না; ম্যানেজড অথ প্রোভাইডার এটি হ্যান্ডেল করে।",
      "সব ট্রাফিক HTTPS-এ এনক্রিপ্টেড এবং অ্যাডমিন অ্যাকশন সার্ভারে রোল-চেক করা হয়।",
    ],
  },
  privacy: {
    title_en: "Privacy Policy",
    title_bn: "প্রাইভেসি পলিসি",
    desc: "How Ristop Management collects, uses and protects personal data.",
    body_en: [
      "We collect only the account data you provide (name, email, phone) and the business records you create.",
      "We never sell your data and never share business records with other customers.",
      "You can request deletion of your account and data at any time via ristopsoftware@gmail.com.",
    ],
    body_bn: [
      "আমরা কেবল আপনার দেওয়া অ্যাকাউন্ট তথ্য (নাম, ইমেইল, ফোন) ও আপনার তৈরি ব্যবসায়িক রেকর্ড সংগ্রহ করি।",
      "আমরা কখনো আপনার ডেটা বিক্রি করি না বা অন্য কাস্টমারের সাথে শেয়ার করি না।",
      "যেকোনো সময় ristopsoftware@gmail.com-এ অ্যাকাউন্ট ও ডেটা মুছে ফেলার অনুরোধ করতে পারেন।",
    ],
  },
  terms: {
    title_en: "Terms of Service",
    title_bn: "শর্তাবলি",
    desc: "Terms governing the use of Ristop Management.",
    body_en: [
      "Subscriptions are prepaid for the selected period and activate after payment verification.",
      "You are responsible for the accuracy of the business data you enter.",
      "Abuse, resale of accounts, or attempts to breach other tenants' data will end the subscription without refund.",
    ],
    body_bn: [
      "সাবস্ক্রিপশন নির্বাচিত মেয়াদের জন্য অগ্রিম এবং পেমেন্ট ভেরিফিকেশনের পর সক্রিয় হয়।",
      "আপনি যে ডেটা এন্ট্রি করেন তার সঠিকতার দায়িত্ব আপনার।",
      "অপব্যবহার, অ্যাকাউন্ট পুনঃবিক্রি বা অন্যের ডেটায় প্রবেশের চেষ্টা করলে রিফান্ড ছাড়াই সাবস্ক্রিপশন বাতিল হবে।",
    ],
  },
  refund: {
    title_en: "Refund Policy",
    title_bn: "রিফান্ড পলিসি",
    desc: "Ristop Management refund rules for subscriptions.",
    body_en: [
      "If a paid plan cannot be activated due to our fault, we refund 100% within 7 working days.",
      "After activation, unused time on a monthly plan can be refunded pro-rata within the first 3 days.",
      "Refunds are returned through the same payment channel used for the purchase.",
    ],
    body_bn: [
      "আমাদের ত্রুটির কারণে পেইড প্ল্যান সক্রিয় না হলে ৭ কর্মদিবসের মধ্যে ১০০% রিফান্ড।",
      "সক্রিয় হওয়ার পর প্রথম ৩ দিনের মধ্যে মাসিক প্ল্যানের অব্যবহৃত সময়ের প্রো-রেটা রিফান্ড।",
      "যে চ্যানেলে পেমেন্ট করা হয়েছে সেই চ্যানেলেই রিফান্ড ফেরত দেওয়া হয়।",
    ],
  },
  guidelines: {
    title_en: "Usage Guidelines",
    title_bn: "ব্যবহার গাইডলাইন",
    desc: "Fair-use guidelines for Ristop Management accounts.",
    body_en: [
      "One subscription covers one business. Extra outlets need extra seats.",
      "Keep your login private; shared logins make audit trails unreliable.",
      "Do not upload unlawful content or use the AI tools to generate misleading claims.",
    ],
    body_bn: [
      "একটি সাবস্ক্রিপশন একটি ব্যবসার জন্য। অতিরিক্ত আউটলেটে অতিরিক্ত সিট লাগবে।",
      "লগইন তথ্য গোপন রাখুন; শেয়ার করা লগইনে অডিট ট্রেইল নির্ভরযোগ্য থাকে না।",
      "বেআইনি কনটেন্ট আপলোড বা AI দিয়ে বিভ্রান্তিকর দাবি তৈরি করবেন না।",
    ],
  },
  "free-trial": {
    title_en: "Free Trial",
    title_bn: "ফ্রি ট্রায়াল",
    desc: "Start a free Ristop Management trial and test every core module.",
    body_en: [
      "Create an account free and use products, sales, purchases, stock, customers, suppliers and dues.",
      "The Ris AI assistant is free for every account.",
      "Upgrade any time to unlock premium market analysis and priority support.",
    ],
    body_bn: [
      "ফ্রি অ্যাকাউন্ট খুলে প্রোডাক্ট, সেলস, পারচেস, স্টক, কাস্টমার, সাপ্লায়ার ও বকেয়া ব্যবহার করুন।",
      "Ris AI অ্যাসিস্ট্যান্ট সব অ্যাকাউন্টের জন্য ফ্রি।",
      "প্রিমিয়াম মার্কেট অ্যানালাইসিস ও প্রায়োরিটি সাপোর্টের জন্য যেকোনো সময় আপগ্রেড করুন।",
    ],
  },
  updates: {
    title_en: "Regular Updates",
    title_bn: "নিয়মিত আপডেট",
    desc: "Ristop Management ships improvements continuously.",
    body_en: [
      "Latest: dues (bakeya) ledger, live source-grounded market analyst, dual currency pricing.",
      "In progress: multi-outlet support and printable thermal invoices.",
      "Every update is deployed automatically — no manual installation.",
    ],
    body_bn: [
      "সর্বশেষ: বকেয়া লেজার, লাইভ সোর্স-ভিত্তিক মার্কেট অ্যানালিস্ট, দুই কারেন্সি প্রাইসিং।",
      "চলমান: মাল্টি-আউটলেট সাপোর্ট ও প্রিন্টেবল থার্মাল ইনভয়েস।",
      "প্রতিটি আপডেট অটোমেটিক ডিপ্লয় হয়—ম্যানুয়াল ইনস্টল লাগে না।",
    ],
  },
  referral: {
    title_en: "Referral Program",
    title_bn: "রেফারেল প্রোগ্রাম",
    desc: "Refer a business to Ristop Management and both sides get a free month.",
    body_en: [
      "Refer another business owner. When they buy any paid plan, you get 1 month free.",
      "Your friend also gets an extra 15 days on their first plan.",
      "Send your referral name and their phone number to us on WhatsApp to register the referral.",
    ],
    body_bn: [
      "অন্য ব্যবসায়ীকে রেফার করুন। তিনি পেইড প্ল্যান কিনলে আপনি ১ মাস ফ্রি পাবেন।",
      "আপনার বন্ধু তার প্রথম প্ল্যানে অতিরিক্ত ১৫ দিন পাবেন।",
      "রেফারেল রেজিস্টার করতে আপনার নাম ও তার ফোন নম্বর WhatsApp-এ পাঠান।",
    ],
    careers: true,
  },
  affiliate: {
    title_en: "Affiliate Partner",
    title_bn: "অ্যাফিলিয়েট পার্টনার",
    desc: "Earn recurring commission as a Ristop Management affiliate partner.",
    body_en: [
      "Earn 20% commission on every subscription you bring, for the full lifetime of that customer.",
      "Monthly payout via bKash, Nagad or USDT.",
      "Apply on WhatsApp with your name, area and audience size.",
    ],
    body_bn: [
      "আপনার আনা প্রতিটি সাবস্ক্রিপশনে আজীবন ২০% কমিশন।",
      "মাসিক পেআউট bKash, Nagad বা USDT-তে।",
      "নাম, এলাকা ও অডিয়েন্স সাইজ দিয়ে WhatsApp-এ আবেদন করুন।",
    ],
    careers: true,
  },
};


export const Route = createFileRoute("/info/$slug")({
  loader: ({ params }) => {
    const page = PAGES[params.slug];
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = page ? `${page.title_en} | Ristop Management` : "Ristop Management";
    const description = page?.desc ?? "Ristop Management — business management software for Bangladesh.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: InfoPage,
});

function InfoPage() {
  const { page } = Route.useLoaderData();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const body: string[] = bn ? page.body_bn : page.body_en;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/"><Logo className="h-10 w-auto" /></Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/auth" search={{ mode: "signup" }}><Button size="sm" className="bg-gradient-primary shadow-glow">{bn ? "শুরু করুন" : "Get started"}</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          />
          <div className="container relative mx-auto max-w-4xl px-4 py-14 md:py-20">
            <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {bn ? "হোম" : "Home"}
            </Link>
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-glow">
              Ristop Management
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-gradient md:text-5xl">
              {bn ? page.title_bn : page.title_en}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{page.desc}</p>
          </div>
        </section>

        {/* Content cards */}
        <section className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {body.map((line, i) => (
              <article
                key={line}
                className="group relative overflow-hidden rounded-2xl glass border border-border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-7 text-muted-foreground group-hover:text-foreground/90">{line}</p>
                </div>
                <Check className="absolute -bottom-3 -right-3 h-16 w-16 text-primary/5 transition-colors group-hover:text-primary/10" />
              </article>
            ))}
          </div>

          {page.careers && (
            <div className="mt-8 rounded-2xl glass-strong border border-primary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {bn ? "আমরা ক্রিয়েটিভ মানুষের সাথে কথা বলতে আগ্রহী — WhatsApp-এ যোগাযোগ করুন।" : "We love talking to creative people — reach us on WhatsApp."}
              </p>
              <div className="mt-4 flex justify-center"><CareersCta /></div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-10 grid gap-4 rounded-2xl glass border border-border p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {bn ? "আজই আপনার ব্যবসা ডিজিটাল করুন" : "Digitise your business today"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {bn ? "সেলস, স্টক, কাস্টমার ও বকেয়া — সব এক ড্যাশবোর্ডে। সাপোর্ট ২৪ ঘণ্টা।" : "Sales, stock, customers and dues in one dashboard. Support open 24 hours."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button className="bg-gradient-primary shadow-glow">{bn ? "ফ্রি শুরু করুন" : "Start free"}</Button>
              </Link>
              <Link to="/subscribe" search={{ plan: "quarterly" }}>
                <Button variant="outline">{bn ? "প্ল্যান দেখুন" : "See pricing"}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

