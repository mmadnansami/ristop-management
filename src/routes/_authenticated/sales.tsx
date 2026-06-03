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
import { Plus, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({ component: Sales });

function Sales() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await supabase.from("sales").select("*").order("sold_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => (await supabase.from("products").select("id,name,price,cost_price,stock")).data ?? [],
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-min"],
    queryFn: async () => (await supabase.from("customers").select("id,name")).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("sales")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "নতুন সেল রেকর্ড করুন" : "Record new sales"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> {lang === "bn" ? "নতুন সেল" : "New Sale"}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{lang === "bn" ? "নতুন সেল" : "New Sale"}</DialogTitle></DialogHeader>
            <SaleForm products={products} customers={customers} onDone={() => { setOpen(false); qc.invalidateQueries(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl glass border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground"><tr>
              <th className="text-left p-3">Date</th><th className="text-left p-3">Product</th><th className="text-right p-3">Qty</th>
              <th className="text-right p-3">Price</th><th className="text-right p-3">Total</th><th className="text-right p-3">Profit</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {sales.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No sales yet</td></tr> :
                sales.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3">{new Date(s.sold_at).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{s.product_name}</td>
                    <td className="p-3 text-right">{s.quantity}</td>
                    <td className="p-3 text-right">৳{s.unit_price}</td>
                    <td className="p-3 text-right font-semibold">৳{s.total}</td>
                    <td className="p-3 text-right text-success">৳{s.profit}</td>
                    <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => printInvoice(s)}><Printer className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function printInvoice(s: { product_name: string; quantity: number; unit_price: number; total: number; sold_at: string }) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#7c3aed}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}</style></head><body>
    <h1>Ristop Management — Invoice</h1>
    <div class="row"><span>Date</span><strong>${new Date(s.sold_at).toLocaleString()}</strong></div>
    <div class="row"><span>Product</span><strong>${s.product_name}</strong></div>
    <div class="row"><span>Quantity</span><strong>${s.quantity}</strong></div>
    <div class="row"><span>Unit Price</span><strong>৳${s.unit_price}</strong></div>
    <div class="row" style="font-size:1.3em;color:#7c3aed"><span>Total</span><strong>৳${s.total}</strong></div>
    <p style="text-align:center;margin-top:40px;color:#888">Thank you for your purchase!</p>
    <script>window.print()</script></body></html>`);
}

function SaleForm({ products, customers, onDone }: { products: { id: string; name: string; price: number; cost_price: number; stock: number }[]; customers: { id: string; name: string }[]; onDone: () => void }) {
  const { lang } = useI18n();
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const p = products.find((x) => x.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) { toast.error("Pick a product"); return; }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const total = p.price * qty;
    const profit = (p.price - p.cost_price) * qty;
    const { error } = await supabase.from("sales").insert({
      user_id: u.user!.id, product_id: p.id, customer_id: customerId || null,
      product_name: p.name, quantity: qty, unit_price: p.price, unit_cost: p.cost_price, total, profit,
    });
    if (!error) {
      await supabase.from("products").update({ stock: Math.max(0, p.stock - qty) }).eq("id", p.id);
      await supabase.from("activity_log").insert({ user_id: u.user!.id, action: `Sale: ${p.name} x${qty}`, detail: `৳${total}` });
    }
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Sale recorded"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Product</Label>
        <Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder="Pick product" /></SelectTrigger>
          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ৳{p.price} (stock: {p.stock})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Customer ({lang === "bn" ? "অপশনাল" : "optional"})</Label>
        <Select value={customerId} onValueChange={setCustomerId}><SelectTrigger><SelectValue placeholder="Walk-in" /></SelectTrigger>
          <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
      {p && <div className="rounded-lg bg-secondary p-3 text-sm flex justify-between"><span>Total</span><span className="font-bold text-gradient">৳{(p.price * qty).toFixed(2)}</span></div>}
      <Button type="submit" disabled={loading || !p} className="w-full bg-gradient-primary shadow-glow"><FileText className="h-4 w-4 mr-1" /> {loading ? "..." : "Record Sale"}</Button>
    </form>
  );
}
