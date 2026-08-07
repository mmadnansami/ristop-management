import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dues")({ component: Dues });

type Party = { id: string; name: string; phone: string | null; balance: number };
type Tx = { id: string; party_type: "customer" | "supplier"; party_id: string; amount: number; kind: "charge" | "payment"; note: string | null; occurred_at: string };

function Dues() {
  const { lang } = useI18n();
  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gradient truncate">{lang === "bn" ? "বকেয়া হিসাব" : "Dues Ledger"}</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{lang === "bn" ? "কাস্টমার ও সাপ্লায়ারের বকেয়া" : "Customer & supplier outstanding balances"}</p>
        </div>
      </header>

      <Tabs defaultValue="customer">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="customer">{lang === "bn" ? "কাস্টমার বকেয়া" : "Customer Dues"}</TabsTrigger>
          <TabsTrigger value="supplier">{lang === "bn" ? "সাপ্লায়ার বকেয়া" : "Supplier Dues"}</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4"><DuesPanel party="customer" /></TabsContent>
        <TabsContent value="supplier" className="mt-4"><DuesPanel party="supplier" /></TabsContent>
      </Tabs>
    </div>
  );
}

function DuesPanel({ party }: { party: "customer" | "supplier" }) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: [party + "s-with-balance"],
    queryFn: async () => {
      const table = party === "customer" ? "customers" : "suppliers";
      const { data, error } = await supabase.from(table).select("id,name,phone,balance").order("balance", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Party[];
    },
  });

  const { data: txs = [] } = useQuery<Tx[]>({
    queryKey: ["dues-tx", party, selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("dues_transactions").select("*").eq("party_type", party).eq("party_id", selected!).order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tx[];
    },
  });

  const totalDue = parties.reduce((s, p) => s + Number(p.balance || 0), 0);

  const addTx = useMutation({
    mutationFn: async (input: { amount: number; kind: "charge" | "payment"; note: string; occurred_at: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !selected) throw new Error("Missing user");
      const table = party === "customer" ? "customers" : "suppliers";
      const current = parties.find((p) => p.id === selected);
      const delta = input.kind === "charge" ? input.amount : -input.amount;
      const newBalance = Number(current?.balance ?? 0) + delta;
      const { error: e1 } = await supabase.from("dues_transactions").insert({
        user_id: u.user.id, party_type: party, party_id: selected,
        amount: input.amount, kind: input.kind, note: input.note || null, occurred_at: input.occurred_at,
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from(table).update({ balance: newBalance }).eq("id", selected);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [party + "s-with-balance"] });
      qc.invalidateQueries({ queryKey: ["dues-tx", party, selected] });
      toast.success(lang === "bn" ? "সংরক্ষিত" : "Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTx = useMutation({
    mutationFn: async (tx: Tx) => {
      const table = party === "customer" ? "customers" : "suppliers";
      const current = parties.find((p) => p.id === selected);
      const delta = tx.kind === "charge" ? -Number(tx.amount) : Number(tx.amount);
      const newBalance = Number(current?.balance ?? 0) + delta;
      const { error: e1 } = await supabase.from("dues_transactions").delete().eq("id", tx.id);
      if (e1) throw e1;
      await supabase.from(table).update({ balance: newBalance }).eq("id", selected!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [party + "s-with-balance"] });
      qc.invalidateQueries({ queryKey: ["dues-tx", party, selected] });
    },
  });

  const partyLabel = party === "customer"
    ? (lang === "bn" ? "মোট কাস্টমার বকেয়া" : "Total Customer Dues")
    : (lang === "bn" ? "মোট সাপ্লায়ার বকেয়া" : "Total Supplier Dues");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
      <div className="rounded-2xl glass border border-border p-4 space-y-3">
        <div className="rounded-xl bg-gradient-primary/20 border border-primary/30 p-3">
          <div className="text-xs text-muted-foreground">{partyLabel}</div>
          <div className="text-2xl font-black text-gradient">{money(totalDue)}</div>
        </div>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {parties.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">{lang === "bn" ? "কেউ যোগ করা নেই" : "No parties yet"}</div>}
          {parties.map((p) => {
            const active = selected === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left rounded-lg p-3 transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary/40 hover:bg-secondary"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className={`text-xs truncate ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{p.phone || "—"}</div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${Number(p.balance) > 0 ? (active ? "text-primary-foreground" : "text-destructive") : active ? "text-primary-foreground" : "text-emerald-500"}`}>{money(p.balance || 0)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl glass border border-border p-4">
        {!selected ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            {lang === "bn" ? "একটি " + (party === "customer" ? "কাস্টমার" : "সাপ্লায়ার") + " নির্বাচন করুন" : `Select a ${party}`}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">{lang === "bn" ? "বর্তমান বকেয়া" : "Current balance"}</div>
                <div className="text-2xl font-black text-gradient">{money(parties.find((p) => p.id === selected)?.balance ?? 0)}</div>
              </div>
              <AddDialog onSubmit={(v) => addTx.mutate(v)} lang={lang} party={party} />
            </div>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {txs.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">{lang === "bn" ? "কোনো লেনদেন নেই" : "No transactions yet"}</div>}
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  {tx.kind === "charge" ? <ArrowUpCircle className="h-5 w-5 text-destructive shrink-0" /> : <ArrowDownCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{tx.kind === "charge" ? (lang === "bn" ? "নতুন বকেয়া" : "New charge") : (lang === "bn" ? "পরিশোধ" : "Payment")} — {money(tx.amount)}</div>
                    <div className="text-xs text-muted-foreground truncate">{new Date(tx.occurred_at).toLocaleDateString()} • {tx.note || "—"}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteTx.mutate(tx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddDialog({ onSubmit, lang, party }: { onSubmit: (v: { amount: number; kind: "charge" | "payment"; note: string; occurred_at: string }) => void; lang: "bn" | "en"; party: "customer" | "supplier" }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"charge" | "payment">("charge");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    const a = Number(amount);
    if (!a || a <= 0) return;
    onSubmit({ amount: a, kind, note, occurred_at: new Date(date).toISOString() });
    setOpen(false); setAmount(""); setNote(""); setKind("charge");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" />{lang === "bn" ? "নতুন এন্ট্রি" : "New Entry"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{lang === "bn" ? "বকেয়া এন্ট্রি" : "Dues Entry"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={kind} onValueChange={(v) => setKind(v as "charge" | "payment")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="charge">{lang === "bn" ? (party === "customer" ? "কাস্টমার নতুন বাকি নিলো" : "নতুন বকেয়া যোগ") : "New charge (+)"}</SelectItem>
              <SelectItem value="payment">{lang === "bn" ? "পরিশোধ (−)" : "Payment (−)"}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" inputMode="decimal" placeholder={lang === "bn" ? "টাকার পরিমাণ" : "Amount (BDT)"} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder={lang === "bn" ? "নোট (অপশনাল)" : "Note (optional)"} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter><Button onClick={submit} className="bg-gradient-primary">{lang === "bn" ? "সেভ" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
