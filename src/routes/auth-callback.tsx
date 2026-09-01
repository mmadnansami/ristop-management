import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in | Ristop Management" },
      { name: "description", content: "Completing your secure sign-in to the Ristop Management workspace." },
      { property: "og:title", content: "Signing you in | Ristop Management" },
      { property: "og:description", content: "Completing your secure sign-in to Ristop Management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };

    (async () => {
      // Recovery links must land on the reset-password page, not the dashboard.
      const hash = window.location.hash ?? "";
      if (hash.includes("type=recovery")) {
        done = true;
        navigate({ to: "/reset-password", replace: true });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const errDesc = params.get("error_description") ?? params.get("error");
      if (errDesc) {
        setError(errDesc);
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exErr) {
          setError(exErr.message);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) return go();

      // Implicit flow: detectSessionInUrl resolves shortly after mount.
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session) go();
      });
      setTimeout(async () => {
        const { data: again } = await supabase.auth.getSession();
        if (again.session) go();
        else if (!done) setError("We could not complete the sign-in. Please try again.");
        sub.subscription.unsubscribe();
      }, 4000);
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Logo className="h-14 w-auto" />
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <a href="/auth?mode=signin" className="rounded-xl bg-gradient-primary px-5 py-2 text-sm text-primary-foreground shadow-glow">
            Back to sign in
          </a>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      )}
    </div>
  );
}
