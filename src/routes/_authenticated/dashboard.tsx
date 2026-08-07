import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t, lang } = useI18n();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [sales, products, activity] = await Promise.all([
        supabase.from("sales").select("*").eq("user_id", uid).order("sold_at", { ascending: false }),
        supabase.from("products").select("*").eq("user_id", uid),
        supabase.from("activity_log").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(8),
      ]);
      return { sales: sales.data ?? [], products: products.data ?? [], activity: activity.data ?? [] };
    },
  });

  const sales = data?.sales ?? [];
  const products = data?.products ?? [];
  const activity = data?.activity ?? [];

  const totalSales = sales.reduce((a, s) => a + Number(s.total), 0);
  const totalProfit = sales.reduce((a, s) => a + Number(s.profit), 0);
  const totalOrders = sales.length;
  const lowStock = products.filter((p) => p.stock <= p.low_stock_threshold);

  // monthly chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly = months.map((m, i) => {
    const ms = sales.filter((s) => new Date(s.sold_at).getMonth() === i);
    return { month: m, sales: ms.reduce((a, s) => a + Number(s.total), 0), profit: ms.reduce((a, s) => a + Number(s.profit), 0) };
  });

  // categories
  const catMap = new Map<string, number>();
  sales.forEach((s) => {
    const p = products.find((p) => p.id === s.product_id);
    const cat = p?.category ?? "Other";
    catMap.set(cat, (catMap.get(cat) ?? 0) + Number(s.total));
  });
  const catData = [...catMap.entries()].map(([name, value]) => ({ name, value }));
  const COLORS = ["#a855f7", "#c084fc", "#7c3aed", "#e879f9", "#6366f1"];

  // top products
  const prodMap = new Map<string, { name: string; qty: number; revenue: number; price: number }>();
  sales.forEach((s) => {
    const c = prodMap.get(s.product_name) ?? { name: s.product_name, qty: 0, revenue: 0, price: Number(s.unit_price) };
    c.qty += s.quantity; c.revenue += Number(s.total); prodMap.set(s.product_name, c);
  });
  const top = [...prodMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const cards = [
    { label: t("totalSales"), value: money(totalSales), icon: DollarSign, color: "from-violet-500/30" },
    { label: t("totalProfit"), value: money(totalProfit), icon: TrendingUp, color: "from-fuchsia-500/30" },
    { label: t("totalOrders"), value: totalOrders.toString(), icon: ShoppingCart, color: "from-purple-500/30" },
    { label: t("lowStock"), value: lowStock.length.toString(), icon: AlertTriangle, color: "from-rose-500/30", warn: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{lang === "bn" ? "একনজরে সব কিছু" : "Everything at a glance"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 glass border ${c.warn ? "border-destructive/50" : "border-border"} bg-gradient-to-br ${c.color} to-transparent`}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <c.icon className={`h-4 w-4 ${c.warn ? "text-destructive" : "text-primary-glow"}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${c.warn ? "text-destructive" : ""}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("salesOverview")}>
          {sales.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3b2a55" />
                <XAxis dataKey="month" stroke="#a78bfa" fontSize={11} />
                <YAxis stroke="#a78bfa" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
                <Line type="monotone" dataKey="sales" stroke="#c084fc" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card title={t("profitOverview")}>
          {sales.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3b2a55" />
                <XAxis dataKey="month" stroke="#a78bfa" fontSize={11} />
                <YAxis stroke="#a78bfa" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
                <Bar dataKey="profit" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t("categorySales")} className="lg:col-span-1">
          {catData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid #6b21a8", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card title={t("topProducts")} className="lg:col-span-1">
          {top.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {top.map((p) => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                  <div><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.qty} sold</div></div>
                  <div className="text-sm font-bold text-primary-glow">{money(p.price)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={t("recentActivity")} className="lg:col-span-1">
          {activity.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div key={a.id} className="text-sm p-2 rounded-lg bg-secondary/50">
                  <div className="font-medium">{a.action}</div>
                  {a.detail && <div className="text-xs text-muted-foreground">{a.detail}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-5">
          <div className="flex items-center gap-2 text-destructive font-semibold"><AlertTriangle className="h-5 w-5" /> {lang === "bn" ? "স্টক ওয়ার্নিং" : "Low Stock Warning"}</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <span className="text-sm">{p.name}</span><span className="text-sm font-bold text-destructive">{p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl glass border border-border p-5 ${className}`}>
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Empty() { return <div className="text-sm text-muted-foreground text-center py-10">No data yet</div>; }
