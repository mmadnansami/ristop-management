import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password | Ristop Management" },
      { name: "description", content: "Choose a new password for your Ristop Management account and get back to your workspace." },
      { property: "og:title", content: "Set a new password | Ristop Management" },
      { property: "og:description", content: "Choose a new password for your Ristop Management account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error && !cancelled) {
          setInvalid(true);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) setReady(true);
      else
        setTimeout(async () => {
          const { data: again } = await supabase.auth.getSession();
          if (cancelled) return;
          if (again.session) setReady(true);
          else setInvalid(true);
        }, 2500);
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(lang === "bn" ? "পাসওয়ার্ড অন্তত ৬ অক্ষর" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error(lang === "bn" ? "পাসওয়ার্ড মিলছে না" : "Passwords do not match");
      return;
    }
    setLoading(true);
    // Recovery session: do NOT send current_password here.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(lang === "bn" ? "পাসওয়ার্ড আপডেট হয়েছে" : "Password updated");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="auth-scene flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass-strong p-8 shadow-glow">
        <div className="mb-5 flex justify-center"><Logo className="h-14 w-auto" /></div>
        <h1 className="text-center text-2xl font-bold">
          {lang === "bn" ? "নতুন পাসওয়ার্ড দিন" : "Set a new password"}
        </h1>

        {invalid && !ready ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-destructive">
              {lang === "bn"
                ? "লিংকটি মেয়াদোত্তীর্ণ বা অবৈধ। আবার রিসেট লিংক নিন।"
                : "This reset link is invalid or expired. Please request a new one."}
            </p>
            <Link to="/forgot-password" className="inline-flex rounded-xl bg-gradient-primary px-5 py-2 text-sm text-primary-foreground shadow-glow">
              {lang === "bn" ? "নতুন লিংক নিন" : "Request a new link"}
            </Link>
          </div>
        ) : !ready ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {lang === "bn" ? "লিংক যাচাই করা হচ্ছে…" : "Verifying your link…"}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-foreground/70">{lang === "bn" ? "নতুন পাসওয়ার্ড" : "New password"}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="mt-1.5 h-12 rounded-xl border-white/15 bg-white/5 focus-visible:ring-primary" />
            </div>
            <div>
              <Label className="text-foreground/70">{lang === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm password"}</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6}
                className="mt-1.5 h-12 rounded-xl border-white/15 bg-white/5 focus-visible:ring-primary" />
            </div>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow">
              {loading ? "..." : lang === "bn" ? "পাসওয়ার্ড আপডেট করুন" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
