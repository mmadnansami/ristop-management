import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode === "signup" ? "signup" : "signin") as "signin" | "signup" }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setIsSignup(mode === "signup"); }, [mode]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/dashboard", replace: true });
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6).max(100),
      name: isSignup ? z.string().min(1).max(80) : z.string().optional(),
    });
    const parsed = schema.safeParse({ email, password, name });
    if (!parsed.success) {
      toast.error(lang === "bn" ? "সঠিক তথ্য দিন (পাসওয়ার্ড অন্তত ৬ অক্ষর)" : "Please check your inputs (password ≥ 6 chars)");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success(lang === "bn" ? "একাউন্ট তৈরি হয়েছে!" : "Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(lang === "bn" ? "স্বাগতম!" : "Welcome back!");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) { toast.error(res.error.message); setLoading(false); return; }
    if (res.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/"><Logo className="h-16 w-auto" /></Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl glass shadow-glow border border-primary/30 p-8">
          <h1 className="text-2xl font-bold text-gradient">
            {isSignup ? (lang === "bn" ? "একাউন্ট তৈরি করুন" : "Create your account") : (lang === "bn" ? "স্বাগতম" : "Welcome back")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignup ? (lang === "bn" ? "মাত্র কয়েক সেকেন্ডে শুরু করুন" : "Get started in seconds") : (lang === "bn" ? "আপনার একাউন্টে লগইন করুন" : "Sign in to continue")}
          </p>

          <Button onClick={google} variant="outline" className="w-full mt-6 h-11 gap-2 border-primary/40" disabled={loading}>
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC04" d="M5.84 14.1A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {lang === "bn" ? "Google দিয়ে চালিয়ে যান" : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">{lang === "bn" ? "অথবা" : "or"}</span><div className="flex-1 h-px bg-border" /></div>

          <form onSubmit={submit} className="space-y-3">
            {isSignup && (
              <div><Label>{lang === "bn" ? "পুরো নাম" : "Full name"}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="mt-1" /></div>
            )}
            <div><Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /></div>
            <div><Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow h-11 mt-2">
              {loading ? "..." : isSignup ? (lang === "bn" ? "সাইন-আপ" : "Sign Up") : (lang === "bn" ? "লগইন" : "Sign In")}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            {isSignup ? (lang === "bn" ? "ইতিমধ্যে একাউন্ট আছে?" : "Already have an account?") : (lang === "bn" ? "একাউন্ট নেই?" : "Don't have an account?")}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="text-primary-glow hover:underline">
              {isSignup ? (lang === "bn" ? "লগইন করুন" : "Sign in") : (lang === "bn" ? "সাইন-আপ করুন" : "Sign up")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
