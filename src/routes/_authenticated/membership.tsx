import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { PrivilegeCard } from "@/components/PrivilegeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  Copy,
  Zap,
} from "lucide-react";
import { MEMBERSHIP_TIERS, type MembershipTierSlug } from "@/lib/membership";

export const Route = createFileRoute("/_authenticated/membership")({
  component: UserMembershipPage,
});

function UserMembershipPage() {
  const { lang } = useI18n();
  const { money } = useCurrency();
  const bn = lang === "bn";
  const nav = useNavigate();
  const qc = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [payMethod, setPayMethod] = useState("bkash");
  const [payTxn, setPayTxn] = useState("");
  const [paying, setPaying] = useState(false);

  // Fetch user data, current active membership, cards, applications, and payments
  const { data, isLoading } = useQuery({
    queryKey: ["user-membership-data"],
    queryFn: async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) return null;

      const [profileRes, memRes, appRes, payRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).single(),
        supabase
          .from("memberships")
          .select("*, membership_cards(*)")
          .eq("user_id", uid)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("membership_applications")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("membership_payments")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("membership_notifications")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        user: userResp.user,
        profile: profileRes.data,
        membership: memRes.data,
        applications: appRes.data || [],
        payments: payRes.data || [],
        notifications: notifRes.data || [],
      };
    },
  });

  const membership = data?.membership;
  const activeCard = membership?.membership_cards?.[0];
  const applications = data?.applications || [];
  const payments = data?.payments || [];
  const notifications = data?.notifications || [];

  const tierSlug = (membership?.tier as MembershipTierSlug) || "special";
  const tierConfig = MEMBERSHIP_TIERS[tierSlug] || MEMBERSHIP_TIERS.special;

  // Check if there is an approved application waiting for payment
  const pendingPaymentApp = applications.find(
    (a) => a.status === "approved" || a.status === "payment_pending",
  );

  const openPaymentFor = (app: any) => {
    setSelectedApp(app);
    setPaymentModalOpen(true);
  };

  const submitMembershipPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTxn.trim()) {
      toast.error(bn ? "ট্রানজেকশন আইডি প্রদান করুন" : "Please enter the Transaction ID");
      return;
    }
    setPaying(true);
    try {
      const tier = (selectedApp?.requested_tier as MembershipTierSlug) || "premium";
      const config = MEMBERSHIP_TIERS[tier];
      const amount = config.price_bdt;

      const { data: newPay, error: payErr } = await supabase
        .from("membership_payments")
        .insert({
          application_id: selectedApp?.id || null,
          user_id: data!.user.id,
          tier,
          amount,
          currency: "BDT",
          payment_method: payMethod,
          transaction_id: payTxn.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (payErr) throw payErr;

      // Update application status to payment_pending
      if (selectedApp?.id) {
        await supabase
          .from("membership_applications")
          .update({ status: "payment_pending", updated_at: new Date().toISOString() })
          .eq("id", selectedApp.id);
      }

      // Add audit log
      await supabase.from("membership_audit_logs").insert({
        actor_id: data!.user.id,
        action: "membership_payment_submitted",
        target_id: newPay.id,
        details: { amount, method: payMethod, txn: payTxn.trim() },
      });

      toast.success(
        bn
          ? "পেমেন্ট তথ্য সফলভাবে জমা হয়েছে! এডমিন যাচাই শেষে মেম্বারশিপ একটিভ হবে।"
          : "Payment submitted successfully! Admin will verify and activate your membership.",
      );
      setPaymentModalOpen(false);
      setPayTxn("");
      qc.invalidateQueries({ queryKey: ["user-membership-data"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    } finally {
      setPaying(false);
    }
  };

  const payNumber = payMethod === "bkash" ? "01888616396" : "01317680620";

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {bn ? "লোড হচ্ছে..." : "Loading membership details..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">
              {bn ? "স্পেশাল মেম্বারশিপ পোর্টাল" : "Ristop Special Membership™"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary-glow border border-primary/30">
              Privilege Program
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {bn
              ? "আপনার মেম্বার আইডি, ডিজিটাল প্রিভিলেজ কার্ড ও সাবস্ক্রিপশন ডিসকাউন্ট সুবিধা"
              : "Manage your digital Privilege Card, member discounts, and privileges"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!membership && (
            <Link to="/special-membership">
              <Button className="bg-gradient-primary shadow-glow gap-1.5">
                <Crown className="h-4 w-4" />
                {bn ? "আবেদন করুন" : "Apply for Membership"}
              </Button>
            </Link>
          )}
          <Link to="/subscribe">
            <Button variant="outline" className="border-primary/40 gap-1.5 text-xs">
              <Zap className="h-4 w-4 text-primary-glow" />
              {bn ? "সাবস্ক্রিপশন কিনুন (ডিসকাউন্ট সহ)" : "Use Member Discount"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Payment Alert if applicable */}
      {pendingPaymentApp && !membership && (
        <div className="rounded-2xl glass border border-amber-500/40 p-5 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-300">
                {bn
                  ? "আবেদন অনুমোদিত হয়েছে — পেমেন্ট পেন্ডিং"
                  : "Application Approved — Payment Required"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bn
                  ? `আপনার ${pendingPaymentApp.requested_tier.toUpperCase()} টায়ারের আবেদন অনুমোদিত হয়েছে। কার্ড ও সুবিধা চালু করতে অনুগ্রহ করে ফি পরিশোধ করুন।`
                  : `Your application for ${pendingPaymentApp.requested_tier.toUpperCase()} is approved. Complete payment to activate your card.`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => openPaymentFor(pendingPaymentApp)}
            className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-bold shrink-0 shadow-md"
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            {bn ? "পেমেন্ট সম্পন্ন করুন" : "Complete Payment"}
          </Button>
        </div>
      )}

      {/* Main Membership Status or Non-Member Invitation */}
      {membership && activeCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Digital Card Preview on Left */}
          <div className="lg:col-span-6 rounded-2xl glass border border-primary/30 p-6 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-glow" />
                {bn ? "ডিজিটাল প্রিভিলেজ কার্ড" : "Ristop Privilege Card"}
              </h2>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>

            <PrivilegeCard
              memberName={data?.profile?.full_name || data?.user?.email || "Valued Member"}
              memberId={membership.member_id}
              tier={tierSlug}
              status={membership.status as any}
              startsAt={membership.starts_at}
              expiresAt={membership.expires_at}
              verificationToken={activeCard.verification_token}
              showActions={true}
            />
          </div>

          {/* Member Privileges & Details on Right */}
          <div className="lg:col-span-6 space-y-6">
            {/* Overview Card */}
            <div className="rounded-2xl glass border border-primary/30 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground">
                    {bn ? "সক্রিয় টায়ার" : "Current Tier"}
                  </div>
                  <div className="text-2xl font-black text-gradient mt-0.5">{tierConfig.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {bn ? "ডিসকাউন্ট রেট" : "Subscription Discount"}
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {tierConfig.discount_percent}% OFF
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">
                    {bn ? "মেম্বার আইডি:" : "Member ID:"}
                  </span>
                  <div className="font-mono font-bold text-foreground">{membership.member_id}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    {bn ? "শুরুর তারিখ:" : "Start Date:"}
                  </span>
                  <div className="font-mono text-foreground">
                    {new Date(membership.starts_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    {bn ? "মেয়াদ উত্তীর্ণ:" : "Valid Until:"}
                  </span>
                  <div className="font-mono text-foreground">
                    {membership.expires_at
                      ? new Date(membership.expires_at).toLocaleDateString()
                      : "Permanent / Free"}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    {bn ? "স্ট্যাটাস:" : "Status:"}
                  </span>
                  <div className="font-semibold text-emerald-400 capitalize">
                    {membership.status}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Link to="/special-membership" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs border-primary/40">
                    {bn ? "টায়ার আপগ্রেড আবেদন" : "Request Tier Upgrade"}
                  </Button>
                </Link>
                <Link to="/subscribe" className="flex-1">
                  <Button size="sm" className="w-full bg-gradient-primary text-xs shadow-glow">
                    {bn ? "ডিসকাউন্ট দিয়ে কিনুন" : "Claim Discount"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Unlocked Benefits */}
            <div className="rounded-2xl glass border border-border p-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-glow" />
                {bn ? "আপনার আনলকড মেম্বারশিপ সুবিধাসমূহ" : "Your Unlocked Membership Benefits"}
              </h3>
              <ul className="space-y-2.5 text-xs">
                {(bn ? tierConfig.benefits_bn : tierConfig.benefits).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Non-member Welcome / Call to Action */
        <div className="rounded-2xl glass border border-primary/30 p-8 sm:p-10 text-center relative overflow-hidden shadow-glow">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg mb-5">
            <Crown className="h-9 w-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gradient">
            {bn ? "রিস্টপ স্পেশাল মেম্বারশিপে যুক্ত হোন" : "Join Ristop Special Membership™"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {bn
              ? "ডিজিটাল কার্ড, ভেরিফায়েড প্রিভিলেজ আইডি এবং যেকোনো সফটওয়্যার প্ল্যানে ১৫% থেকে ৩০% পর্যন্ত বিশেষ ডিসকাউন্ট আনলক করতে এখনই মেম্বারশিপ আবেদন জমা দিন।"
              : "Unlock verified Privilege Cards, secure QR validation, and guaranteed 15% to 30% discount on software subscriptions."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/special-membership">
              <Button size="lg" className="bg-gradient-primary shadow-glow h-11 px-8 gap-2">
                <Crown className="h-4 w-4" />
                {bn ? "মেম্বারশিপ প্ল্যান ও আবেদন" : "Explore Tiers & Apply"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Application History & Payment Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="rounded-2xl glass border border-border p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-glow" />
            {bn ? "আবেদনের ইতিহাস" : "Membership Applications"} ({applications.length})
          </h3>

          {applications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {bn ? "কোনো আবেদন জমা হয়নি" : "No applications submitted yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl bg-background/50 border border-border text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-primary-glow">
                      {app.requested_tier} Member
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === "active" || app.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : app.status === "rejected"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  {app.admin_notes && (
                    <div className="text-[11px] text-foreground/80 italic pt-1 border-t border-border/50">
                      <strong>Admin note:</strong> {app.admin_notes}
                    </div>
                  )}
                  {(app.status === "approved" || app.status === "payment_pending") && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => openPaymentFor(app)}
                        className="w-full bg-gradient-primary text-[11px] h-8"
                      >
                        {bn ? "পেমেন্ট সম্পন্ন করুন" : "Submit Payment"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="rounded-2xl glass border border-border p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary-glow" />
            {bn ? "মেম্বারশিপ পেমেন্ট ট্রানজেকশন" : "Payment Transactions"} ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {bn ? "কোনো পেমেন্ট রেকর্ড নেই" : "No payment records found."}
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-background/50 border border-border text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">
                      {money(Number(p.amount))} ({p.currency})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : p.status === "rejected"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex justify-between">
                    <span>Method: {p.payment_method.toUpperCase()}</span>
                    <span className="font-mono text-foreground">{p.transaction_id}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Date: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-glow" />
              {bn ? "মেম্বারশিপ পেমেন্ট সাবমিট" : "Submit Membership Payment"}
            </DialogTitle>
            <DialogDescription>
              {bn
                ? "অনুমোদিত টায়ারের জন্য পেমেন্ট সম্পন্ন করে ট্রানজেকশন আইডি প্রদান করুন।"
                : "Send payment to activate your approved membership tier."}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <form onSubmit={submitMembershipPayment} className="space-y-4 mt-2">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex justify-between items-center text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{bn ? "টায়ার" : "Tier"}</div>
                  <div className="font-bold uppercase text-primary-glow">
                    {selectedApp.requested_tier}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{bn ? "ফি" : "Fee"}</div>
                  <div className="text-base font-black text-foreground">
                    {money(
                      MEMBERSHIP_TIERS[selectedApp.requested_tier as MembershipTierSlug]
                        ?.price_bdt || 299,
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>{bn ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash (Send Money)</SelectItem>
                    <SelectItem value="nagad">Nagad (Send Money)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl bg-background/60 border border-border p-3 text-xs">
                <div className="text-muted-foreground">
                  {bn ? "এই নম্বরে Send Money করুন:" : "Send Money to this number:"}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-sm text-primary-glow">{payNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(payNumber);
                      toast.success("Number copied!");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <Label>{bn ? "ট্রানজেকশন আইডি" : "Transaction ID"} *</Label>
                <Input
                  required
                  value={payTxn}
                  onChange={(e) => setPayTxn(e.target.value)}
                  placeholder="e.g. 9K72B9X12"
                  className="mt-1 font-mono uppercase"
                />
              </div>

              <Button
                type="submit"
                disabled={paying}
                className="w-full bg-gradient-primary shadow-glow h-10"
              >
                {paying ? "Submitting..." : bn ? "পেমেন্ট জমা দিন" : "Submit Payment Record"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
