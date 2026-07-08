import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [activateOpen, setActivateOpen] = useState(false);
  const [activateEmail, setActivateEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const [profiles, requests, subs] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("subscription_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*"),
      ]);
      return { profiles: profiles.data ?? [], requests: requests.data ?? [], subs: subs.data ?? [] };
    },
  });

  const sendReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error(error.message); else toast.success(lang === "bn" ? "রিসেট লিংক পাঠানো হয়েছে" : "Reset link sent");
  };

  const subOf = (uid: string) => (data?.subs ?? []).find((s) => s.user_id === uid && s.status === "active");

  const totalUsers = (data?.profiles ?? []).length;
  const activeSubs = (data?.subs ?? []).filter((s) => s.status === "active").length;
  const pendingReq = (data?.requests ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "ইউজার, সাবসক্রিপশন ও রিকোয়েস্ট" : "Users, subscriptions & requests"}</p>
        </div>
        <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Sparkles className="h-4 w-4 mr-1" /> Active any Subscription</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Activate Subscription</DialogTitle></DialogHeader>
            <ActivateForm defaultEmail={activateEmail} onDone={() => { setActivateOpen(false); qc.invalidateQueries(); }} /></DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl glass border border-primary/30 p-5">
          <div className="text-xs text-muted-foreground">{lang === "bn" ? "মোট ব্যবহারকারী" : "Total Users"}</div>
          <div className="text-3xl font-black text-gradient mt-1">{totalUsers}</div>
        </div>
        <div className="rounded-2xl glass border border-success/30 p-5">
          <div className="text-xs text-muted-foreground">{lang === "bn" ? "একটিভ সাবস্ক্রিপশন" : "Active Subscriptions"}</div>
          <div className="text-3xl font-black text-success mt-1">{activeSubs}</div>
        </div>
        <div className="rounded-2xl glass border border-warning/30 p-5">
          <div className="text-xs text-muted-foreground">{lang === "bn" ? "পেন্ডিং রিকোয়েস্ট" : "Pending Requests"}</div>
          <div className="text-3xl font-black text-warning mt-1">{pendingReq}</div>
        </div>
      </div>

      {/* Pending requests */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Pending Subscription Requests ({(data?.requests ?? []).filter((r) => r.status === "pending").length})</h2>
        <div className="rounded-2xl glass border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground"><tr>
              <th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th><th className="text-left p-3">Method</th><th className="text-left p-3">TxnID</th>
              <th className="text-right p-3">Amount</th><th className="text-right p-3">Status</th><th></th>
            </tr></thead>
            <tbody>
              {(data?.requests ?? []).length === 0 ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No requests</td></tr> :
                data!.requests.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{r.name}</td><td className="p-3">{r.email}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-primary/20 text-primary-glow text-xs">{r.plan}</span></td>
                    <td className="p-3">{r.payment_method}</td><td className="p-3 font-mono text-xs">{r.transaction_id}</td>
                    <td className="p-3 text-right">৳{r.amount}</td>
                    <td className="p-3 text-right"><span className={`text-xs px-2 py-0.5 rounded ${r.status === "approved" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{r.status}</span></td>
                    <td className="p-3 text-right">
                      {r.status === "pending" && (
                        <Button size="sm" onClick={() => { setActivateEmail(r.email); setActivateOpen(true); }} className="bg-gradient-primary"><Check className="h-3 w-3 mr-1" /> Activate</Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All users */}
      <section>
        <h2 className="font-semibold text-lg mb-3">All Users ({(data?.profiles ?? []).length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(data?.profiles ?? []).map((p) => {
            const sub = subOf(p.id);
            return (
              <div key={p.id} className="rounded-xl glass border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.full_name ?? p.email}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {p.email}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><KeyRound className="h-3 w-3" /> {lang === "bn" ? "পাসওয়ার্ড নিরাপদভাবে hash করা" : "Password securely hashed"}</div>
                    {sub ? (
                      <div className="mt-2 inline-block text-xs px-2 py-0.5 rounded bg-gradient-primary text-primary-foreground">{sub.plan} active</div>
                    ) : (
                      <div className="mt-2 inline-block text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">free</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => sendReset(p.email)}>Send Password Reset</Button>
                  <Button size="sm" className="bg-gradient-primary" onClick={() => { setActivateEmail(p.email); setActivateOpen(true); }}>Activate Sub</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ActivateForm({ defaultEmail, onDone }: { defaultEmail: string; onDone: () => void }) {
  const [email, setEmail] = useState(defaultEmail);
  const [plan, setPlan] = useState<"monthly" | "quarterly" | "biannual" | "lifetime">("monthly");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    // Find user by email via profiles
    const { data: prof } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!prof) { toast.error("User not found. Ask them to sign up first."); setLoading(false); return; }
    const months = plan === "monthly" ? 1 : plan === "quarterly" ? 3 : plan === "biannual" ? 6 : null;
    const expiresAt = months ? new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString() : null;
    // Cancel any existing active
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("user_id", prof.id).eq("status", "active");
    const { error } = await supabase.from("subscriptions").insert({ user_id: prof.id, plan, status: "active", expires_at: expiresAt });
    await supabase.from("subscription_requests").update({ status: "approved" }).eq("email", email).eq("status", "pending");
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Activated"); onDone(); }
  };

  return (
    <div className="space-y-3">
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Plan</Label>
        <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly (1 mo)</SelectItem>
            <SelectItem value="quarterly">Quarterly (3 mo)</SelectItem>
            <SelectItem value="biannual">Biannual (6 mo)</SelectItem>
            <SelectItem value="lifetime">Lifetime</SelectItem>
          </SelectContent></Select>
      </div>
      <Button onClick={submit} disabled={loading || !email} className="w-full bg-gradient-primary shadow-glow">{loading ? "..." : "Activate"}</Button>
    </div>
  );
}
