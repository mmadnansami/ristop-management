import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Gift, Link2, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const affiliateSchema = z.object({
  full_name: z.string().trim().min(2).max(120), business_name: z.string().trim().max(120),
  email: z.string().trim().email().max(255), phone: z.string().trim().min(5).max(30),
  country: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(80),
  website: z.string().trim().max(255), social_link: z.string().trim().max(255), experience: z.string().trim().max(1200),
});

export function PartnerCenter() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdraw, setWithdraw] = useState({ amount: "", method: "bkash", account_details: "" });
  const [form, setForm] = useState({ full_name: "", business_name: "", email: "", phone: "", country: "Bangladesh", city: "", website: "", social_link: "", experience: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["partner-center"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const [profile, referrals, affiliate, settings] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,referral_code,reward_months,successful_referral_count").eq("id", auth.user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", auth.user.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_applications").select("*").eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("affiliate_settings").select("minimum_withdrawal").maybeSingle(),
      ]);
      let commissions: Array<{ commission_amount: number; status: string; created_at: string }> = [];
      let withdrawals: Array<{ id: string; amount: number; method: string; status: string; requested_at: string }> = [];
      if (affiliate.data) {
        const [c, w] = await Promise.all([
          supabase.from("affiliate_commissions").select("commission_amount,status,created_at").eq("affiliate_id", affiliate.data.id),
          supabase.from("affiliate_withdrawals").select("id,amount,method,status,requested_at").eq("affiliate_id", affiliate.data.id).order("requested_at", { ascending: false }),
        ]);
        commissions = c.data ?? [];
        withdrawals = w.data ?? [];
      }
      return { user: auth.user, profile: profile.data, referrals: referrals.data ?? [], affiliate: affiliate.data, commissions, withdrawals, minimum: Number(settings.data?.minimum_withdrawal ?? 50) };
    },
  });

  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success(bn ? "কপি হয়েছে" : "Copied"); };
  const share = async (value: string) => {
    if (navigator.share) await navigator.share({ title: "Ristop Management", text: bn ? "আমার Ristop লিংক" : "My Ristop link", url: value });
    else await copy(value);
  };

  const apply = async () => {
    const parsed = affiliateSchema.safeParse(form);
    if (!parsed.success || !data?.user) { toast.error(bn ? "সঠিকভাবে সব প্রয়োজনীয় তথ্য দিন" : "Complete all required fields correctly"); return; }
    setSaving(true);
    const values = parsed.data;
    const { error } = await supabase.from("affiliate_applications").insert({
      user_id: data.user.id, full_name: values.full_name, business_name: values.business_name || null,
      email: values.email, phone: values.phone, country: values.country, city: values.city,
      website: values.website || null, social_link: values.social_link || null, experience: values.experience || null,
    });
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success(bn ? "আবেদন জমা হয়েছে" : "Application submitted"); void qc.invalidateQueries({ queryKey: ["partner-center"] }); }
  };

  const requestWithdrawal = async () => {
    const amount = Number(withdraw.amount);
    if (!data?.affiliate || !Number.isFinite(amount) || amount < data.minimum || amount > Number(data.affiliate.pending_commission) || withdraw.account_details.trim().length < 3) {
      toast.error(bn ? `সর্বনিম্ন ${data?.minimum ?? 50} টাকা এবং সঠিক account details দিন` : `Minimum withdrawal is ${data?.minimum ?? 50}; check amount and account details`); return;
    }
    setSaving(true);
    const { error } = await supabase.from("affiliate_withdrawals").insert({ affiliate_id: data.affiliate.id, amount, method: withdraw.method, account_details: withdraw.account_details.trim() });
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success(bn ? "উইথড্র রিকোয়েস্ট জমা হয়েছে" : "Withdrawal requested"); setWithdrawOpen(false); void qc.invalidateQueries({ queryKey: ["partner-center"] }); }
  };

  if (isLoading) return <div className="rounded-2xl glass p-6 text-sm text-muted-foreground">{bn ? "লোড হচ্ছে..." : "Loading partner data..."}</div>;
  const code = data?.profile?.referral_code ?? "";
  const referralLink = code ? `${window.location.origin}/auth?mode=signup&referral=${encodeURIComponent(code)}` : "";
  const successful = data?.referrals.filter((item) => item.status === "successful").length ?? 0;
  const pending = data?.referrals.filter((item) => item.status === "pending").length ?? 0;
  const app = data?.affiliate;
  const affiliateLinks = app?.affiliate_code ? ["https://ristopmanagement.vercel.app", "https://ristopmanagement.site"].map((domain) => `${domain}/?ref=${encodeURIComponent(app.affiliate_code ?? "")}`) : [];
  const conversion = app && app.total_clicks > 0 ? ((app.total_sales / app.total_clicks) * 100).toFixed(1) : "0.0";

  return <div className="space-y-6">
    <section className="rounded-2xl glass-strong border border-primary/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold flex items-center gap-2"><Gift className="h-5 w-5 text-primary-glow" />{bn ? "রেফারেল ড্যাশবোর্ড" : "Referral Dashboard"}</h2><p className="text-sm text-muted-foreground mt-1">{bn ? "বন্ধু পেইড প্ল্যান নিলে আপনি ১ মাস, বন্ধু ১৫ দিন বোনাস পাবে।" : "Earn one free month; your referred friend receives 15 bonus days after the first paid plan."}</p></div><div className="flex gap-2"><Button size="icon" variant="outline" title="Copy" disabled={!referralLink} onClick={() => copy(referralLink)}><Copy className="h-4 w-4" /></Button><Button size="icon" variant="outline" title="Share" disabled={!referralLink} onClick={() => share(referralLink)}><Share2 className="h-4 w-4" /></Button></div></div>
      <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 font-mono text-sm break-all">{code || "—"}</div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">{[
        [bn ? "মোট" : "Total", data?.referrals.length ?? 0], [bn ? "সফল" : "Successful", successful], [bn ? "পেন্ডিং" : "Pending", pending],
        [bn ? "রিওয়ার্ড" : "Rewards", `${data?.profile?.reward_months ?? 0} ${bn ? "মাস" : "month(s)"}`], [bn ? "ফ্রি সাবস্ক্রিপশন" : "Free earned", `${data?.profile?.reward_months ?? 0} ${bn ? "মাস" : "month(s)"}`],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-xl font-bold text-gradient">{value}</div></div>)}</div>
    </section>

    <section className="rounded-2xl glass-strong border border-primary/30 p-5">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Link2 className="h-5 w-5 text-primary-glow" />{bn ? "অ্যাফিলিয়েট পার্টনার" : "Affiliate Partner"}</h2>
      {!app ? <div className="mt-5 grid gap-3 md:grid-cols-2">{Object.entries(form).map(([key, value]) => key === "experience" ? <div key={key} className="md:col-span-2"><Label>{key.replaceAll("_", " ")}</Label><Textarea value={value} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} className="mt-1" /></div> : <div key={key}><Label>{key.replaceAll("_", " ")}{["business_name","website","social_link","experience"].includes(key) ? " (optional)" : ""}</Label><Input type={key === "email" ? "email" : "text"} value={value} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} className="mt-1" /></div>)}<div className="md:col-span-2"><Button onClick={apply} disabled={saving} className="bg-gradient-primary shadow-glow">{saving ? "..." : bn ? "Become an Affiliate Partner" : "Become an Affiliate Partner"}</Button></div></div> : <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary-glow">{app.status}</span>{app.status !== "approved" && <span className="text-sm text-muted-foreground">{bn ? "অনুমোদনের পর লিংক তৈরি হবে।" : "Links are generated after admin approval."}</span>}</div>
        {affiliateLinks.map((link) => <div key={link} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 p-3"><span className="min-w-0 flex-1 truncate text-sm">{link}</span><Button size="icon" variant="ghost" onClick={() => copy(link)}><Copy className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => share(link)}><Share2 className="h-4 w-4" /></Button></div>)}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[["Clicks",app.total_clicks],["Signups",app.total_signups],["Paid customers",app.total_sales],["Conversion",`${conversion}%`],["Pending",`৳${app.pending_commission}`],["Paid",`৳${app.paid_commission}`],["Lifetime",`৳${app.lifetime_earnings}`],["This month",`৳${data?.commissions.filter((c)=>new Date(c.created_at).getMonth()===new Date().getMonth()).reduce((sum,c)=>sum+Number(c.commission_amount),0) ?? 0}`]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-border bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-bold">{value}</div></div>)}</div>
        {app.status === "approved" && <div><Button variant="outline" onClick={() => setWithdrawOpen(!withdrawOpen)}><Wallet className="h-4 w-4 mr-2" />{bn ? "উইথড্র রিকোয়েস্ট" : "Request withdrawal"}</Button>{withdrawOpen && <div className="mt-3 grid gap-3 md:grid-cols-3"><Input inputMode="decimal" placeholder={`Min ৳${data?.minimum}`} value={withdraw.amount} onChange={(e)=>setWithdraw({...withdraw,amount:e.target.value})}/><Select value={withdraw.method} onValueChange={(method)=>setWithdraw({...withdraw,method})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["bank","bkash","nagad","sslcommerz","stripe","paypal","usdt"].map((m)=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select><Input placeholder="Account details" value={withdraw.account_details} onChange={(e)=>setWithdraw({...withdraw,account_details:e.target.value})}/><Button onClick={requestWithdrawal} disabled={saving} className="md:col-span-3 bg-gradient-primary">{bn ? "সাবমিট" : "Submit request"}</Button></div>}</div>}
      </div>}
    </section>
  </div>;
}