import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({ component: Page });

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  user_id: string;
};

function Page() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,user_id,name,phone,email,address,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });
  const del = async (id: string) => {
    if (!confirm(lang === "bn" ? "এই কাস্টমার ডিলিট করবেন?" : "Delete this customer?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(lang === "bn" ? "ডিলিট হয়েছে" : "Deleted"); qc.invalidateQueries({ queryKey: ["customers"] }); }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("customers")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "কাস্টমারের তথ্য যোগ ও এডিট করুন" : "Add and edit customer information"}</p></div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow rounded-xl"><Plus className="h-4 w-4 mr-1" /> {lang === "bn" ? "নতুন" : "Add"}</Button></DialogTrigger>
          <DialogContent className="glass-strong border-white/10 rounded-3xl"><DialogHeader><DialogTitle>{editing ? (lang === "bn" ? "কাস্টমার এডিট" : "Edit Customer") : (lang === "bn" ? "নতুন কাস্টমার" : "New Customer")}</DialogTitle></DialogHeader>
            <CustomerForm initial={editing} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["customers"] }); }} /></DialogContent>
        </Dialog>
      </div>
      <div className="rounded-3xl glass-strong border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-muted-foreground"><tr>
            <th className="text-left p-4">{lang === "bn" ? "নাম" : "Name"}</th><th className="text-left p-4">{lang === "bn" ? "ফোন" : "Phone"}</th>
            <th className="text-left p-4">Email</th><th className="text-left p-4">{lang === "bn" ? "ঠিকানা" : "Address"}</th><th className="p-4 text-right">{lang === "bn" ? "অ্যাকশন" : "Action"}</th>
          </tr></thead>
          <tbody>
            {data.length === 0 ? <tr><td colSpan={5} className="text-center py-14 text-muted-foreground"><Users className="mx-auto mb-3 h-10 w-10 opacity-50" />{lang === "bn" ? "এখনো কোনো কাস্টমার নেই" : "No customers yet"}</td></tr> :
              data.map((c) => (
                <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="p-4 font-semibold">{c.name}</td>
                  <td className="p-4">{c.phone ?? "—"}</td>
                  <td className="p-4">{c.email ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{c.address ?? "—"}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl border-white/15 bg-white/5" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-1" />{lang === "bn" ? "এডিট" : "Edit"}</Button>
                      <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ initial, onDone }: { initial: Customer | null; onDone: () => void }) {
  const { lang } = useI18n();
  const [f, setF] = useState({ name: initial?.name ?? "", phone: initial?.phone ?? "", email: initial?.email ?? "", address: initial?.address ?? "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.error(lang === "bn" ? "নাম দিন" : "Name required"); return; }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error(lang === "bn" ? "আবার লগইন করুন" : "Please sign in again"); setLoading(false); return; }
    const payload = { name: f.name.trim(), phone: f.phone || null, email: f.email || null, address: f.address || null, user_id: u.user.id };
    const { error } = initial
      ? await supabase.from("customers").update(payload).eq("id", initial.id)
      : await supabase.from("customers").insert(payload);
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success(initial ? (lang === "bn" ? "আপডেট হয়েছে" : "Updated") : (lang === "bn" ? "যোগ হয়েছে" : "Added")); onDone(); }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>{lang === "bn" ? "নাম" : "Name"} *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required className="mt-1.5 h-11 rounded-xl bg-white/5 border-white/15" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{lang === "bn" ? "ফোন" : "Phone"}</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-white/5 border-white/15" /></div>
        <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-white/5 border-white/15" /></div>
      </div>
      <div><Label>{lang === "bn" ? "ঠিকানা" : "Address"}</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-white/5 border-white/15" /></div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow rounded-xl h-11">{loading ? "..." : initial ? (lang === "bn" ? "আপডেট" : "Update") : (lang === "bn" ? "সেভ" : "Save")}</Button>
    </form>
  );
}
