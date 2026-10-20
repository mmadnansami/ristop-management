import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, Pause, Play, UserPlus, Handshake } from "lucide-react";
import { toast } from "sonner";

type App = {
  id: string; user_id: string; full_name: string; email: string; phone: string; city: string; country: string;
  business_name: string | null; website: string | null; social_link: string | null; experience: string | null;
  status: string; affiliate_code: string | null; total_clicks: number; total_sales: number;
  pending_commission: number; created_at: string;
};

function makeCode(name: string) {
  const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 8).toUpperCase() || "PARTNER";
  return `RSTA-${base}${Math.floor(1000 + Math.random() * 9000)}`;
}

export function AdminAffiliates() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: apps = [] } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as App[];
    },
  });

  const setStatus = async (a: App, status: "approved" | "rejected" | "suspended") => {
    setBusy(a.id);
    const { data: u } = await supabase.auth.getUser();
    const patch = { status, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null };
    const { error } = await supabase.from("affiliate_applications").update(patch).eq("id", a.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? (bn ? "পার্টনার অনুমোদিত" : "Partner approved") : status === "rejected" ? (bn ? "আবেদন বাতিল" : "Application rejected") : (bn ? "পার্টনার স্থগিত" : "Partner suspended"));
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };

  const pending = apps.filter((a) => a.status === "pending");
  const badge = (s: string) => s === "approved" ? "bg-success/20 text-success" : s === "pending" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Handshake className="h-5 w-5 text-primary-glow" /> {bn ? "অ্যাফিলিয়েট পার্টনার" : "Affiliate Partners"} <span className="text-sm text-warning">({pending.length} {bn ? "পেন্ডিং" : "pending"})</span></h2>
        <AddPartnerDialog onDone={() => qc.invalidateQueries({ queryKey: ["admin-affiliates"] })} />
      </div>
      {apps.length === 0 ? (
        <div className="rounded-2xl glass border border-border p-8 text-center text-muted-foreground text-sm">{bn ? "এখনো কোনো আবেদন নেই" : "No applications yet"}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {apps.map((a) => (
            <div key={a.id} className="rounded-xl glass border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{a.full_name}{a.business_name ? ` · ${a.business_name}` : ""}</div>
                  <div className="text-sm text-muted-foreground truncate">{a.email} · {a.phone}</div>
                  <div className="text-xs text-muted-foreground">{a.city}, {a.country} · {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${badge(a.status)}`}>{a.status}</span>
              </div>
              {(a.website || a.social_link) && <div className="text-xs break-all text-primary-glow">{a.website} {a.social_link}</div>}
              {a.experience && <p className="text-xs text-foreground/70 line-clamp-3">{a.experience}</p>}
              {a.affiliate_code && (
                <div className="text-xs">{bn ? "কোড" : "Code"}: <span className="font-mono">{a.affiliate_code}</span> · {bn ? "ক্লিক" : "Clicks"} {a.total_clicks} · {bn ? "সেল" : "Sales"} {a.total_sales}</div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {a.status !== "approved" && (
                  <Button size="sm" disabled={busy === a.id} onClick={() => setStatus(a, "approved")} className="bg-gradient-primary"><Check className="h-3 w-3 mr-1" />{a.status === "suspended" ? (bn ? "আবার চালু" : "Reactivate") : (bn ? "অনুমোদন" : "Approve")}</Button>
                )}
                {a.status === "pending" && (
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => setStatus(a, "rejected")}><X className="h-3 w-3 mr-1" />{bn ? "বাতিল" : "Reject"}</Button>
                )}
                {a.status === "approved" && (
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => setStatus(a, "suspended")}><Pause className="h-3 w-3 mr-1" />{bn ? "স্থগিত" : "Suspend"}</Button>
                )}
                {a.status === "rejected" && <span className="text-xs text-muted-foreground self-center flex items-center gap-1"><Play className="h-3 w-3" />{bn ? "অনুমোদন দিলে আবার চালু হবে" : "Approve to activate"}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddPartnerDialog({ onDone }: { onDone: () => void }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: "", phone: "", city: "Dhaka", country: "Bangladesh" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const email = f.email.trim().toLowerCase();
    const { data: prof } = await supabase.from("profiles").select("id,full_name,email").ilike("email", email).maybeSingle();
    if (!prof) { setLoading(false); return toast.error(bn ? "এই ইমেইলে কোনো অ্যাকাউন্ট নেই। আগে সাইন আপ করতে বলুন।" : "No account with this email. Ask them to sign up first."); }
    const { data: u } = await supabase.auth.getUser();
    const name = prof.full_name || email.split("@")[0];
    const { data: existing } = await supabase.from("affiliate_applications").select("id").eq("user_id", prof.id).maybeSingle();
    const now = new Date().toISOString();
    const res = existing
      ? await supabase.from("affiliate_applications").update({ status: "approved", reviewed_at: now, reviewed_by: u.user?.id ?? null }).eq("id", existing.id)
      : await supabase.from("affiliate_applications").insert({
          user_id: prof.id, full_name: name, email: prof.email ?? email, phone: f.phone.trim() || "N/A",
          city: f.city.trim() || "Dhaka", country: f.country.trim() || "Bangladesh",
          status: "approved", affiliate_code: makeCode(name), reviewed_at: now, reviewed_by: u.user?.id ?? null,
        });
    setLoading(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(bn ? "পার্টনার যোগ হয়েছে" : "Partner added");
    setOpen(false); setF({ email: "", phone: "", city: "Dhaka", country: "Bangladesh" });
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-gradient-primary shadow-glow"><UserPlus className="h-4 w-4 mr-1" />{bn ? "পার্টনার যোগ করুন" : "Add Partner"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{bn ? "নতুন অ্যাফিলিয়েট পার্টনার" : "New Affiliate Partner"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>{bn ? "ইউজারের ইমেইল" : "User email"}</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>{bn ? "ফোন" : "Phone"}</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{bn ? "শহর" : "City"}</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
            <div><Label>{bn ? "দেশ" : "Country"}</Label><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></div>
          </div>
          <Button onClick={submit} disabled={loading || !f.email} className="w-full bg-gradient-primary">{loading ? "..." : (bn ? "যোগ করুন" : "Add")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
