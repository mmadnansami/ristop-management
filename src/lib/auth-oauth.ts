import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/**
 * The Lovable OAuth broker lives at the relative path `/~oauth/initiate`, which
 * only exists on Lovable-hosted origins (preview / *.lovable.app). On any other
 * deployment (Vercel, custom domain) that path 404s, so we fall back to the
 * backend's own Google OAuth endpoint, which redirects back to /auth-callback.
 */
export function isLovableHostedOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const lovableHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.dev");
  const inIframe = window.self !== window.top;
  return lovableHost || inIframe;
}

export type GoogleSignInResult = { error: Error | null; redirected: boolean };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const callbackUrl = `${window.location.origin}/auth-callback`;

  if (isLovableHostedOrigin()) {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?mode=signin`,
      extraParams: { prompt: "select_account" },
    });
    if (res.error) return { error: res.error, redirected: false };
    return { error: null, redirected: Boolean(res.redirected) };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) return { error, redirected: false };
  // Supabase performs a full-page redirect to Google.
  return { error: null, redirected: true };
}
