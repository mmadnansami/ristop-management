import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Forgot password | Ristop Management" },
      { name: "description", content: "Request a secure password reset link for your Ristop Management business account." },
      { property: "og:title", content: "Forgot password | Ristop Management" },
      { property: "og:description", content: "Request a password reset link for your Ristop Management account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { lang } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email).success) {
      toast.error(lang === "bn" ? "সঠিক ইমেইল দিন" : "Enter a valid email address");
      return;
    }
    setLoading(true);
    // window.location.origin keeps the link on the current production domain.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success(lang === "bn" ? "রিসেট লিংক পাঠানো হয়েছে" : "Reset link sent");
  };

  return (
    <div className="auth-scene flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl glass-strong p-8 shadow-glow">
        <div className="mb-5 flex justify-center"><Logo className="h-14 w-auto" /></div>
        <h1 className="text-center text-2xl font-bold">
          {lang === "bn" ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot your password?"}
        </h1>
        <p className="mt-2 text-center text-sm text-foreground/60">
          {lang === "bn"
            ? "আপনার ইমেইল দিন, আমরা রিসেট লিংক পাঠাবো।"
            : "Enter your email and we'll send you a reset link."}
        </p>

        {sent ? (
          <p className="mt-6 rounded-xl bg-success/10 p-4 text-center text-sm text-foreground/80">
            {lang === "bn"
              ? "ইমেইল চেক করুন এবং লিংকে ক্লিক করে নতুন পাসওয়ার্ড দিন।"
              : "Check your inbox and follow the link to set a new password."}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-foreground/70">Email address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 h-12 rounded-xl border-white/15 bg-white/5 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow">
              {loading ? "..." : lang === "bn" ? "রিসেট লিংক পাঠান" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground/60">
          <Link to="/auth" search={{ mode: "signin", referral: "" }} className="font-semibold text-primary-glow">
            {lang === "bn" ? "লগইনে ফিরে যান" : "Back to sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
