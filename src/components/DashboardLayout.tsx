import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RisAssistant } from "@/components/RisAssistant";
import { SiteFooter } from "@/components/SiteFooter";

import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, ShoppingBag, Boxes,
  Users, Truck, BarChart3, User, ShieldCheck, Search, MoreVertical,
  LogOut, Menu, X, TrendingUp, Crown, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const loc = useLocation();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      return { user: u.user, profile: p, isAdmin: (roles ?? []).some((r) => r.role === "admin") };
    },
  });

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/products", icon: Package, label: t("products") },
    { to: "/sales", icon: ShoppingCart, label: t("sales") },
    { to: "/market-analyst", icon: TrendingUp, label: lang === "bn" ? "মার্কেট অ্যানালিস্ট" : "Market Analyst" },
    { to: "/purchases", icon: ShoppingBag, label: t("purchases") },
    { to: "/stock", icon: Boxes, label: t("stock") },
    { to: "/customers", icon: Users, label: t("customers") },
    { to: "/suppliers", icon: Truck, label: t("suppliers") },
    { to: "/dues", icon: Wallet, label: lang === "bn" ? "বকেয়া" : "Dues" },
    { to: "/reports", icon: BarChart3, label: t("reports") },
    { to: "/profile", icon: User, label: t("profile") },
  ] as const;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", search: { mode: "signin" }, replace: true });
  };

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const initials = (profile?.profile?.full_name ?? profile?.user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/"><Logo className="h-12 w-auto" /></Link>
          <button onClick={() => setOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((it) => {
            const active = loc.pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-sidebar-foreground hover:bg-secondary"}`}>
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
          <Link to="/subscribe" search={{ plan: "quarterly" }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-sidebar-foreground hover:bg-secondary border border-primary/30 mt-2`}>
            <Crown className="h-4 w-4 text-primary-glow" /> {lang === "bn" ? "সাবস্ক্রিপশন" : "Subscription"}
          </Link>
          {profile?.isAdmin && (
            <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${loc.pathname === "/admin" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-sidebar-foreground hover:bg-secondary"}`}>
              <ShieldCheck className="h-4 w-4" /> {t("admin")}
            </Link>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="flex-1 max-w-xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder={t("search")} className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-sm outline-none focus:ring-2 ring-ring" />
            </div>
            <LanguageToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition">
                  <Avatar className="h-8 w-8"><AvatarImage src={profile?.profile?.avatar_url ?? undefined} /><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
                  <span className="text-sm hidden sm:inline truncate max-w-[120px]">{profile?.profile?.full_name ?? profile?.user?.email}</span>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => nav({ to: "/profile" })}><User className="h-4 w-4 mr-2" />{t("profile")}</DropdownMenuItem>
                {profile?.isAdmin && <DropdownMenuItem onClick={() => nav({ to: "/admin" })}><ShieldCheck className="h-4 w-4 mr-2" />{t("admin")}</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />{lang === "bn" ? "লগআউট" : "Sign Out"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
        <SiteFooter />
      </div>


      <RisAssistant />
    </div>
  );
}
