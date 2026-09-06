import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Copy, Tag } from "lucide-react";
import { PLANS, PLAN_LIST, formatPrice, priceOf, originalPriceOf, type Currency, type PlanId } from "@/lib/pricing";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Pricing & Subscription — Ristop Management" },
      { name: "description", content: "Ristop Management plans in BDT and USD/USDT: monthly from ৳190 ($3), 3 months $10, 6 months $16. Apply a coupon at checkout." },
      { property: "og:title", content: "Pricing & Subscription — Ristop Management" },
      { property: "og:description", content: "Choose a Ristop Management plan in BDT or USD/USDT and pay with bKash, Nagad or USDT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    plan: (["monthly", "quarterly", "biannual"].includes(s.plan as string) ? s.plan : "quarterly") as PlanId,
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { plan } = Route.useSearch();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const nav = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(plan);
  const [currency, setCurrency] = useState<Currency>("BDT");
  const [coupon, setCoupon] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", method: "bkash", txn: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activePlan = PLANS[selectedPlan];
  const amount = priceOf(activePlan, currency);
  const original = originalPriceOf(activePlan, currency);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().min(1).max(80),
      email: z.string().email().max(255),
      phone: z.string().min(11).max(20),
      method: z.enum(["bkash", "nagad", "usdt"]),
      txn: z.string().min(4).max(50),
    });
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(bn ? "সব ফিল্ড সঠিকভাবে পূরণ করুন" : "Please fill all fields correctly"); return; }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const refCode = (typeof window !== "undefined" ? localStorage.getItem("ristop_ref_code") : null) || null;
    const payload = {
      name: form.name, email: form.email, phone: form.phone,
      plan: selectedPlan, payment_method: form.method, transaction_id: form.txn,
      amount,
      user_id: userData.user?.id ?? null,
      currency,
      coupon_code: coupon.trim() || null,
      affiliate_code: refCode,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("subscription_requests").insert(payload as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const msg = `New Ristop Subscription Request\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nPlan: ${selectedPlan} (${formatPrice(amount, currency)})\nCurrency: ${currency}\nCoupon: ${coupon || "-"}\nMethod: ${form.method}\nTxnID: ${form.txn}`;
    window.open(`https://wa.me/8801317680620?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    toast.success(bn ? "রিকোয়েস্ট সাবমিট হয়েছে! ভেরিফিকেশন শেষে এক্সেস পাবেন।" : "Request submitted! Access will be activated after verification.");
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", method: "bkash", txn: "" });
    setCoupon("");
  };

  const payNumber = form.method === "bkash" ? "01888616396" : form.method === "nagad" ? "01317680620" : "USDT (TRC20) — request wallet on WhatsApp";

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/"><Logo className="h-10 w-auto" /></Link>
        <LanguageToggle />
      </header>
      <main className="container mx-auto flex-1 px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> {bn ? "হোম" : "Back"}</Link>
        <div className="rounded-2xl glass border border-primary/30 shadow-glow p-5 sm:p-7">
          <h1 className="text-2xl font-bold text-gradient">{bn ? "সাবসক্রিপশন কিনুন" : "Buy Subscription"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bn ? "পেমেন্ট করার পর তথ্য সাবমিট করুন। আমরা ভেরিফাই করে আপনার ইমেইলে এক্সেস একটিভ করে দিবো।" : "Pay first, then submit your details. We'll verify and activate access on your email."}</p>

          {submitted ? (
            <div className="mt-6 rounded-2xl glass-strong border border-success/30 p-6 text-center">
              <h2 className="text-2xl font-bold text-gradient">Thank you!</h2>
              <p className="mt-2 text-sm text-muted-foreground">{bn ? "আপনার সাবসক্রিপশন রিকোয়েস্ট কনফার্ম হয়েছে। ভেরিফিকেশন শেষে এক্সেস একটিভ হবে।" : "Your subscription request is confirmed. Access will be activated after verification."}</p>
              <Button onClick={() => nav({ to: "/" })} className="mt-5 bg-gradient-primary shadow-glow">{bn ? "হোমে যান" : "Go Home"}</Button>
            </div>
          ) : <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>{bn ? "কারেন্সি" : "Currency"}</Label>
              <div className="mt-2 flex gap-2">
                {(["BDT", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCurrency(c); if (c === "USD") setForm((f) => ({ ...f, method: "usdt" })); else setForm((f) => ({ ...f, method: "bkash" })); }}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${currency === c ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {c === "BDT" ? "৳ BDT" : "$ USD / USDT"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{bn ? "প্ল্যান সিলেক্ট" : "Select plan"}</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanId)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {(bn ? p.label_bn : p.label_en)} — {formatPrice(priceOf(p, currency), currency)}
                      {originalPriceOf(p, currency) ? ` (${bn ? "ডিসকাউন্ট" : "was"} ${formatPrice(originalPriceOf(p, currency)!, currency)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>{bn ? "নাম" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} className="mt-1" /></div>
              <div><Label>Email ({bn ? "যেটায় একটিভ করতে চান" : "to activate on"})</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" /></div>
            </div>
            <div><Label>{bn ? "ফোন নম্বর" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1" /></div>

            <div>
              <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary-glow" />{bn ? "কুপন কোড (ঐচ্ছিক)" : "Coupon code (optional)"}</Label>
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} maxLength={30} className="mt-1" placeholder={bn ? "কুপন থাকলে লিখুন" : "Enter your coupon"} />
              <p className="mt-1 text-xs text-muted-foreground">{bn ? "কুপন থাকলে ভেরিফিকেশনের সময় ডিসকাউন্ট প্রয়োগ করা হবে।" : "If you have a coupon, the discount is applied during verification."}</p>
            </div>

            <div>
              <Label>{bn ? "পেমেন্ট মাধ্যম" : "Payment method"}</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currency === "BDT" ? (
                    <>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="nagad">Nagad</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="usdt">USDT / USD</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl bg-gradient-card border border-primary/30 p-4">
              <div className="text-xs text-muted-foreground">{form.method === "usdt" ? (bn ? "USDT পেমেন্টের জন্য WhatsApp-এ ওয়ালেট নিন" : "Request the USDT wallet on WhatsApp") : (bn ? "এই নম্বরে Send Money করুন" : "Send Money to this number")}</div>
              <div className="flex items-center justify-between gap-3 mt-1">
                <div className="text-base sm:text-xl font-bold text-gradient break-all">{payNumber}</div>
                <button type="button" onClick={() => { navigator.clipboard.writeText(payNumber); toast.success("Copied!"); }} className="shrink-0 text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></button>
              </div>
              {currency === "BDT" && (
                <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
                  {[
                    { label: "bKash", num: "01888616396" },
                    { label: bn ? "নগদ" : "Nagad", num: "+8801317680620" },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {p.num}
                        <button type="button" aria-label={`Copy ${p.label} number`} onClick={() => { navigator.clipboard.writeText(p.num); toast.success("Copied!"); }} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm mt-2 flex items-baseline gap-2">
                <span>{bn ? "পরিমাণ" : "Amount"}:</span>
                <span className="font-bold">{formatPrice(amount, currency)}</span>
                {original && <span className="text-xs text-muted-foreground line-through">{formatPrice(original, currency)}</span>}
              </div>
            </div>


            <div><Label>{bn ? "ট্রানজেকশন আইডি" : "Transaction ID"}</Label><Input value={form.txn} onChange={(e) => setForm({ ...form, txn: e.target.value })} required className="mt-1" placeholder="e.g. 8N7A1BCD2X" /></div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow h-11">
              {loading ? "..." : (bn ? "সাবমিট করুন" : "Submit")}
            </Button>
          </form>}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
