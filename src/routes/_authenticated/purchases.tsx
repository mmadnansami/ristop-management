import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/purchases")({ component: Purchases });

function Purchases() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => (await supabase.from("purchases").select("*").order("purchased_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-min2"],
    queryFn: async () => (await supabase.from("products").select("id,name,cost_price,stock")).data ?? [],
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => (await supabase.from("suppliers").select("id,name")).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("purchases")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "নতুন পারচেস যোগ করুন" : "Record new purchases"}</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> {lang === "bn" ? "নতুন" : "Add"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{lang === "bn" ? "নতুন পারচেস" : "New Purchase"}</DialogTitle></DialogHeader>
            <PurchaseForm products={products} suppliers={suppliers} onDone={() => { setOpen(false); qc.invalidateQueries(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl glass border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground"><tr>
            <th className="text-left p-3">Date</th><th className="text-left p-3">Product</th>
            <th className="text-right p-3">Qty</th><th className="text-right p-3">Cost</th><th className="text-right p-3">Total</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No purchases yet</td></tr> :
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">{new Date(r.purchased_at).toLocaleDateString()}</td>
                  <td className="p-3 font-medium">{r.product_name}</td>
                  <td className="p-3 text-right">{r.quantity}</td>
                  <td className="p-3 text-right">৳{r.unit_cost}</td>
                  <td className="p-3 text-right font-bold">৳{r.total}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseForm({ products, suppliers, onDone }: { products: { id: string; name: string; cost_price: number; stock: number }[]; suppliers: { id: string; name: string }[]; onDone: () => void }) {
  const { lang } = useI18n();
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const p = products.find((x) => x.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const quantity = Math.max(1, Math.floor(Number(qty || 1)));
    const unitCost = Number(cost || p.cost_price || 0);
    const { error } = await supabase.from("purchases").insert({
      user_id: u.user!.id, product_id: p.id, supplier_id: supplierId || null,
      product_name: p.name, quantity, unit_cost: unitCost, total: unitCost * quantity,
    });
    if (!error) {
      await supabase.from("products").update({ stock: p.stock + quantity, cost_price: unitCost }).eq("id", p.id);
      await supabase.from("activity_log").insert({ user_id: u.user!.id, action: `Purchase: ${p.name} x${quantity}`, detail: `৳${unitCost * quantity}` });
    }
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Recorded"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Product</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
        <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Supplier ({lang === "bn" ? "অপশনাল" : "optional"})</Label><Select value={supplierId} onValueChange={setSupplierId}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Quantity</Label><Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div><Label>Unit Cost</Label><Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder={p?.cost_price.toString()} /></div>
      </div>
      <Button type="submit" disabled={loading || !p} className="w-full bg-gradient-primary shadow-glow">{loading ? "..." : "Record"}</Button>
    </form>
  );
}
