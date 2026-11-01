import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { MEMBERSHIP_TIERS, type MembershipTierSlug } from "@/lib/membership";
import { toast } from "sonner";
import {
  Crown,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Percent,
  Award,
  Zap,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/special-membership")({
  head: () => ({
    meta: [
      { title: "Ristop Special Membership™ — Official Privilege Program" },
      {
        name: "description",
        content:
          "Join Ristop Special Membership™. Unlock up to 30% discount on subscriptions, exclusive Privilege Cards, priority support, and premium business perks.",
      },
      { property: "og:title", content: "Ristop Special Membership™" },
      {
        property: "og:description",
        content:
          "Unlock verified member privileges, digital Privilege Cards, and up to 30% discount across Ristop Management.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SpecialMembershipPage,
});

function SpecialMembershipPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const nav = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTierSlug>("special");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Application form fields
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessCategory: "Retail",
    country: "Bangladesh",
    reason: "",
    termsAgreed: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            setForm((prev) => ({
              ...prev,
              fullName: profile?.full_name || "",
              email: data.user.email || "",
              phone: profile?.phone || "",
              businessName: profile?.company_name || "",
            }));
          });
      }
    });
  }, []);

  const openApplicationFor = (tier: MembershipTierSlug) => {
    setSelectedTier(tier);
    setApplyModalOpen(true);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.termsAgreed) {
      toast.error(
        bn ? "শর্তাবলীতে সম্মত হতে হবে" : "You must agree to the terms and privacy policy.",
      );
      return;
    }
    if (!form.fullName || !form.email || !form.phone || !form.reason) {
      toast.error(bn ? "সব প্রয়োজনীয় ফিল্ড পূরণ করুন" : "Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: currentUser?.id || null,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        business_name: form.businessName.trim() || null,
        business_category: form.businessCategory,
        country: form.country,
        requested_tier: selectedTier,
        reason: form.reason.trim(),
        terms_agreed: true,
        status: "pending",
      };

      const { error } = await supabase.from("membership_applications").insert(payload);
      if (error) throw error;

      // Also log audit
      if (currentUser?.id) {
        await supabase.from("membership_audit_logs").insert({
          actor_id: currentUser.id,
          action: "membership_application_submitted",
          details: { tier: selectedTier, email: form.email },
        });
      }

      setSubmitted(true);
      toast.success(
        bn
          ? "আবেদন সফলভাবে গৃহীত হয়েছে! এডমিন টিম এটি পর্যালোচনা করবেন।"
          : "Application submitted successfully! Our team will review it shortly.",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Retail / Grocery",
    "Wholesale & Distribution",
    "Fashion & Lifestyle",
    "Electronics & Tech",
    "Restaurant & Cafe",
    "Pharmacy & Healthcare",
    "Corporate & Services",
    "E-commerce",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 md:h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {currentUser ? (
              <Link to="/membership">
                <Button size="sm" className="bg-gradient-primary shadow-glow gap-1.5">
                  <Crown className="h-4 w-4" /> {bn ? "আমার মেম্বারশিপ" : "My Membership"}
                </Button>
              </Link>
            ) : (
              <Link to="/auth" search={{ mode: "signin" }}>
                <Button variant="outline" size="sm" className="border-primary/40">
                  {bn ? "লগইন" : "Sign In"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden text-center px-4">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-60" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-primary/40 text-xs font-semibold text-primary-glow mb-6 shadow-glow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ristop Special Membership™</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gradient tracking-tight leading-tight">
            {bn
              ? "ব্যবসার মর্যাদাপূর্ণ সুবিধা ও বিশেষ ডিসকাউন্ট"
              : "Elevate Your Business With Official Privilege & Up to 30% Savings"}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {bn
              ? "রিস্টপ স্পেশাল মেম্বারশিপ™ প্রোগ্রামে যুক্ত হয়ে ডিজিটাল প্রিভিলেজ কার্ড, সফটওয়্যার সাবস্ক্রিপশনে ১৫% থেকে ৩০% পর্যন্ত নিশ্চিত ডিসকাউন্ট এবং অগ্রাধিকারমূলক সুবিধা উপভোগ করুন।"
              : "Join the official Ristop Special Membership™ program. Unlock exclusive Privilege Cards, verified QR authenticity, priority executive support, and up to 30% savings on subscriptions."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => openApplicationFor("special")}
              className="bg-gradient-primary shadow-glow hover:opacity-95 text-base px-8 h-12 gap-2"
            >
              <Crown className="h-5 w-5" />
              {bn ? "মেম্বারশিপের জন্য আবেদন করুন" : "Apply for Membership"}
            </Button>
            {currentUser && (
              <Link to="/membership">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/50 text-base h-12 gap-2"
                >
                  <QrCode className="h-5 w-5 text-primary-glow" />
                  {bn ? "মেম্বার ড্যাশবোর্ড" : "Member Portal"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-12 border-y border-border/50 bg-background/50">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          <div className="rounded-2xl glass border border-purple-500/20 p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Percent className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">
              {bn ? "সাবস্ক্রিপশনে ১৫% - ৩০% ডিসকাউন্ট" : "15% to 30% Subscription Discounts"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {bn
                ? "স্পেশাল মেম্বাররা ১৫%+, প্রিমিয়াম মেম্বাররা ২০% এবং ইলিট মেম্বাররা পান সর্বোচ্চ ৩০% ডিসকাউন্ট।"
                : "Special Members save 15%+, Premium save 20%, and Elite members save 30% on software subscriptions."}
            </p>
          </div>

          <div className="rounded-2xl glass border border-primary/20 p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary-glow mb-4">
              <QrCode className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">
              {bn ? "ডিজিটাল প্রিভিলেজ কার্ড" : "Digital Privilege Card & QR"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {bn
                ? "ইউনিক মেম্বার আইডি এবং সিকিউর কিউআর কোড ভেরিফিকেশন সহ প্রফেশনাল পার্পল, সিলভার বা গোল্ড কার্ড।"
                : "A distinct high-resolution digital card with verifiable QR code, unique Member ID, and PDF/PNG export."}
            </p>
          </div>

          <div className="rounded-2xl glass border border-amber-500/20 p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">
              {bn ? "অনবোর্ডিং ও সাপোর্ট অগ্রাধিকার" : "Executive Priority Onboarding"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {bn
                ? "ব্যবসার প্রবৃদ্ধি দ্রুত নিশ্চিত করতে ডেডিকেটেড সাপোর্ট চ্যানেল ও অগ্রাধিকারভিত্তিক সেবা।"
                : "Priority escalation, personalized onboarding guidance, and eligible future community privileges."}
            </p>
          </div>
        </div>
      </section>

      {/* Three Membership Tiers */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gradient">
              {bn ? "আপনার পছন্দের মেম্বারশিপ টায়ার বেছে নিন" : "Select Your Membership Tier"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {bn
                ? "প্রতিটি টায়ারে রয়েছে সুনির্দিষ্ট ও বাস্তব সুবিধা। এডমিন অনুমোদনের পর কার্ড ও সুবিধা চালু হয়।"
                : "Real, transparent benefits configured to empower your business. Membership is activated upon admin review."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Special Member */}
            <div className="rounded-3xl glass border border-purple-500/40 p-7 flex flex-col justify-between hover:border-purple-400 transition-all shadow-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {bn ? "স্পেশাল মেম্বার" : "Special Member"}
                </div>
                <h3 className="text-2xl font-bold mt-3">
                  {bn ? "স্পেশাল মেম্বার" : "Special Member"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn ? "ডিজিটাল কার্ড ও প্রাথমিক সুবিধা" : "Complimentary digital privilege card"}
                </p>

                <div className="mt-5 pb-5 border-b border-border/60">
                  <div className="text-3xl font-black text-white">
                    {bn ? "বিনামূল্যে (৳০)" : "Free (৳0)"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bn ? "বার্ষিক ভ্যালিডিটি" : "Annual validity"}
                  </div>
                  <div className="mt-2 text-xs font-medium text-purple-300 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    <span>{bn ? "সাবস্ক্রিপশনে ১৫%+ ছাড়" : "15%+ discount on subscriptions"}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {(bn
                    ? MEMBERSHIP_TIERS.special.benefits_bn
                    : MEMBERSHIP_TIERS.special.benefits
                  ).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => openApplicationFor("special")}
                className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {bn ? "স্পেশাল মেম্বার আবেদন" : "Apply for Special"}
              </Button>
            </div>

            {/* Premium Member */}
            <div className="rounded-3xl glass border-2 border-slate-300/80 p-7 flex flex-col justify-between hover:border-slate-200 transition-all shadow-glow relative overflow-hidden bg-gradient-to-b from-slate-900/40 to-purple-950/20">
              <div className="absolute -top-3 right-5 px-3 py-1 bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider">
                {bn ? "জনপ্রিয়" : "Popular"}
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-300/20 text-slate-200 border border-slate-400/40">
                  {bn ? "প্রিমিয়াম মেম্বার" : "Premium Member"}
                </div>
                <h3 className="text-2xl font-bold mt-3 text-slate-100">
                  {bn ? "প্রিমিয়াম মেম্বার" : "Premium Member"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn
                    ? "সিলভার কার্ড ও দ্রুত প্রায়োরিটি কেয়ার"
                    : "Silver metallic card with priority care"}
                </p>

                <div className="mt-5 pb-5 border-b border-border/60">
                  <div className="text-3xl font-black text-slate-100">
                    ৳299{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {bn ? "বছর" : "yr"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bn ? "বাৎসরিক নবায়নযোগ্য" : "Annual billing"}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-300 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    <span>
                      {bn ? "সাবস্ক্রিপশনে ২০% নিশ্চিত ছাড়" : "20% discount on subscriptions"}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {(bn
                    ? MEMBERSHIP_TIERS.premium.benefits_bn
                    : MEMBERSHIP_TIERS.premium.benefits
                  ).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => openApplicationFor("premium")}
                className="mt-8 w-full bg-slate-200 hover:bg-white text-slate-950 font-bold shadow-md"
              >
                {bn ? "প্রিমিয়াম মেম্বার আবেদন" : "Apply for Premium"}
              </Button>
            </div>

            {/* Elite Member */}
            <div className="rounded-3xl glass border-2 border-amber-400/80 p-7 flex flex-col justify-between hover:border-amber-300 transition-all shadow-glow relative overflow-hidden bg-gradient-to-b from-amber-950/30 to-purple-950/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {bn ? "ইলিট মেম্বার (সর্বোচ্চ)" : "Elite Member (Top)"}
                </div>
                <h3 className="text-2xl font-bold mt-3 text-amber-100">
                  {bn ? "ইলিট মেম্বার" : "Elite Member"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn
                    ? "লাক্সারি গোল্ড কার্ড ও ভিআইপি অনবোর্ডিং"
                    : "Lustrous gold card & executive VIP onboarding"}
                </p>

                <div className="mt-5 pb-5 border-b border-border/60">
                  <div className="text-3xl font-black text-amber-300">
                    ৳999{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {bn ? "বছর" : "yr"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bn ? "বাৎসরিক ভিআইপি স্ট্যাটাস" : "Annual VIP tier"}
                  </div>
                  <div className="mt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>
                      {bn
                        ? "সাবস্ক্রিপশনে ৩০% সর্বোচ্চ ছাড়"
                        : "30% highest discount on subscriptions"}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {(bn ? MEMBERSHIP_TIERS.elite.benefits_bn : MEMBERSHIP_TIERS.elite.benefits).map(
                    (b, i) => (
                      <li key={i} className="flex items-start gap-2 text-amber-100/90">
                        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <Button
                onClick={() => openApplicationFor("elite")}
                className="mt-8 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black shadow-lg"
              >
                {bn ? "ইলিট মেম্বার আবেদন" : "Apply for Elite"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Application Guide & FAQ */}
      <section className="py-16 bg-card/40 border-t border-border">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">
              {bn ? "মেম্বারশিপ আবেদন প্রক্রিয়া" : "Application & Activation Process"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {bn
                ? "স্বচ্ছ ও নিরাপদ প্রক্রিয়ায় কার্ড অ্যাক্টিভেশন"
                : "Transparent, verified membership issuance"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-14 text-center">
            <div className="p-4 rounded-xl glass border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-glow mx-auto flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <h3 className="font-semibold text-sm">{bn ? "আবেদন জমা" : "Submit Form"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {bn ? "টায়ার নির্বাচন ও তথ্য প্রদান" : "Select tier and provide details"}
              </p>
            </div>
            <div className="p-4 rounded-xl glass border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-glow mx-auto flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <h3 className="font-semibold text-sm">{bn ? "এডমিন রিভিউ" : "Admin Review"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {bn ? "অধিকারপ্রাপ্ত টিম দ্বারা যাচাই" : "Verification by authorized team"}
              </p>
            </div>
            <div className="p-4 rounded-xl glass border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-glow mx-auto flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <h3 className="font-semibold text-sm">
                {bn ? "পেমেন্ট (পেইড হলে)" : "Payment (Paid)"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {bn ? "অনুমোদনের পর নিরাপদ পেমেন্ট" : "Secure payment after approval"}
              </p>
            </div>
            <div className="p-4 rounded-xl glass border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-glow mx-auto flex items-center justify-center font-bold text-sm mb-2">
                4
              </div>
              <h3 className="font-semibold text-sm">
                {bn ? "কার্ড ও সুবিধা চালু" : "Privilege Card"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {bn ? "ডিজিটাল কার্ড ও ডিসকাউন্ট চালু" : "Instant QR card & discount unlocked"}
              </p>
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary-glow" />
              {bn ? "সচরাচর জিজ্ঞাসিত প্রশ্নাবলী" : "Frequently Asked Questions"}
            </h3>

            <div className="rounded-xl glass border border-border p-4">
              <div className="font-semibold text-sm">
                {bn
                  ? "মেম্বারশিপ নিলে সফটওয়্যার সাবস্ক্রিপশনে কিভাবে ডিসকাউন্ট পাব?"
                  : "How does the subscription discount work?"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {bn
                  ? "আপনার মেম্বারশিপ অ্যাক্টিভ থাকলে সাবস্ক্রিপশন পেজে স্বয়ংক্রিয়ভাবে আপনার টায়ার অনুযায়ী (স্পেশাল: ১৫%+, প্রিমিয়াম: ২০%, ইলিট: ৩০%) ডিসকাউন্ট যুক্ত হবে।"
                  : "Once active, your tier discount (Special: 15%+, Premium: 20%, Elite: 30%) automatically applies to your subscription checkout."}
              </p>
            </div>

            <div className="rounded-xl glass border border-border p-4">
              <div className="font-semibold text-sm">
                {bn
                  ? "কার্ডটি কিভাবে ডাউনলোড বা ব্যবহার করতে পারি?"
                  : "How do I access and download my Privilege Card?"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {bn
                  ? "আপনার ইউজার ড্যাশবোর্ডের 'মেম্বারশিপ' সেকশন থেকে যেকোনো সময় হাই-রেজোলিউশন PNG বা PDF ফরম্যাটে কার্ড ডাউনলোড করতে পারবেন।"
                  : "From your user dashboard under the 'Membership' section, you can view your card anytime and export it in high-resolution PNG or PDF formats."}
              </p>
            </div>

            <div className="rounded-xl glass border border-border p-4">
              <div className="font-semibold text-sm">
                {bn
                  ? "যেকোনো ব্যক্তি কি কিউআর কোড স্ক্যান করে কার্ড ভেরিফাই করতে পারে?"
                  : "Can anyone verify the QR code on my card?"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {bn
                  ? "হ্যাঁ, যেকোনো স্মার্টফোনে কিউআর কোড স্ক্যান করলে রিস্টপ-এর অফিসিয়াল ভেরিফিকেশন পেজে মেম্বারের নাম, টায়ার ও স্ট্যাটাস যাচাই করা যাবে। কোনো গোপনীয় ব্যক্তিগত তথ্য প্রদর্শিত হয় না।"
                  : "Yes. Scanning the QR code opens the official public verification page displaying Member Name, Tier, and Status securely without leaking private phone or database details."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary-glow" />
              {bn ? "স্পেশাল মেম্বারশিপ আবেদন" : "Special Membership Application"}
            </DialogTitle>
            <DialogDescription>
              {bn
                ? "সঠিক তথ্য দিয়ে নিচের ফরমটি পূরণ করুন। আমাদের টিম দ্রুত যাচাই করে সিদ্ধান্ত জানাবেন।"
                : "Please fill in the details below. Our administrative team will review your application."}
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gradient">
                {bn ? "আবেদন সফলভাবে গৃহীত হয়েছে!" : "Application Received!"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {bn
                  ? "আপনার আবেদনটি অ্যাডমিন রিভিউয়ের জন্য পাঠানো হয়েছে। অনুমোদনের পর আপনাকে নোটিফিকেশন জানানো হবে।"
                  : "Your application is under review. You will be notified in your dashboard once reviewed."}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                {currentUser ? (
                  <Button
                    onClick={() => nav({ to: "/membership" })}
                    className="bg-gradient-primary"
                  >
                    {bn ? "মেম্বারশিপ পেজে যান" : "Go to Membership"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => nav({ to: "/auth", search: { mode: "signup" } })}
                    className="bg-gradient-primary"
                  >
                    {bn ? "একটি একাউন্ট তৈরি করুন" : "Create an Account"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-4 mt-2">
              {!currentUser && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <span>
                    {bn
                      ? "লগইন করা থাকলে আবেদনটি স্বয়ংক্রিয়ভাবে আপনার একাউন্টের সাথে যুক্ত হবে।"
                      : "Log in to link this application directly to your account."}
                  </span>
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    className="underline font-bold shrink-0 ml-2"
                  >
                    {bn ? "লগইন করুন" : "Sign In"}
                  </Link>
                </div>
              )}

              <div>
                <Label>{bn ? "আবেদিত মেম্বারশিপ টায়ার" : "Requested Membership Tier"}</Label>
                <Select
                  value={selectedTier}
                  onValueChange={(v) => setSelectedTier(v as MembershipTierSlug)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="special">
                      {bn
                        ? "স্পেশাল মেম্বার (বিনামূল্যে — ১৫%+ ডিসকাউন্ট)"
                        : "Special Member (Free — 15%+ discount)"}
                    </SelectItem>
                    <SelectItem value="premium">
                      {bn
                        ? "প্রিমিয়াম মেম্বার (৳২৯৯/বছর — ২০% ডিসকাউন্ট)"
                        : "Premium Member (৳299/yr — 20% discount)"}
                    </SelectItem>
                    <SelectItem value="elite">
                      {bn
                        ? "ইলিট মেম্বার (৳৯৯৯/বছর — ৩০% ডিসকাউন্ট)"
                        : "Elite Member (৳999/yr — 30% discount)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{bn ? "পুরো নাম" : "Full Name"} *</Label>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="mt-1"
                    placeholder="Adnan Sami"
                  />
                </div>
                <div>
                  <Label>{bn ? "ইমেইল" : "Email"} *</Label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1"
                    placeholder="name@business.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{bn ? "ফোন নম্বর" : "Phone Number"} *</Label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1"
                    placeholder="018XXXXXXXX"
                  />
                </div>
                <div>
                  <Label>{bn ? "ব্যবসা / প্রতিষ্ঠানের নাম (ঐচ্ছিক)" : "Business / Org Name"}</Label>
                  <Input
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="mt-1"
                    placeholder="Ristop Enterprise"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{bn ? "ব্যবসার ক্যাটাগরি" : "Business Category"} *</Label>
                  <Select
                    value={form.businessCategory}
                    onValueChange={(v) => setForm({ ...form, businessCategory: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{bn ? "দেশ" : "Country"}</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>{bn ? "মেম্বারশিপে যুক্ত হওয়ার কারণ" : "Reason for Joining"} *</Label>
                <Textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={
                    bn
                      ? "কেন আপনি রিস্টপ স্পেশাল মেম্বারশিপে যুক্ত হতে আগ্রহী? আপনার লক্ষ্য সংক্ষেপে লিখুন।"
                      : "Why would you like to join the Special Membership program?"
                  }
                  className="mt-1 text-sm"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={form.termsAgreed}
                  onChange={(e) => setForm({ ...form, termsAgreed: e.target.checked })}
                  className="mt-1 rounded accent-purple-600"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  {bn
                    ? "আমি রিস্টপ ম্যানেজমেন্ট-এর মেম্বারশিপ শর্তাবলী, প্রাইভেসি পলিসি ও ব্যবহারের নিয়মাবলীতে সম্মত হচ্ছি।"
                    : "I agree to Ristop Special Membership terms, privacy guidelines, and membership rules."}
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary shadow-glow h-11 text-base mt-2"
              >
                {loading ? "..." : bn ? "আবেদন জমা দিন" : "Submit Application"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
