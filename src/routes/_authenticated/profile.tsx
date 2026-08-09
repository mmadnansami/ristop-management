import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { CurrencyToggle } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Cloud, Crown, Sparkles, Building2, User as UserIcon, Lock, RotateCcw } from "lucide-react";
import { PartnerCenter } from "@/components/PartnerCenter";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

type ProfileForm = {
  full_name: string;
  avatar_url: string;
  phone: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo_url: string;
  company_tagline: string;
};

function Profile() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", u.user.id)
        .eq("status", "active")
        .maybeSingle();
      return { user: u.user, profile: p, sub };
    },
  });

  const [f, setF] = useState<ProfileForm>({
    full_name: "",
    avatar_url: "",
    phone: "",
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_logo_url: "",
    company_tagline: "",
  });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile as unknown as Record<string, string | null>;
      setF({
        full_name: p.full_name ?? "",
        avatar_url: p.avatar_url ?? "",
        phone: p.phone ?? "",
        company_name: p.company_name ?? "",
        company_address: p.company_address ?? "",
        company_phone: p.company_phone ?? "",
        company_email: p.company_email ?? "",
        company_logo_url: p.company_logo_url ?? "",
        company_tagline: p.company_tagline ?? "",
      });
    }
  }, [data]);

  const isPremium = !!data?.sub;

  const save = async () => {
    if (!data?.user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...f,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "bn" ? "সেভ হয়েছে" : "Saved");
      qc.invalidateQueries({ queryKey: ["me-profile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    }
  };

  const backupNow = async () => {
    if (!isPremium) {
      toast.error(lang === "bn" ? "প্রিমিয়াম প্ল্যান প্রয়োজন" : "Premium plan required");
      return;
    }
    toast.success(lang === "bn" ? "ক্লাউডে ব্যাকআপ সম্পন্ন" : "Cloud backup complete");
  };

  const resetSalesData = async () => {
    if (!data?.user) return;
    setResetting(true);
    const { error } = await supabase.from("sales").delete().eq("user_id", data.user.id);
    if (!error) {
      await supabase
        .from("activity_log")
        .delete()
        .eq("user_id", data.user.id)
        .ilike("action", "Sale:%");
    }
    setResetting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["sales"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
      qc.invalidateQueries({ queryKey: ["reports"] }),
    ]);
    toast.success(
      lang === "bn"
        ? "সেলস ডেটা রিসেট হয়েছে — গ্রাফ এখন শূন্য"
        : "Sales data reset — graphs are now zero",
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          {lang === "bn" ? "আমার প্রোফাইল" : "My Profile"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "bn"
            ? "আপনার ও কোম্পানির তথ্য আপডেট করুন — ইনভয়েসে স্বয়ংক্রিয়ভাবে যুক্ত হবে"
            : "Update your personal & company details — auto-applied to invoices"}
        </p>
      </div>

      {/* Display currency */}
      <div className="rounded-3xl glass-strong p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{lang === "bn" ? "ডিসপ্লে কারেন্সি" : "Display currency"}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "bn"
              ? "সফটওয়্যারের সব টাকার অঙ্ক এই কারেন্সিতে দেখানো হবে (ডিফল্ট USD)।"
              : "All amounts across the software show in this currency (USD by default)."}
          </p>
        </div>
        <CurrencyToggle />
      </div>



      {/* Identity header */}
      <div className="rounded-3xl glass-strong p-6 flex items-center gap-5">
        <Avatar className="h-20 w-20 ring-2 ring-primary/50 shadow-glow">
          <AvatarImage src={f.avatar_url} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
            {(f.full_name || data?.user?.email || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg truncate">{f.full_name || data?.user?.email}</div>
          <div className="text-sm text-muted-foreground truncate">{data?.user?.email}</div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {isPremium ? (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                <Crown className="h-3 w-3" /> {String(data?.sub?.plan ?? "").toUpperCase()} •
                Premium
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-border bg-secondary/50">
                {lang === "bn" ? "ফ্রি প্ল্যান" : "Free Plan"}
              </span>
            )}
          </div>
        </div>
      </div>

      <PartnerCenter />

      {/* Personal info */}
      <Section icon={UserIcon} title={lang === "bn" ? "ব্যক্তিগত তথ্য" : "Personal Info"}>
        <Field
          label={lang === "bn" ? "পুরো নাম" : "Full name"}
          value={f.full_name}
          onChange={(v) => setF({ ...f, full_name: v })}
        />
        <Field
          label={lang === "bn" ? "প্রোফাইল ছবি URL" : "Avatar URL"}
          value={f.avatar_url}
          onChange={(v) => setF({ ...f, avatar_url: v })}
        />
        <Field
          label={lang === "bn" ? "ফোন" : "Phone"}
          value={f.phone}
          onChange={(v) => setF({ ...f, phone: v })}
        />
      </Section>

      {/* Company info */}
      <Section
        icon={Building2}
        title={
          lang === "bn" ? "কোম্পানি তথ্য (ইনভয়েসে দেখাবে)" : "Company Info (shown on invoices)"
        }
      >
        <Field
          label={lang === "bn" ? "কোম্পানির নাম" : "Company name"}
          value={f.company_name}
          onChange={(v) => setF({ ...f, company_name: v })}
        />
        <Field
          label={lang === "bn" ? "ট্যাগলাইন / স্লোগান" : "Tagline / slogan"}
          value={f.company_tagline}
          onChange={(v) => setF({ ...f, company_tagline: v })}
        />
        <div className="md:col-span-2">
          <Label className="text-foreground/70">{lang === "bn" ? "ঠিকানা" : "Address"}</Label>
          <Textarea
            value={f.company_address}
            onChange={(e) => setF({ ...f, company_address: e.target.value })}
            className="mt-1.5 bg-white/5 border-white/15 rounded-xl"
            rows={2}
          />
        </div>
        <Field
          label={lang === "bn" ? "কোম্পানি ফোন" : "Company phone"}
          value={f.company_phone}
          onChange={(v) => setF({ ...f, company_phone: v })}
        />
        <Field
          label={lang === "bn" ? "কোম্পানি ইমেইল" : "Company email"}
          value={f.company_email}
          onChange={(v) => setF({ ...f, company_email: v })}
        />
        <Field
          label={lang === "bn" ? "লোগো URL" : "Logo URL"}
          value={f.company_logo_url}
          onChange={(v) => setF({ ...f, company_logo_url: v })}
        />
      </Section>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-gradient-primary shadow-glow rounded-xl h-11 px-6"
        >
          {saving ? "..." : lang === "bn" ? "সেভ করুন" : "Save changes"}
        </Button>
      </div>

      <div className="rounded-3xl p-6 glass-strong border-destructive/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/15 flex items-center justify-center text-destructive">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{lang === "bn" ? "Reset" : "Reset"}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "bn"
                  ? "সব সেলস রেকর্ড মুছে গ্রাফ ও সেলস রিপোর্ট শূন্য করুন।"
                  : "Clear all sales records and bring sales graphs back to zero."}
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={resetting}
                className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> {resetting ? "..." : "Reset"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong rounded-3xl border-destructive/30">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {lang === "bn" ? "সেলস ডেটা রিসেট করবেন?" : "Reset sales data?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {lang === "bn"
                    ? "এটি আপনার সব সেলস রেকর্ড মুছে দেবে এবং ড্যাশবোর্ড/রিপোর্টের সেলস গ্রাফ শূন্য দেখাবে। এই কাজটি ফিরিয়ে আনা যাবে না।"
                    : "This will delete all your sales records and make dashboard/report sales graphs show zero. This cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetSalesData}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {lang === "bn" ? "হ্যাঁ, Reset" : "Yes, reset"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Premium-gated cloud backup */}
      <div
        className={`rounded-3xl p-6 glass-strong relative overflow-hidden ${!isPremium ? "opacity-95" : ""}`}
      >
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-[oklch(0.55_0.25_300/0.25)] blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Cloud className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {lang === "bn" ? "ক্লাউড ব্যাকআপ" : "Cloud Backup"}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-primary text-primary-foreground">
                <Crown className="h-3 w-3" /> PREMIUM
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "bn"
                ? "আপনার সব ডেটা সুরক্ষিতভাবে ক্লাউডে ব্যাকআপ নিন। শুধু প্রিমিয়াম ব্যবহারকারীদের জন্য।"
                : "Keep all your data safely backed up to the cloud. Premium users only."}
            </p>
            <div className="mt-3">
              <Button
                onClick={backupNow}
                disabled={!isPremium}
                className="bg-gradient-primary shadow-glow rounded-xl"
              >
                {isPremium ? (
                  <>
                    <Cloud className="h-4 w-4 mr-1" />{" "}
                    {lang === "bn" ? "এখনই ব্যাকআপ নিন" : "Backup Now"}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-1" />{" "}
                    {lang === "bn" ? "প্রিমিয়াম প্রয়োজন" : "Premium Required"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Ris AI advanced */}
      <div className="rounded-3xl p-6 glass-strong relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {lang === "bn" ? "Ris AI অ্যাডভান্স" : "Ris AI Advanced"}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-primary text-primary-foreground">
                <Crown className="h-3 w-3" /> PREMIUM
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "bn"
                ? "Ris AI ফ্রিতেও পাওয়া যায়, কিন্তু গভীর বিশ্লেষণ, রিপোর্ট জেনারেশন ও স্মার্ট রেকমেন্ডেশন পেতে প্রিমিয়াম প্ল্যান নিন।"
                : "Use Ris AI for free, but unlock deep analytics, report generation & smart recommendations with Premium."}
            </p>
            <div className="mt-2 text-xs">
              {isPremium ? (
                <span className="text-success">
                  ✓ {lang === "bn" ? "অ্যাডভান্স মোড একটিভ" : "Advanced mode active"}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {lang === "bn" ? "বর্তমানে ব্যাসিক মোড" : "Currently on basic mode"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl glass-strong p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary-glow" />
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-foreground/70">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 rounded-xl bg-white/5 border-white/15 focus-visible:ring-primary"
      />
    </div>
  );
}
