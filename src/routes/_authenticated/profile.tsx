import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user!.id).single();
      const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.user!.id).eq("status", "active").maybeSingle();
      return { user: u.user, profile: p, sub };
    },
  });
  const [f, setF] = useState({ full_name: "", avatar_url: "", phone: "" });
  useEffect(() => { if (data?.profile) setF({ full_name: data.profile.full_name ?? "", avatar_url: data.profile.avatar_url ?? "", phone: data.profile.phone ?? "" }); }, [data]);

  const save = async () => {
    if (!data?.user) return;
    const { error } = await supabase.from("profiles").update({ ...f, updated_at: new Date().toISOString() }).eq("id", data.user.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-gradient">{t("profile")}</h1>

      <div className="rounded-2xl glass border border-border p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20"><AvatarImage src={f.avatar_url} /><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">{(f.full_name || data?.user?.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <div className="font-semibold text-lg">{f.full_name || data?.user?.email}</div>
            <div className="text-sm text-muted-foreground">{data?.user?.email}</div>
            {data?.sub && <div className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-gradient-primary text-primary-foreground">{data.sub.plan} • {data.sub.status}</div>}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div><Label>{lang === "bn" ? "পুরো নাম" : "Full name"}</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label>{lang === "bn" ? "প্রোফাইল ছবি URL" : "Avatar URL"}</Label><Input value={f.avatar_url} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <Button onClick={save} className="bg-gradient-primary shadow-glow">{lang === "bn" ? "সেভ করুন" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}
