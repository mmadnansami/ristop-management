import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "bn" | "en";

const dict = {
  // Nav / common
  signIn: { bn: "লগইন", en: "Sign In" },
  signUp: { bn: "সাইন-আপ", en: "Sign Up" },
  signOut: { bn: "লগআউট", en: "Sign Out" },
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  pricing: { bn: "প্ল্যান", en: "Pricing" },
  features: { bn: "ফিচার", en: "Features" },
  // Hero
 heroTitle: { bn: "বাংলাদেশের সেরা বিজনেস ম্যানেজমেন্ট সফটওয়্যার", en: "Best Business Management Software in Bangladesh" },
 heroSub: { bn: "Ristop Management — স্মার্ট স্টক, সেলস, প্রফিট, কাস্টমার ম্যানেজমেন্ট এবং Ris AI অ্যাসিস্ট্যান্ট। ঢাকা সহ পুরো বাংলাদেশের ছোট-বড় ব্যবসার জন্য।", en: "Top AI-powered POS & business management system in Dhaka. Smart stock, sales, profit & customer tools powered by Ris AI." },
  getStarted: { bn: "ফ্রি শুরু করুন", en: "Get Started Free" },
  watchDemo: { bn: "ফিচার দেখুন", en: "Explore Features" },
  // Sidebar items
  products: { bn: "প্রডাক্ট", en: "Products" },
  sales: { bn: "সেলস", en: "Sales" },
  purchases: { bn: "পারচেস", en: "Purchases" },
  stock: { bn: "স্টক", en: "Stock" },
  customers: { bn: "কাস্টমার", en: "Customers" },
  suppliers: { bn: "সাপ্লায়ার", en: "Suppliers" },
  reports: { bn: "রিপোর্ট", en: "Reports" },
  profile: { bn: "আমার প্রোফাইল", en: "My Profile" },
  admin: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
  search: { bn: "যেকোনো কিছু সার্চ করুন...", en: "Search anything..." },
  // Dashboard cards
  totalSales: { bn: "মোট বিক্রি", en: "Total Sales" },
  totalProfit: { bn: "মোট লাভ", en: "Total Profit" },
  totalOrders: { bn: "মোট অর্ডার", en: "Total Orders" },
  lowStock: { bn: "লো স্টক আইটেম", en: "Low Stock Items" },
  salesOverview: { bn: "সেলস অভারভিউ", en: "Sales Overview" },
  profitOverview: { bn: "প্রফিট অভারভিউ", en: "Profit Overview" },
  categorySales: { bn: "ক্যাটাগরি অনুযায়ী বিক্রি", en: "Category-wise Sales" },
  topProducts: { bn: "টপ প্রডাক্ট", en: "Top Products" },
  recentActivity: { bn: "রিসেন্ট একটিভিটি", en: "Recent Activity" },
  // Pricing
  planMonthly: { bn: "মাসিক প্ল্যান", en: "Monthly Plan" },
  planQuarterly: { bn: "তৃমাসিক প্ল্যান", en: "Quarterly Plan" },
  planBiannual: { bn: "ছয়মাসিক প্ল্যান", en: "Biannual Plan" },
  popular: { bn: "জনপ্রিয়", en: "Popular" },
  buyNow: { bn: "এখনই কিনুন", en: "Buy Now" },
} as const;

type Key = keyof typeof dict;

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string; }
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("ristop_lang")) as Lang | null;
    if (saved === "bn" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); if (typeof window !== "undefined") localStorage.setItem("ristop_lang", l); };
  const t = (k: Key) => dict[k][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
