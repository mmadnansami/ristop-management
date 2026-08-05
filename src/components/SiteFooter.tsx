import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MessageCircle, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

const WHATSAPP = "https://wa.me/8801317680620?text=Hello%20Ristop%20Software";

/** Payment methods accepted for Ristop Management subscriptions. */
const PAY_METHODS = [
  "bKash", "Nagad", "Rocket", "Upay", "Tap", "SureCash",
  "Visa", "Mastercard", "Amex", "UnionPay", "American Express",
  "DBBL", "BRAC Bank", "City Bank", "IFIC Bank", "Islami Bank", "EBL", "MTB",
  "SSLCOMMERZ", "PayPal", "Payoneer", "Wise", "Skrill",
  "USDT (TRC20)", "USDT (BEP20)", "Binance Pay",
  "Google Pay", "Apple Pay", "Bank Transfer",
];

export function SiteFooter() {
  const { lang } = useI18n();
  const bn = lang === "bn";

  const columns: Array<{ title: string; links: Array<{ label: string; to?: string; slug?: string; href?: string }> }> = [
    {
      title: bn ? "প্রোডাক্ট" : "Product",
      links: [
        { label: bn ? "হোম" : "Home", to: "/" },
        { label: bn ? "ফিচারসমূহ" : "Features", href: "/#features" },
        { label: bn ? "মূল্য ও প্ল্যান" : "Pricing", href: "/#pricing" },
        { label: bn ? "ডেমো ভিডিও" : "Demo video", href: "/#demo" },
        { label: bn ? "ফ্রি ট্রায়াল" : "Free trial", slug: "free-trial" },
        { label: bn ? "নিয়মিত আপডেট" : "Regular updates", slug: "updates" },
      ],
    },
    {
      title: bn ? "কোম্পানি" : "Company",
      links: [
        { label: bn ? "আমাদের সম্পর্কে" : "About us", slug: "about" },
        { label: bn ? "ব্লগ" : "Blog", slug: "blog" },
        { label: bn ? "ক্যারিয়ার" : "Careers", slug: "careers" },
        { label: bn ? "যোগাযোগ" : "Contact", slug: "contact" },
        { label: bn ? "রেফারেল প্রোগ্রাম" : "Referral program", slug: "referral" },
        { label: bn ? "অ্যাফিলিয়েট পার্টনার" : "Affiliate partner", slug: "affiliate" },
      ],
    },
    {
      title: bn ? "রিসোর্স" : "Resources",
      links: [
        { label: bn ? "হেল্প সেন্টার" : "Help center", slug: "help" },
        { label: bn ? "ডকুমেন্টেশন" : "Documentation", slug: "docs" },
        { label: bn ? "কেস স্টাডি" : "Case studies", slug: "case-studies" },
        { label: bn ? "কাস্টমার রিভিউ" : "Customer reviews", slug: "reviews" },
        { label: bn ? "দ্রুত সাপোর্ট" : "Fast support", slug: "support" },
        { label: bn ? "সিকিউরিটি" : "Security", slug: "security" },
      ],
    },
    {
      title: bn ? "লিগ্যাল" : "Legal",
      links: [
        { label: bn ? "প্রাইভেসি" : "Privacy", slug: "privacy" },
        { label: bn ? "শর্তাবলি" : "Terms", slug: "terms" },
        { label: bn ? "রিফান্ড পলিসি" : "Refund policy", slug: "refund" },
        { label: bn ? "ব্যবহার গাইডলাইন" : "Usage guidelines", slug: "guidelines" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/35">
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <Logo className="h-10 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {bn
              ? "আপনার ব্যবসা এক জায়গা থেকে চালান — সেলস, স্টক, কাস্টমার, সাপ্লায়ার ও বকেয়া, সবই এক ড্যাশবোর্ডে।"
              : "Run your whole business from one place — sales, stock, customers, suppliers and dues in a single dashboard."}
          </p>
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <a href="tel:+8801317680620" className="flex items-center gap-2 hover:text-foreground"><Phone className="h-4 w-4" /> +880 1317 680620</a>
            <a href="mailto:support@ristopsoftware.com" className="flex items-center gap-2 break-all hover:text-foreground"><Mail className="h-4 w-4 shrink-0" /> support@ristopsoftware.com</a>
          </div>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-foreground"><MessageCircle className="h-5 w-5" /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-foreground"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.slug ? (
                    <Link to="/info/$slug" params={{ slug: l.slug }} className="transition-colors hover:text-foreground">{l.label}</Link>
                  ) : l.to ? (
                    <Link to={l.to} className="transition-colors hover:text-foreground">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="transition-colors hover:text-foreground">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Corporate identity */}
      <div className="border-t border-border">
        <div className="container mx-auto grid gap-6 px-4 py-7 md:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground">Ristop Management {bn ? "(পরিচালনায় Ristop Software)" : "(Managed by Ristop Software)"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bn ? "ট্রেড লাইসেন্স নং: " : "E-Trade License No: "}TRAD/RSTP/2026-0113
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bn ? "সফটওয়্যার সংস্করণ: " : "Software version: "}Ristop Management v1.0 (Cloud)
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-semibold text-foreground">{bn ? "কর্পোরেট অফিস" : "Corporate Office"}</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground md:justify-end">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{bn ? "উত্তরা, ঢাকা, বাংলাদেশ" : "Uttara, Dhaka, Bangladesh"}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bn ? "সাপোর্ট: সকাল ৯টা – রাত ১০টা (ঢাকা)" : "Support: 9:00 AM – 10:00 PM (Dhaka)"}
            </p>
          </div>
        </div>
      </div>

      {/* Pay with */}
      <div className="border-t border-border bg-background/40">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 md:flex-row md:items-start">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:w-24 md:pt-1">
            {bn ? "পে উইথ" : "Pay With"}
          </p>
          <div className="flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-5 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} Ristop Management. {bn ? "সব অধিকার সংরক্ষিত।" : "All rights reserved."}</p>
          <p className="font-medium text-foreground/80">Managed by Ristop Software</p>
        </div>
      </div>
    </footer>
  );
}

export function CareersCta() {
  const { lang } = useI18n();
  return (
    <a href={`${WHATSAPP}%2C%20I%20would%20like%20to%20send%20my%20CV.`} target="_blank" rel="noreferrer" className="inline-block">
      <Button variant="outline" className="gap-2 border-success/50">
        <MessageCircle className="h-4 w-4 text-success" />
        {lang === "bn" ? "WhatsApp-এ CV পাঠান (01317680620)" : "Send CV on WhatsApp (01317680620)"}
      </Button>
    </a>
  );
}
