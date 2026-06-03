import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/products")({ component: Products });

type Product = {
  id: string; name: string; image_url: string | null; category: string | null;
  price: number; cost_price: number; stock: number; low_stock_threshold: number;
  expiry_date: string | null; warranty: string | null; delivery_method: string | null;
};

function Products() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data as Product[];
    },
  });

  const del = async (id: string) => {
    if (!confirm(lang === "bn" ? "ডিলিট করবেন?" : "Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["products"] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("products")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "প্রডাক্ট যোগ করুন ও ম্যানেজ করুন" : "Add and manage your products"}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> {lang === "bn" ? "নতুন" : "Add"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? (lang === "bn" ? "প্রডাক্ট এডিট" : "Edit Product") : (lang === "bn" ? "নতুন প্রডাক্ট" : "New Product")}</DialogTitle></DialogHeader>
            <ProductForm initial={editing} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["products"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl glass border border-border p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <div className="text-muted-foreground">{lang === "bn" ? "এখনো কোনো প্রডাক্ট যোগ করা হয়নি" : "No products yet"}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl glass border border-border overflow-hidden hover:border-primary/50 hover:shadow-glow transition group">
              <div className="aspect-video bg-secondary flex items-center justify-center overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-10 w-10 text-muted-foreground" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <div className="text-lg font-bold text-gradient">৳{p.price}</div>
                </div>
                {p.category && <div className="text-xs text-muted-foreground mt-1">{p.category}</div>}
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className={`px-2 py-1 rounded ${p.stock <= p.low_stock_threshold ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                    Stock: {p.stock}
                  </span>
                  {p.warranty && <span className="text-muted-foreground">{p.warranty}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => del(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial, onDone }: { initial: Product | null; onDone: () => void }) {
  const { lang } = useI18n();
  const [f, setF] = useState({
    name: initial?.name ?? "", image_url: initial?.image_url ?? "", category: initial?.category ?? "",
    price: initial?.price ?? 0, cost_price: initial?.cost_price ?? 0,
    stock: initial?.stock ?? 0, low_stock_threshold: initial?.low_stock_threshold ?? 5,
    expiry_date: initial?.expiry_date ?? "", warranty: initial?.warranty ?? "", delivery_method: initial?.delivery_method ?? "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Name required"); return; }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = { ...f, user_id: u.user!.id, expiry_date: f.expiry_date || null };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div><Label>{lang === "bn" ? "নাম" : "Name"} *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div><Label>{lang === "bn" ? "ছবির URL" : "Image URL"}</Label><Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
        <div><Label>{lang === "bn" ? "প্রাইস" : "Price"} *</Label><Input type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{lang === "bn" ? "কস্ট প্রাইস" : "Cost Price"}</Label><Input type="number" step="0.01" value={f.cost_price} onChange={(e) => setF({ ...f, cost_price: Number(e.target.value) })} /></div>
        <div><Label>Stock</Label><Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Low Stock Alert</Label><Input type="number" value={f.low_stock_threshold} onChange={(e) => setF({ ...f, low_stock_threshold: Number(e.target.value) })} /></div>
        <div><Label>{lang === "bn" ? "মেয়াদ (optional)" : "Expiry (optional)"}</Label><Input type="date" value={f.expiry_date} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{lang === "bn" ? "গ্যারান্টি (optional)" : "Warranty (optional)"}</Label><Input value={f.warranty} onChange={(e) => setF({ ...f, warranty: e.target.value })} placeholder="e.g. 1 year" /></div>
        <div><Label>{lang === "bn" ? "ডেলিভারির মাধ্যম" : "Delivery Method"}</Label><Input value={f.delivery_method} onChange={(e) => setF({ ...f, delivery_method: e.target.value })} placeholder="e.g. Courier" /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">{loading ? "..." : initial ? "Update" : "Create"}</Button>
    </form>
  );
}
