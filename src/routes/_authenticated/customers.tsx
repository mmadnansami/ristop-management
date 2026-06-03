import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({ component: Page });

function Page() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await supabase.from("customers").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("customers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["customers"] });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("customers")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "কাস্টমার লিস্ট ও ব্যালেন্স" : "Customer list & balances"}</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <CustomerForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["customers"] }); }} /></DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl glass border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground"><tr>
            <th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th>
            <th className="text-left p-3">Email</th><th className="text-right p-3">Balance</th><th></th>
          </tr></thead>
          <tbody>
            {data.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No customers yet</td></tr> :
              data.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.phone ?? "—"}</td>
                  <td className="p-3">{c.email ?? "—"}</td>
                  <td className="p-3 text-right">৳{c.balance}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", balance: 0 });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name) return;
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("customers").insert({ ...f, user_id: u.user!.id });
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Added"); onDone(); }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
      <div><Label>Balance</Label><Input type="number" step="0.01" value={f.balance} onChange={(e) => setF({ ...f, balance: Number(e.target.value) })} /></div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">{loading ? "..." : "Save"}</Button>
    </form>
  );
}
