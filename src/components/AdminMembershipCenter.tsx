import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Crown,
  Users,
  ShieldCheck,
  CreditCard,
  Mail,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  MEMBERSHIP_TIERS,
  formatMemberId,
  generateSecureToken,
  type MembershipTierSlug,
} from "@/lib/membership";

export function AdminMembershipCenter() {
  const { lang } = useI18n();
  const { money } = useCurrency();
  const bn = lang === "bn";
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "overview" | "applications" | "members" | "tiers" | "invitations" | "cards" | "payments"
  >("overview");

  // Filter states
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");

  // Action Dialog states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    tier: "special" as MembershipTierSlug,
    email: "",
    name: "",
    note: "",
    expiresDays: 7,
  });
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Review Application Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // Edit Tier Modal
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [selectedTierSlug, setSelectedTierSlug] = useState<MembershipTierSlug>("special");
  const [tierForm, setTierForm] = useState({
    price_bdt: 0,
    price_usd: 0,
    discount_percent: 15,
    billing_period: "annual",
  });

  // Query all real database records
  const { data, isLoading } = useQuery({
    queryKey: ["admin-membership-all"],
    queryFn: async () => {
      const [tiersRes, appsRes, memsRes, cardsRes, invitesRes, paymentsRes, profilesRes] =
        await Promise.all([
          supabase.from("membership_tiers").select("*").order("slug"),
          supabase
            .from("membership_applications")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("memberships")
            .select("*, profiles(full_name, email, phone)")
            .order("created_at", { ascending: false }),
          supabase
            .from("membership_cards")
            .select("*, memberships(member_id, tier, profiles(full_name))")
            .order("created_at", { ascending: false }),
          supabase
            .from("membership_invitations")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("membership_payments")
            .select("*, profiles(full_name, email)")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, full_name, email"),
        ]);

      return {
        tiers: tiersRes.data || [],
        applications: appsRes.data || [],
        members: memsRes.data || [],
        cards: cardsRes.data || [],
        invitations: invitesRes.data || [],
        payments: paymentsRes.data || [],
        profiles: profilesRes.data || [],
      };
    },
  });

  // Real statistics
  const members = data?.members || [];
  const applications = data?.applications || [];
  const payments = data?.payments || [];
  const cards = data?.cards || [];
  const invitations = data?.invitations || [];
  const tiers = data?.tiers || [];

  const activeMembers = members.filter((m) => m.status === "active");
  const specialCount = activeMembers.filter((m) => m.tier === "special").length;
  const premiumCount = activeMembers.filter((m) => m.tier === "premium").length;
  const eliteCount = activeMembers.filter((m) => m.tier === "elite").length;
  const pendingApps = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review",
  ).length;
  const verifiedRevenue = payments
    .filter((p) => p.status === "verified")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  // Application Action: Approve / Reject / Request Info via secure server RPC
  const handleApplicationDecision = async (action: "approve" | "reject" | "request_info") => {
    if (!selectedApp) return;
    setProcessingAction(true);
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
        "admin_review_application",
        {
          _app_id: selectedApp.id,
          _action: action,
          _admin_notes: adminNote.trim() || null,
        },
      );

      if (rpcErr) {
        // Fallback for local environments or direct table update
        const statusMap = {
          approve: selectedApp.requested_tier === "special" ? "active" : "approved",
          reject: "rejected",
          request_info: "under_review",
        };
        const nextStatus = statusMap[action];
        const { error: fallbackErr } = await supabase
          .from("membership_applications")
          .update({
            status: nextStatus,
            admin_notes: adminNote.trim() || selectedApp.admin_notes,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedApp.id);

        if (fallbackErr) throw fallbackErr;
      }

      toast.success(`Application processed: ${action}`);
      setReviewModalOpen(false);
      setSelectedApp(null);
      setAdminNote("");
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update application");
    } finally {
      setProcessingAction(false);
    }
  };

  // Payment Verification & Member Activation
  const verifyPaymentAndActivate = async (pay: any) => {
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const verifierId = userResp?.user?.id || null;

      // 1. Mark payment verified
      await supabase
        .from("membership_payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: verifierId,
        })
        .eq("id", pay.id);

      // 2. Activate or create membership
      const tier = pay.tier as MembershipTierSlug;
      const num = Math.floor(1000 + Math.random() * 9000);
      const memberId = formatMemberId(tier, num);
      const token = generateSecureToken("rstcard");
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://ristopmanagement.site";

      const { data: mem, error: memErr } = await supabase
        .from("memberships")
        .insert({
          user_id: pay.user_id,
          application_id: pay.application_id,
          tier,
          status: "active",
          member_id: memberId,
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        })
        .select()
        .single();

      if (memErr) throw memErr;

      // 3. Issue digital card
      await supabase.from("membership_cards").insert({
        membership_id: mem.id,
        user_id: pay.user_id,
        card_number: memberId,
        verification_token: token,
        qr_code_data: `${origin}/verify-membership/${token}`,
        issued_at: new Date().toISOString(),
      });

      // 4. Update application status if exists
      if (pay.application_id) {
        await supabase
          .from("membership_applications")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", pay.application_id);
      }

      // 5. Notify user
      await supabase.from("membership_notifications").insert({
        user_id: pay.user_id,
        title: "Membership Payment Confirmed & Card Issued",
        message: `Your payment of ৳${pay.amount} has been verified. Welcome to ${tier.toUpperCase()} Membership!`,
        type: "success",
      });

      // 6. Audit
      await supabase.from("membership_audit_logs").insert({
        actor_id: verifierId,
        action: "membership_payment_verified_and_activated",
        target_id: mem.id,
        details: { payment_id: pay.id, member_id: memberId, amount: pay.amount },
      });

      toast.success("Payment verified! Membership & Privilege Card activated.");
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to verify payment");
    }
  };

  // Generate Admin Invitation
  const generateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const adminId = userResp?.user?.id || null;
      const token = generateSecureToken("rstinv");
      const expiresAt = new Date(
        Date.now() + inviteForm.expiresDays * 24 * 3600 * 1000,
      ).toISOString();

      const { data: newInvite, error } = await supabase
        .from("membership_invitations")
        .insert({
          token,
          tier: inviteForm.tier,
          email: inviteForm.email.trim().toLowerCase() || null,
          invitee_name: inviteForm.name.trim() || null,
          note: inviteForm.note.trim() || null,
          expires_at: expiresAt,
          created_by: adminId,
        })
        .select()
        .single();

      if (error) throw error;

      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://ristopmanagement.site";
      const link = `${origin}/membership-invitation/${token}`;
      setGeneratedInviteLink(link);

      await supabase.from("membership_audit_logs").insert({
        actor_id: adminId,
        action: "invitation_created",
        target_id: newInvite.id,
        details: { tier: inviteForm.tier, email: inviteForm.email },
      });

      toast.success("Invitation generated successfully!");
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invitation");
    }
  };

  // Revoke Invitation
  const revokeInvitation = async (id: string) => {
    try {
      await supabase.from("membership_invitations").update({ is_revoked: true }).eq("id", id);
      toast.success("Invitation revoked");
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke invitation");
    }
  };

  // Card Revocation via secure server RPC
  const toggleCardRevocation = async (card: any) => {
    const nextState = !card.is_revoked;
    try {
      const { error: rpcErr } = await (supabase.rpc as any)("admin_toggle_card_revocation", {
        _card_id: card.id,
        _revoke: nextState,
        _reason: nextState ? "Revoked by administrative security control" : null,
      });

      if (rpcErr) {
        // Direct table update fallback
        await supabase
          .from("membership_cards")
          .update({
            is_revoked: nextState,
            revoked_at: nextState ? new Date().toISOString() : null,
            revoked_reason: nextState ? "Revoked by administrative security control" : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id);
      }

      toast.success(nextState ? "Card revoked" : "Card reactivated");
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle card revocation");
    }
  };

  // Member Suspension / Reactivation
  const toggleMemberSuspension = async (member: any) => {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    try {
      await supabase
        .from("memberships")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", member.id);

      toast.success(`Membership status updated to: ${nextStatus}`);
      qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle membership status");
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((a) => {
    const matchesSearch =
      a.full_name?.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.phone?.includes(appSearch);
    const matchesStatus = appStatusFilter === "all" || a.status === appStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const prof = m.profiles as any;
    return (
      m.member_id?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      prof?.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      prof?.email?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gradient flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary-glow" />
            Special Membership™ Control Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bn
              ? "রিস্টপ স্পেশাল মেম্বারশিপ প্রশাসন, আবেদন পর্যালোচনা, কার্ড ভেরিফিকেশন ও পরিসংখ্যান"
              : "Enterprise membership governance, applicant reviews, and digital card verification"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setGeneratedInviteLink(null);
              setInviteModalOpen(true);
            }}
            className="bg-gradient-primary shadow-glow gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {bn ? "আমন্ত্রণ লিংক তৈরি" : "Create Invitation"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-membership-all"] })}
            className="border-primary/40 gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-3">
        {[
          { id: "overview", label: "Overview & Stats" },
          { id: "applications", label: `Applications (${pendingApps})` },
          { id: "members", label: `Members (${activeMembers.length})` },
          { id: "invitations", label: "Invitations" },
          { id: "cards", label: "Privilege Cards" },
          { id: "payments", label: "Payments" },
          { id: "tiers", label: "Tiers & Pricing" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="rounded-xl glass border border-primary/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Total Active</div>
              <div className="text-2xl font-black text-gradient mt-1">{activeMembers.length}</div>
            </div>
            <div className="rounded-xl glass border border-purple-500/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Special (Free)</div>
              <div className="text-2xl font-black text-purple-400 mt-1">{specialCount}</div>
            </div>
            <div className="rounded-xl glass border border-slate-400/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Premium</div>
              <div className="text-2xl font-black text-slate-200 mt-1">{premiumCount}</div>
            </div>
            <div className="rounded-xl glass border border-amber-500/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Elite (VIP)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{eliteCount}</div>
            </div>
            <div className="rounded-xl glass border border-amber-500/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Pending Apps</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{pendingApps}</div>
            </div>
            <div className="rounded-xl glass border border-emerald-500/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Verified Revenue</div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {money(verifiedRevenue)}
              </div>
            </div>
            <div className="rounded-xl glass border border-primary/30 p-3.5">
              <div className="text-[11px] text-muted-foreground">Issued Cards</div>
              <div className="text-2xl font-black text-primary-glow mt-1">{cards.length}</div>
            </div>
          </div>

          {/* Quick Pending Review List */}
          <div className="rounded-2xl glass border border-border p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Pending Membership Applications ({pendingApps})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveTab("applications")}
                className="text-xs"
              >
                View All
              </Button>
            </div>

            {applications.filter((a) => a.status === "pending" || a.status === "under_review")
              .length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No pending applications
              </div>
            ) : (
              <div className="space-y-2">
                {applications
                  .filter((a) => a.status === "pending" || a.status === "under_review")
                  .slice(0, 5)
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-background/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{app.full_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary-glow text-[10px] uppercase font-bold">
                            {app.requested_tier}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          {app.email} • {app.phone} • {app.business_category}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNote(app.admin_notes || "");
                          setReviewModalOpen(true);
                        }}
                        className="bg-gradient-primary text-xs h-7 self-end sm:self-auto"
                      >
                        Review
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder="Search applicant by name, email, phone..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                <SelectTrigger className="w-36 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="payment_pending">Payment Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl glass border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Business</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((a) => (
                    <tr key={a.id} className="hover:bg-secondary/30 transition">
                      <td className="p-3 text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{a.full_name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.email}</div>
                        <div className="text-[10px] text-muted-foreground">{a.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-foreground">{a.business_name || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {a.business_category}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary/20 text-primary-glow">
                          {a.requested_tier}
                        </span>
                      </td>
                      <td
                        className="p-3 max-w-[200px] truncate text-muted-foreground"
                        title={a.reason}
                      >
                        {a.reason}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.status === "active" || a.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : a.status === "rejected"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApp(a);
                            setAdminNote(a.admin_notes || "");
                            setReviewModalOpen(true);
                          }}
                          className="bg-gradient-primary text-[11px] h-7"
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Search member by ID, name, email..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="rounded-2xl glass border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Member ID</th>
                  <th className="p-3">Name & Email</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No members registered.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const prof = m.profiles as any;
                    return (
                      <tr key={m.id} className="hover:bg-secondary/30 transition">
                        <td className="p-3 font-mono font-bold text-primary-glow">{m.member_id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">
                            {prof?.full_name || "Member"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{prof?.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary/20 text-primary-glow">
                            {m.tier}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(m.starts_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {m.expires_at ? new Date(m.expires_at).toLocaleDateString() : "Permanent"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleMemberSuspension(m)}
                            className="border-primary/40 text-[11px] h-7"
                          >
                            {m.status === "active" ? "Suspend" : "Reactivate"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INVITATIONS TAB */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Generated Invitations ({invitations.length})</h3>
            <Button
              size="sm"
              onClick={() => {
                setGeneratedInviteLink(null);
                setInviteModalOpen(true);
              }}
              className="bg-gradient-primary text-xs"
            >
              <Plus className="h-4 w-4 mr-1" /> New Invitation
            </Button>
          </div>

          <div className="rounded-2xl glass border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Created</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Invitee / Email</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No invitations created yet.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => {
                    const isUsed = Boolean(inv.used_by || inv.used_at);
                    const isExpired = new Date(inv.expires_at) < new Date();
                    const origin =
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "https://ristopmanagement.site";
                    const inviteUrl = `${origin}/membership-invitation/${inv.token}`;

                    return (
                      <tr key={inv.id} className="hover:bg-secondary/30 transition">
                        <td className="p-3 text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold uppercase text-primary-glow">{inv.tier}</td>
                        <td className="p-3">
                          <div className="text-foreground">
                            {inv.invitee_name || "Open Invitation"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {inv.email || "Any email"}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inv.is_revoked
                                ? "bg-rose-500/20 text-rose-400"
                                : isUsed
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : isExpired
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-primary/20 text-primary-glow"
                            }`}
                          >
                            {inv.is_revoked
                              ? "Revoked"
                              : isUsed
                                ? "Claimed"
                                : isExpired
                                  ? "Expired"
                                  : "Active"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {!inv.is_revoked && !isUsed && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(inviteUrl);
                                  toast.success("Invitation link copied!");
                                }}
                                className="border-primary/40 text-[11px] h-7"
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => revokeInvitation(inv.id)}
                                className="border-rose-500/40 text-rose-400 text-[11px] h-7"
                              >
                                Revoke
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PRIVILEGE CARDS TAB */}
      {activeTab === "cards" && (
        <div className="space-y-4">
          <div className="rounded-2xl glass border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Card Number</th>
                  <th className="p-3">Holder</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Issued</th>
                  <th className="p-3">Verification Token</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No cards issued yet.
                    </td>
                  </tr>
                ) : (
                  cards.map((c) => {
                    const mem = c.memberships as any;
                    const prof = mem?.profiles as any;
                    return (
                      <tr key={c.id} className="hover:bg-secondary/30 transition">
                        <td className="p-3 font-mono font-bold text-foreground">{c.card_number}</td>
                        <td className="p-3 font-semibold">
                          {prof?.full_name || "Privilege Member"}
                        </td>
                        <td className="p-3 font-bold uppercase text-primary-glow">
                          {mem?.tier || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(c.issued_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {c.verification_token}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.is_revoked
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {c.is_revoked ? "Revoked" : "Active"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <a
                            href={`/verify-membership/${c.verification_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-[11px] h-7"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" /> Public View
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCardRevocation(c)}
                            className="border-rose-500/40 text-rose-400 text-[11px] h-7"
                          >
                            {c.is_revoked ? "Un-revoke" : "Revoke Card"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PAYMENTS TAB */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="rounded-2xl glass border border-border overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Txn ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No payments submitted yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const prof = p.profiles as any;
                    return (
                      <tr key={p.id} className="hover:bg-secondary/30 transition">
                        <td className="p-3 text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">
                            {prof?.full_name || "User"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{prof?.email}</div>
                        </td>
                        <td className="p-3 font-bold uppercase text-primary-glow">{p.tier}</td>
                        <td className="p-3 font-black text-foreground">
                          {money(Number(p.amount))}
                        </td>
                        <td className="p-3 font-semibold uppercase">{p.payment_method}</td>
                        <td className="p-3 font-mono font-bold text-primary-glow">
                          {p.transaction_id}
                        </td>
                        <td className="p-3">
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
                        </td>
                        <td className="p-3 text-right">
                          {p.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => verifyPaymentAndActivate(p)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Verify & Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TIERS & PRICING TAB */}
      {activeTab === "tiers" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["special", "premium", "elite"] as const).map((slug) => {
            const config = MEMBERSHIP_TIERS[slug];
            const dbTier = tiers.find((t) => t.slug === slug);
            const priceBdt = dbTier?.price_bdt ?? config.price_bdt;
            const discountPct = dbTier?.discount_percent ?? config.discount_percent;

            return (
              <div key={slug} className="rounded-2xl glass border border-primary/30 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase text-sm text-primary-glow">
                    {config.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-glow">
                    {config.billing_period}
                  </span>
                </div>

                <div className="text-3xl font-black text-foreground">
                  ৳{priceBdt}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ yr</span>
                </div>

                <div className="text-xs text-emerald-400 font-semibold">
                  Subscription Discount: {discountPct}% OFF
                </div>

                <ul className="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                  {config.benefits.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary-glow shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTierSlug(slug);
                    setTierForm({
                      price_bdt: priceBdt,
                      price_usd: dbTier?.price_usd ?? config.price_usd,
                      discount_percent: discountPct,
                      billing_period: dbTier?.billing_period ?? config.billing_period,
                    });
                    setTierModalOpen(true);
                  }}
                  className="w-full text-xs border-primary/40 mt-2"
                >
                  Edit Tier Pricing & Discount
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Application Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Review Membership Application</DialogTitle>
            <DialogDescription>
              Verify applicant identity and select administrative action.
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-background/60 border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applicant Name:</span>
                  <span className="font-bold text-foreground">{selectedApp.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{selectedApp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business / Category:</span>
                  <span className="text-foreground">
                    {selectedApp.business_name || "None"} ({selectedApp.business_category})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Tier:</span>
                  <span className="font-bold text-primary-glow uppercase">
                    {selectedApp.requested_tier}
                  </span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block">Reason for joining:</span>
                  <p className="italic text-foreground mt-0.5">{selectedApp.reason}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs">Internal Admin Notes / Feedback to Applicant</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Approved. Payment pending."
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processingAction}
                  onClick={() => handleApplicationDecision("reject")}
                  className="border-rose-500/40 text-rose-400 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processingAction}
                  onClick={() => handleApplicationDecision("request_info")}
                  className="border-amber-500/40 text-amber-400 text-xs"
                >
                  Request Info
                </Button>
                <Button
                  size="sm"
                  disabled={processingAction}
                  onClick={() => handleApplicationDecision("approve")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {selectedApp.requested_tier === "special"
                    ? "Approve & Activate"
                    : "Approve (Await Pay)"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invitation Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-glow" />
              Generate Membership Invitation Link
            </DialogTitle>
            <DialogDescription>
              Create a single-use or designated invitation for VIP members.
            </DialogDescription>
          </DialogHeader>

          {generatedInviteLink ? (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                Invitation created successfully! Share this link with the recipient.
              </div>
              <div className="flex gap-2">
                <Input value={generatedInviteLink} readOnly className="text-xs font-mono" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink);
                    toast.success("Link copied!");
                  }}
                  className="bg-gradient-primary shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeneratedInviteLink(null)}
                className="w-full text-xs"
              >
                Create Another Link
              </Button>
            </div>
          ) : (
            <form onSubmit={generateInvitation} className="space-y-3 mt-1 text-xs">
              <div>
                <Label className="text-xs">Invited Membership Tier</Label>
                <Select
                  value={inviteForm.tier}
                  onValueChange={(v) =>
                    setInviteForm({ ...inviteForm, tier: v as MembershipTierSlug })
                  }
                >
                  <SelectTrigger className="mt-1 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="special">Special Member (Free)</SelectItem>
                    <SelectItem value="premium">Premium Member</SelectItem>
                    <SelectItem value="elite">Elite Member (VIP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Invitee Name (Optional)</Label>
                <Input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Mr. Rahman"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Designated Email (Optional)</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="name@business.com"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Link Expiry Duration</Label>
                <Select
                  value={String(inviteForm.expiresDays)}
                  onValueChange={(v) => setInviteForm({ ...inviteForm, expiresDays: Number(v) })}
                >
                  <SelectTrigger className="mt-1 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Admin Welcome Note</Label>
                <Input
                  value={inviteForm.note}
                  onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                  placeholder="Welcome to our VIP network!"
                  className="mt-1 text-xs"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary shadow-glow h-9 text-xs mt-2"
              >
                Generate Link
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tier Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Edit {selectedTierSlug.toUpperCase()} Tier Pricing
            </DialogTitle>
            <DialogDescription>
              Configurable pricing & subscription discounts. Do not hardcode permanent prices.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await supabase
                  .from("membership_tiers")
                  .update({
                    price_bdt: tierForm.price_bdt,
                    price_usd: tierForm.price_usd,
                    discount_percent: tierForm.discount_percent,
                    billing_period: tierForm.billing_period,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("slug", selectedTierSlug);

                toast.success("Tier updated successfully!");
                setTierModalOpen(false);
                qc.invalidateQueries({ queryKey: ["admin-membership-all"] });
              } catch (err: any) {
                toast.error(err.message || "Failed to update tier");
              }
            }}
            className="space-y-3 mt-1 text-xs"
          >
            <div>
              <Label className="text-xs">Price in BDT (৳)</Label>
              <Input
                type="number"
                min={0}
                value={tierForm.price_bdt}
                onChange={(e) => setTierForm({ ...tierForm, price_bdt: Number(e.target.value) })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Price in USD ($)</Label>
              <Input
                type="number"
                min={0}
                value={tierForm.price_usd}
                onChange={(e) => setTierForm({ ...tierForm, price_usd: Number(e.target.value) })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Subscription Discount Percentage (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={tierForm.discount_percent}
                onChange={(e) =>
                  setTierForm({ ...tierForm, discount_percent: Number(e.target.value) })
                }
                className="mt-1 text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary shadow-glow h-9 text-xs mt-2"
            >
              Save Tier Settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
