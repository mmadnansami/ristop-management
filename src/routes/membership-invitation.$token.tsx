import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  MEMBERSHIP_TIERS,
  formatMemberId,
  generateSecureToken,
  type MembershipTierSlug,
} from "@/lib/membership";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  LogIn,
} from "lucide-react";

export const Route = createFileRoute("/membership-invitation/$token")({
  head: () => ({
    meta: [
      { title: "Special Membership Invitation — Ristop Management" },
      {
        name: "description",
        content: "Accept your exclusive invitation to Ristop Special Membership™.",
      },
    ],
  }),
  component: MembershipInvitationPage,
});

function MembershipInvitationPage() {
  const { token } = Route.useParams();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: userResp } = await supabase.auth.getUser();
        setCurrentUser(userResp?.user || null);

        const { data: invite, error } = await supabase
          .from("membership_invitations")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (error || !invite) {
          setErrorMsg(
            bn
              ? "আমন্ত্রণ লিংকটি অকার্যকর বা বাতিল করা হয়েছে।"
              : "Invitation token is invalid or revoked.",
          );
          return;
        }

        if (invite.is_revoked) {
          setErrorMsg(
            bn
              ? "এই আমন্ত্রণটি এডমিন দ্বারা প্রত্যাহার (Revoked) করা হয়েছে।"
              : "This invitation has been revoked by administration.",
          );
          return;
        }

        if (invite.used_by || invite.used_at) {
          setErrorMsg(
            bn
              ? "এই আমন্ত্রণটি ইতোমধ্যেই ব্যবহার করা হয়েছে।"
              : "This invitation has already been claimed.",
          );
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setErrorMsg(
            bn ? "এই আমন্ত্রণটির মেয়াদ শেষ হয়ে গেছে।" : "This invitation link has expired.",
          );
          return;
        }

        setInvitation(invite);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const claimInvitation = async () => {
    if (!currentUser) {
      // Store token in session to redirect back
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ristop_pending_invite", token);
      }
      nav({ to: "/auth", search: { mode: "signin" } });
      return;
    }

    setClaiming(true);
    try {
      // Secure server-side RPC execution
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
        "claim_membership_invitation",
        {
          _token: token,
        },
      );

      if (rpcErr) {
        throw new Error(rpcErr.message || "Failed to claim invitation");
      }

      setClaimed(true);
      toast.success(
        bn
          ? "অভিনন্দন! আপনার স্পেশাল মেম্বারশিপ সক্রিয় হয়েছে।"
          : "Congratulations! Your membership is now active.",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to claim invitation");
    } finally {
      setClaiming(false);
    }
  };

  const tierConfig = invitation
    ? MEMBERSHIP_TIERS[invitation.tier as MembershipTierSlug] || MEMBERSHIP_TIERS.special
    : null;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/">
          <Logo className="h-10 w-auto" />
        </Link>
        <LanguageToggle />
      </header>

      <main className="container mx-auto flex-1 px-4 py-12 max-w-lg">
        <div className="rounded-2xl glass border border-primary/30 p-6 sm:p-8 shadow-glow text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
            <span>VIP Membership Invitation</span>
          </div>

          {loading ? (
            <div className="py-12 space-y-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                {bn ? "আমন্ত্রণ তথ্য লোড হচ্ছে..." : "Loading invitation details..."}
              </p>
            </div>
          ) : errorMsg ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 text-destructive mx-auto flex items-center justify-center">
                <XCircle className="h-10 w-10" />
              </div>
              <h1 className="text-xl font-bold text-destructive">
                {bn ? "আমন্ত্রণ গ্রহণযোগ্য নয়" : "Invitation Not Available"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{errorMsg}</p>
              <div className="pt-2">
                <Link to="/special-membership">
                  <Button variant="outline" className="border-primary/40 text-xs">
                    {bn ? "পাবলিক আবেদন পেজে যান" : "View Special Membership"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : claimed ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-black text-gradient">
                {bn ? "মেম্বারশিপ সক্রিয় হয়েছে!" : "Membership Activated!"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {bn
                  ? "আপনার ডিজিটাল প্রিভিলেজ কার্ড প্রস্তুত। ড্যাশবোর্ডে গিয়ে কার্ড ডাউনলোড ও ব্যবহারের সুবিধা গ্রহণ করুন।"
                  : "Your Privilege Card is issued. Access your member portal to view your card and unlocked discounts."}
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => nav({ to: "/membership" })}
                  className="bg-gradient-primary shadow-glow gap-2"
                >
                  <Crown className="h-4 w-4" />
                  {bn ? "মেম্বার ড্যাশবোর্ডে যান" : "Go to Membership Portal"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-5">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary-glow mx-auto flex items-center justify-center">
                <Crown className="h-9 w-9" />
              </div>

              <div>
                <h1 className="text-2xl font-black text-foreground">
                  {invitation?.invitee_name
                    ? `Welcome, ${invitation.invitee_name}!`
                    : bn
                      ? "বিশেষ আমন্ত্রণ পত্র"
                      : "Exclusive Member Invitation"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {bn
                    ? "আপনাকে রিস্টপ স্পেশাল মেম্বারশিপ প্রোগ্রামে অন্তর্ভুক্তির জন্য আমন্ত্রণ জানানো হয়েছে।"
                    : "You have been invited to join the official Ristop Special Membership™ program."}
                </p>
              </div>

              {/* Invited Tier Details */}
              <div className="rounded-xl bg-background/60 border border-primary/30 p-4 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "আমন্ত্রিত টায়ার" : "Invited Tier"}
                  </span>
                  <span className="font-bold text-sm text-primary-glow uppercase">
                    {tierConfig?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "সাবস্ক্রিপশন ডিসকাউন্ট" : "Subscription Discount"}
                  </span>
                  <span className="font-bold text-xs text-emerald-400">
                    {tierConfig?.discount_percent}% OFF
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "মেয়াদোত্তীর্ণের তারিখ" : "Invitation Expiry"}
                  </span>
                  <span className="text-xs font-mono">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
                {invitation.note && (
                  <div className="pt-1">
                    <span className="text-xs text-muted-foreground block">
                      {bn ? "এডমিন বার্তা:" : "Admin Note:"}
                    </span>
                    <p className="text-xs text-foreground/90 italic mt-0.5">"{invitation.note}"</p>
                  </div>
                )}
              </div>

              {!currentUser ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-2">
                  <p>
                    {bn
                      ? "আমন্ত্রণ গ্রহণ করতে প্রথমে আপনার রিস্টপ একাউন্টে সাইন-ইন বা রেজিস্টার করুন।"
                      : "Please sign in or register to attach this membership to your account."}
                  </p>
                  <Button
                    onClick={() => {
                      if (typeof window !== "undefined")
                        sessionStorage.setItem("ristop_pending_invite", token);
                      nav({ to: "/auth", search: { mode: "signin" } });
                    }}
                    size="sm"
                    className="bg-gradient-primary w-full gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {bn ? "লগইন করে গ্রহণ করুন" : "Sign In to Accept"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={claimInvitation}
                  disabled={claiming}
                  className="w-full bg-gradient-primary shadow-glow h-11 text-base font-bold gap-2"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {claiming
                    ? "Activating..."
                    : bn
                      ? "আমন্ত্রণ গ্রহণ ও মেম্বারশিপ চালু করুন"
                      : "Accept Invitation & Activate"}
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
