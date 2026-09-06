import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const COOKIE = "ristop_affiliate_click";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function AffiliateTracker() {
  useEffect(() => {
    const track = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("ref")?.trim().toUpperCase();
      if (code) {
        localStorage.setItem("ristop_ref_code", code);
        const visitorId = localStorage.getItem("ristop_visitor_id") ?? crypto.randomUUID();
        localStorage.setItem("ristop_visitor_id", visitorId);
        const visitorHash = await sha256(visitorId);
        const agentHash = await sha256(navigator.userAgent.slice(0, 500));
        const { data } = await supabase.rpc("track_affiliate_click", {
          _code: code,
          _visitor_hash: visitorHash,
          _landing_path: `${url.pathname}${url.search}`.slice(0, 500),
          _user_agent_hash: agentHash,
          _ip_hash: undefined,
        });
        if (data) {
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `${COOKIE}=${encodeURIComponent(data)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
        }
      }

      const clickId = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE}=`))?.split("=")[1];
      if (!clickId) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      await supabase.rpc("claim_affiliate_click", { _click_id: decodeURIComponent(clickId) });
    };

    void track();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void track();
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}