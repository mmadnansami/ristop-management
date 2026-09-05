import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { AffiliateTracker } from "@/components/AffiliateTracker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">এই পেজটি পাওয়া যায়নি।</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  const message = error instanceof Error ? error.message : typeof error === "string" && error ? error : "A temporary issue happened. Please try again.";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-strong max-w-md rounded-3xl p-8 text-center shadow-glow">
        <h1 className="text-xl font-semibold text-gradient">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm text-primary-foreground shadow-glow">Try again</button>
          <a href="/" className="rounded-xl border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

const SITE_TITLE = "Ristop Management - Complete Business Management Software with Ris AI Assistant";
const SITE_DESC = "Ristop Management- আপনার ব্যবসার পূর্ণ ম্যানেজমেন্ট, এক জায়গায়। স্মার্ট স্টক, সেলস, প্রফিট, কাস্টমার ম্যানেজমেন্ট এবং Ris AI অ্যাসিস্ট্যান্ট সম্বলিত একটি সম্পূর্ণ বিজনেস ম্যানেজমেন্ট সিস্টেম। Best business management software in Bangladesh, top AI-powered POS system in Dhaka.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "google-site-verification", content: "fSNN_JpgEN-aWlZrp_TwjNMkIi6JsF8jqnrbWVS90T4" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      { name: "author", content: "Ristop" },
      { name: "keywords", content: "Ristop Management, business management software Bangladesh, POS Dhaka, stock management, sales tracking, Ris AI, inventory software Bangladesh, ব্যবসা ম্যানেজমেন্ট" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Ristop Management" },
      { property: "og:locale", content: "bn_BD" },
      { property: "og:locale:alternate", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESC },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/ristop-official-logo.png" },
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Ristop Management",
            alternateName: "Ristop Software",
            url: "https://ristop-smart-hub.lovable.app/",
            logo: "https://ristop-smart-hub.lovable.app/ristop-official-logo.png",
            image: "https://ristop-smart-hub.lovable.app/ristop-official-logo.png",
            description: SITE_DESC,
            telephone: "+8801317680620",
            areaServed: { "@type": "Country", name: "Bangladesh" },
            sameAs: ["https://wa.me/8801317680620"],
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Ristop Management",
            operatingSystem: "Web, Android, iOS",
            applicationCategory: "BusinessApplication",
            description: SITE_DESC,
            image: "https://ristop-smart-hub.lovable.app/ristop-official-logo.png",
            offers: [
              { "@type": "Offer", priceCurrency: "BDT", price: "190", name: "Monthly plan (launch discount)" },
              { "@type": "Offer", priceCurrency: "USD", price: "3", name: "Monthly plan (launch discount)" },
              { "@type": "Offer", priceCurrency: "USD", price: "10", name: "3-month plan" },
              { "@type": "Offer", priceCurrency: "USD", price: "16", name: "6-month plan" },
            ],
            areaServed: { "@type": "Country", name: "Bangladesh" },
          },
        ]),
      },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

/**
 * Password-recovery links can land on any path (Supabase falls back to the
 * Site URL). Catch the recovery token anywhere and send the user to the
 * reset-password screen with the token preserved.
 */
function RecoveryRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, hash, search } = window.location;
    if (pathname === "/reset-password") return;
    const isRecovery = hash.includes("type=recovery") || new URLSearchParams(search).get("type") === "recovery";
    if (isRecovery) window.location.replace(`/reset-password${search}${hash}`);
  }, []);
  return null;
}

function AuthListener() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (window.location.pathname !== "/reset-password") window.location.replace("/reset-password");
        return;
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") qc.clear();
      else qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <CurrencyProvider>
          <AuthListener />
          <RecoveryRedirect />

          <Outlet />
          <Toaster position="top-right" />
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
