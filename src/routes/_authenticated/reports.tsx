import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const { t, lang } = useI18n();
  const { money } = useCurrency();
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [sales, purchases] = await Promise.all([
        supabase.from("sales").select("*"), supabase.from("purchases").select("*"),
      ]);
      return { sales: sales.data ?? [], purchases: purchases.data ?? [] };
    },
  });
  const totalSales = (data?.sales ?? []).reduce((a, s) => a + Number(s.total), 0);
  const totalProfit = (data?.sales ?? []).reduce((a, s) => a + Number(s.profit), 0);
  const totalCost = (data?.purchases ?? []).reduce((a, p) => a + Number(p.total), 0);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthly = months.map((m, i) => {
    const ms = (data?.sales ?? []).filter((s) => new Date(s.sold_at).getMonth() === i);
    const mp = (data?.purchases ?? []).filter((p) => new Date(p.purchased_at).getMonth() === i);
    return { month: m, sales: ms.reduce((a, s) => a + Number(s.total), 0), purchases: mp.reduce((a, p) => a + Number(p.total), 0), profit: ms.reduce((a, s) => a + Number(s.profit), 0) };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("reports")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: lang === "bn" ? "মোট বিক্রি" : "Total Sales", v: totalSales },
          { l: lang === "bn" ? "মোট পারচেস" : "Total Purchases", v: totalCost },
          { l: lang === "bn" ? "নেট প্রফিট" : "Net Profit", v: totalProfit },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl glass border border-border p-5">
            <div className="text-sm text-muted-foreground">{c.l}</div>
            <div className="text-2xl font-bold mt-2 text-gradient">{money(c.v)}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl glass border border-border p-5">
        <h3 className="font-semibold mb-4">{lang === "bn" ? "মাসিক রিপোর্ট" : "Monthly Report"}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b2a55" />
            <XAxis dataKey="month" stroke="#a78bfa" fontSize={11} />
            <YAxis stroke="#a78bfa" fontSize={11} />
            <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
            <Bar dataKey="sales" fill="#a855f7" radius={[6, 6, 0, 0]} />
            <Bar dataKey="purchases" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            <Bar dataKey="profit" fill="#c084fc" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
