import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/stock")({ component: Stock });

function Stock() {
  const { t, lang } = useI18n();
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await supabase.from("products").select("*").order("stock", { ascending: true })).data ?? [],
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("stock")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "রিয়েল টাইম স্টক স্ট্যাটাস" : "Real-time stock status"}</p>
      </div>
      <div className="rounded-2xl glass border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground"><tr>
            <th className="text-left p-3">Product</th><th className="text-left p-3">Category</th>
            <th className="text-right p-3">Stock</th><th className="text-right p-3">Threshold</th><th className="text-right p-3">Status</th>
          </tr></thead>
          <tbody>
            {products.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No products</td></tr> :
              products.map((p) => {
                const low = p.stock <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className={`p-3 text-right font-bold ${low ? "text-destructive" : ""}`}>{p.stock}</td>
                    <td className="p-3 text-right text-muted-foreground">{p.low_stock_threshold}</td>
                    <td className="p-3 text-right">
                      {low ? <span className="inline-flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="h-3 w-3" /> Low</span>
                           : <span className="text-success text-xs">OK</span>}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
