import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Crown,
  Calendar,
  UserCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { MEMBERSHIP_TIERS, type MembershipTierSlug } from "@/lib/membership";

export const Route = createFileRoute("/verify-membership/$token")({
  head: () => ({
    meta: [
      { title: "Verify Membership — Ristop Special Membership™" },
      {
        name: "description",
        content: "Official Ristop Special Membership™ public verification check.",
      },
    ],
  }),
  component: VerifyMembershipPage,
});

type VerificationResult = {
  isValid: boolean;
  isRevoked: boolean;
  revokedReason?: string | null;
  memberName: string;
  memberId: string;
  tier: MembershipTierSlug;
  status: "active" | "expired" | "suspended" | "revoked";
  startsAt: string;
  expiresAt: string | null;
  issuedAt: string;
};

function VerifyMembershipPage() {
  const { token } = Route.useParams();
  const { lang } = useI18n();
  const bn = lang === "bn";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      try {
        // Query membership_cards by verification token
        const { data: card, error: cardError } = await supabase
          .from("membership_cards")
          .select("*, memberships(*, profiles(full_name, email))")
          .eq("verification_token", token)
          .maybeSingle();

        if (cardError || !card) {
          setResult({
            isValid: false,
            isRevoked: false,
            memberName: "",
            memberId: "",
            tier: "special",
            status: "revoked",
            startsAt: "",
            expiresAt: null,
            issuedAt: "",
          });
          return;
        }

        const membership = card.memberships as any;
        const profile = membership?.profiles as any;

        // Check if card is revoked or membership is not active
        const isRevoked = card.is_revoked || membership?.status === "revoked";
        const isExpired = membership?.expires_at && new Date(membership.expires_at) < new Date();
        const computedStatus = isRevoked
          ? "revoked"
          : isExpired
            ? "expired"
            : membership?.status || "active";

        setResult({
          isValid: true,
          isRevoked,
          revokedReason: card.revoked_reason,
          memberName: profile?.full_name || "Verified Member",
          memberId: membership?.member_id || card.card_number,
          tier: (membership?.tier as MembershipTierSlug) || "special",
          status: computedStatus,
          startsAt: membership?.starts_at || card.issued_at,
          expiresAt: membership?.expires_at || null,
          issuedAt: card.issued_at,
        });
      } catch (err) {
        console.error("Verification error:", err);
        setResult({
          isValid: false,
          isRevoked: false,
          memberName: "",
          memberId: "",
          tier: "special",
          status: "revoked",
          startsAt: "",
          expiresAt: null,
          issuedAt: "",
        });
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const tierInfo = result ? MEMBERSHIP_TIERS[result.tier] || MEMBERSHIP_TIERS.special : null;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Top Header */}
      <header className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/">
          <Logo className="h-10 w-auto" />
        </Link>
        <LanguageToggle />
      </header>

      {/* Verification Container */}
      <main className="container mx-auto flex-1 px-4 py-8 max-w-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> {bn ? "হোমে ফিরে যান" : "Back to Home"}
        </Link>

        <div className="rounded-2xl glass border border-primary/30 p-6 sm:p-8 shadow-glow text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-5">
            <Crown className="h-3.5 w-3.5 text-primary-glow" />
            <span>Ristop Privilege™ Official Verification</span>
          </div>

          {loading ? (
            <div className="py-12 space-y-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                {bn ? "কার্ড সত্যতা যাচাই করা হচ্ছে..." : "Verifying membership authenticity..."}
              </p>
            </div>
          ) : !result || !result.isValid ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 text-destructive mx-auto flex items-center justify-center">
                <XCircle className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold text-destructive">
                {bn ? "অকার্যকর বা অজানা মেম্বারশিপ টোকেন" : "Invalid Membership Token"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {bn
                  ? "এই কিউআর কোড বা ভেরিফিকেশন টোকেনটি রিস্টপ-এর অফিসিয়াল ডাটাবেজে খুঁজে পাওয়া যায়নি।"
                  : "This verification token or QR code was not found in our official registry."}
              </p>
            </div>
          ) : result.isRevoked ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold text-rose-400">
                {bn ? "কার্ডটি বাতিল (Revoked) করা হয়েছে" : "Card Revoked"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {bn
                  ? "এই ডিজিটাল কার্ডটি নিরাপত্তা বা প্রশাসনিক কারণে এডমিন দ্বারা স্থগিত বা বাতিল করা হয়েছে।"
                  : "This privilege card has been revoked by administration. It is no longer valid."}
              </p>
              {result.revokedReason && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  <strong>Reason:</strong> {result.revokedReason}
                </div>
              )}
            </div>
          ) : result.status === "expired" ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold text-amber-400">
                {bn ? "মেয়াদোত্তীর্ণ মেম্বারশিপ (Expired)" : "Membership Expired"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {bn
                  ? "মেম্বারশিপের মেয়াদ শেষ হয়েছে। নবায়নের মাধ্যমে পুনরায় সকল সুবিধা চালু করা যাবে।"
                  : "This membership has expired. The cardholder can renew from their dashboard."}
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-black text-emerald-400">
                {bn ? "অফিসিয়ালি ভেরিফাইড মেম্বার" : "Officially Verified Member"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {bn
                  ? "রিস্টপ ম্যানেজমেন্ট™ স্পেশাল মেম্বারশিপ প্রোগ্রামের সক্রিয় সদস্য"
                  : "Active member of Ristop Special Membership™ program"}
              </p>

              {/* Verified Details Card */}
              <div className="rounded-xl bg-background/50 border border-border p-4 text-left space-y-3 mt-4">
                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "সদস্যের নাম" : "Member Name"}
                  </span>
                  <span className="font-bold text-sm text-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> {result.memberName}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "মেম্বার আইডি" : "Member ID"}
                  </span>
                  <span className="font-mono font-bold text-sm text-primary-glow">
                    {result.memberId}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "মেম্বারশিপ টায়ার" : "Membership Tier"}
                  </span>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-primary/20 text-primary-glow">
                    {tierInfo?.name || result.tier}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-border/60 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "ইস্যু তারিখ" : "Issue Date"}
                  </span>
                  <span className="text-xs font-mono">
                    {new Date(result.startsAt).toLocaleDateString()}
                  </span>
                </div>

                {result.expiresAt && (
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-xs text-muted-foreground">
                      {bn ? "মেয়াদ" : "Expiry Date"}
                    </span>
                    <span className="text-xs font-mono">
                      {new Date(result.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">
                    {bn ? "স্ট্যাটাস" : "Status"}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> {result.status}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/special-membership">
                  <Button variant="outline" className="border-primary/40 text-xs">
                    {bn ? "স্পেশাল মেম্বারশিপ সম্পর্কে জানুন" : "About Special Membership"}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
