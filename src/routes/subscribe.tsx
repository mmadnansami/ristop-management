import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Copy } from "lucide-react";

const PLANS = {
  monthly: { price: 399, label_bn: "একমাসিক", label_en: "Monthly" },
  quarterly: { price: 799, label_bn: "তৃমাসিক", label_en: "Quarterly" },
  biannual: { price: 1199, label_bn: "ছয়মাসিক", label_en: "Biannual" },
} as const;

export const Route = createFileRoute("/subscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ plan: (["monthly", "quarterly", "biannual"].includes(s.plan as string) ? s.plan : "quarterly") as keyof typeof PLANS }),
  component: SubscribePage,
});

function SubscribePage() {
  const { plan } = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>(plan);
  const [form, setForm] = useState({ name: "", email: "", phone: "", method: "bkash", txn: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().min(1).max(80),
      email: z.string().email().max(255),
      phone: z.string().min(11).max(20),
      method: z.enum(["bkash", "nagad"]),
      txn: z.string().min(4).max(50),
    });
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(lang === "bn" ? "সব ফিল্ড সঠিকভাবে পূরণ করুন" : "Please fill all fields correctly"); return; }
    setLoading(true);
    const { error } = await supabase.from("subscription_requests").insert({
      name: form.name, email: form.email, phone: form.phone,
      plan: selectedPlan, payment_method: form.method, transaction_id: form.txn,
      amount: PLANS[selectedPlan].price,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    // Notify admin on WhatsApp
    const msg = `New Ristop Subscription Request\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nPlan: ${selectedPlan} (৳${PLANS[selectedPlan].price})\nMethod: ${form.method}\nTxnID: ${form.txn}`;
    window.open(`https://wa.me/8801317680620?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    toast.success(lang === "bn" ? "রিকোয়েস্ট সাবমিট হয়েছে! ভেরিফিকেশন শেষে এক্সেস পাবেন।" : "Request submitted! Access will be activated after verification.");
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", method: "bkash", txn: "" });
  };

  const payNumber = form.method === "bkash" ? "01888616396" : "01317680620";

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/"><Logo className="h-16 w-auto" /></Link>
        <LanguageToggle />
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="rounded-2xl glass border border-primary/30 shadow-glow p-7">
          <h1 className="text-2xl font-bold text-gradient">{lang === "bn" ? "সাবসক্রিপশন কিনুন" : "Buy Subscription"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "পেমেন্ট করার পর তথ্য সাবমিট করুন। আমরা ভেরিফাই করে আপনার ইমেইলে এক্সেস একটিভ করে দিবো।" : "Pay first, then submit your details. We'll verify and activate access on your email."}</p>

          {submitted ? (
            <div className="mt-6 rounded-2xl glass-strong border border-success/30 p-6 text-center">
              <h2 className="text-2xl font-bold text-gradient">{lang === "bn" ? "Thank you!" : "Thank you!"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{lang === "bn" ? "আপনার সাবসক্রিপশন রিকোয়েস্ট কনফার্ম হয়েছে। ভেরিফিকেশন শেষে এক্সেস একটিভ হবে।" : "Your subscription request is confirmed. Access will be activated after verification."}</p>
              <Button onClick={() => nav({ to: "/" })} className="mt-5 bg-gradient-primary shadow-glow">{lang === "bn" ? "হোমে যান" : "Go Home"}</Button>
            </div>
          ) : <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>{lang === "bn" ? "প্ল্যান সিলেক্ট" : "Select plan"}</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as keyof typeof PLANS)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLANS).map(([k, p]) => (
                    <SelectItem key={k} value={k}>{lang === "bn" ? p.label_bn : p.label_en} — ৳{p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>{lang === "bn" ? "নাম" : "Name"}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} className="mt-1" /></div>
              <div><Label>Email ({lang === "bn" ? "যেটায় একটিভ করতে চান" : "to activate on"})</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" /></div>
            </div>
            <div><Label>{lang === "bn" ? "ফোন নম্বর" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1" /></div>

            <div>
              <Label>{lang === "bn" ? "পেমেন্ট মাধ্যম" : "Payment method"}</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl bg-gradient-card border border-primary/30 p-4">
              <div className="text-xs text-muted-foreground">{lang === "bn" ? "এই নম্বরে Send Money করুন" : "Send Money to this number"}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xl font-bold text-gradient">{payNumber}</div>
                <button type="button" onClick={() => { navigator.clipboard.writeText(payNumber); toast.success("Copied!"); }} className="text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></button>
              </div>
              <div className="text-sm mt-2">{lang === "bn" ? "পরিমাণ" : "Amount"}: <span className="font-bold">৳{PLANS[selectedPlan].price}</span></div>
            </div>

            <div><Label>{lang === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}</Label><Input value={form.txn} onChange={(e) => setForm({ ...form, txn: e.target.value })} required className="mt-1" placeholder="e.g. 8N7A1BCD2X" /></div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow h-11">
              {loading ? "..." : (lang === "bn" ? "সাবমিট করুন" : "Submit")}
            </Button>
          </form>}
        </div>
      </main>
    </div>
  );
}
