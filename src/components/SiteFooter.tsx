import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MessageCircle, Facebook, Youtube, Mail, Phone } from "lucide-react";

const WHATSAPP = "https://wa.me/8801317680620?text=Hello%20Ristop%20Software";

export function SiteFooter() {
  const { lang } = useI18n();
  const bn = lang === "bn";

  const columns: Array<{ title: string; links: Array<{ label: string; to?: string; slug?: string; href?: string }> }> = [
    {
      title: bn ? "প্রোডাক্ট" : "Product",
      links: [
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
        { label: bn ? "ক্যারিয়ার" : "Careers", slug: "careers" },
        { label: bn ? "ব্লগ" : "Blog", slug: "blog" },
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
        { label: bn ? "প্রাইভেসি পলিসি" : "Privacy policy", slug: "privacy" },
        { label: bn ? "শর্তাবলি" : "Terms of service", slug: "terms" },
        { label: bn ? "রিফান্ড পলিসি" : "Refund policy", slug: "refund" },
        { label: bn ? "গাইডলাইন" : "Guidelines", slug: "guidelines" },
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
              ? "বাংলাদেশের ব্যবসার জন্য সেলস, স্টক, কাস্টমার, সাপ্লায়ার ও বকেয়া ব্যবস্থাপনার পূর্ণাঙ্গ সফটওয়্যার।"
              : "Complete sales, stock, customer, supplier and dues management software for businesses in Bangladesh."}
          </p>
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <a href="tel:+8801317680620" className="flex items-center gap-2 hover:text-foreground"><Phone className="h-4 w-4" /> +880 1317 680620</a>
            <a href="mailto:support@ristopsoftware.com" className="flex items-center gap-2 hover:text-foreground"><Mail className="h-4 w-4" /> support@ristopsoftware.com</a>
          </div>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-foreground"><MessageCircle className="h-5 w-5" /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-foreground"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="font-semibold text-foreground">{col.title}</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.slug ? (
                    <Link to="/info/$slug" params={{ slug: l.slug }} className="transition-colors hover:text-foreground">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="transition-colors hover:text-foreground">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-5 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} Ristop Management — {bn ? "সব অধিকার সংরক্ষিত" : "All rights reserved"}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "USDT"].map((m) => (
              <span key={m} className="rounded-md border border-border bg-background/60 px-2 py-1 text-xs">{m}</span>
            ))}
          </div>
        </div>
        <p className="pb-5 text-center text-sm font-medium text-foreground/80">Managed by Ristop Software</p>
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
