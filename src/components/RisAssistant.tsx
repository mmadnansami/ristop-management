import { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, ShieldCheck, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { chatWithRis } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import { RisMascot } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };
type AiMode = "free" | "advance";

export function RisAssistant() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AiMode>("free");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        lang === "bn"
          ? "হ্যালো! আমি Ris AI — আপনার স্মার্ট অ্যাসিস্ট্যান্ট। আমি ফ্রি এবং এডভান্স লেয়ারে কাজ করি। কীভাবে সাহায্য করতে পারি?"
          : "Hi! I'm Ris AI, your smart assistant available in Free & Advance modes. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithRis);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check user subscription status
  useEffect(() => {
    async function checkSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSubscribed(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setIsSubscribed(!!data);
    }
    checkSub();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999 });
  }, [msgs, open, mode]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (mode === "advance" && !isSubscribed) {
      setMsgs((prev) => [
        ...prev,
        { role: "user", content: text },
        {
          role: "assistant",
          content:
            lang === "bn"
              ? "🔒 Ris AI Advance Mode শুধুমাত্র প্রিমিয়াম সাবস্ক্রাইবারদের জন্য। গভীর অ্যানালাইসিস আনলক করতে অনুগ্রহ করে আপনার প্ল্যান আপগ্রেড করুন।"
              : "🔒 Ris AI Advance Mode is for Premium Subscribers only. Please upgrade your plan to unlock deep AI analytics.",
        },
      ]);
      setInput("");
      return;
    }

    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({
        data: { messages: next, lang, mode, isSubscribed },
      });
      setMsgs([...next, { role: "assistant", content: res.reply }]);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : "Error";
      setMsgs([
        ...next,
        {
          role: "assistant",
          content:
            lang === "bn"
              ? `দুঃখিত, একটা সমস্যা হয়েছে: ${err}`
              : `Sorry, error: ${err}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform"
          aria-label="Ris AI"
        >
          <RisMascot className="h-16 w-16 animate-pulse-glow" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(390px,calc(100vw-2rem))] h-[min(580px,calc(100vh-3rem))] rounded-2xl glass-strong shadow-glow flex flex-col overflow-hidden border border-primary/30">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-primary">
            <div className="flex items-center gap-2 text-primary-foreground">
              <RisMascot className="h-9 w-9" />
              <div>
                <span className="font-semibold text-sm block">Ris AI {lang === "bn" ? "এসিস্ট্যান্ট" : "Assistant"}</span>
                <span className="text-[10px] opacity-80 flex items-center gap-1">
                  {mode === "advance" ? (
                    <Crown className="h-3 w-3 text-amber-300 inline" />
                  ) : (
                    <Sparkles className="h-3 w-3 inline" />
                  )}
                  {mode === "advance" ? (lang === "bn" ? "এডভান্সড লেয়ার" : "Advance Layer") : (lang === "bn" ? "ফ্রি লেয়ার" : "Free Layer")}
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Selector Switcher */}
          <div className="p-2 bg-secondary/50 border-b border-border flex items-center justify-between text-xs px-3">
            <span className="text-muted-foreground font-medium">{lang === "bn" ? "লেয়ার সিলেক্ট করুন:" : "Select Layer:"}</span>
            <div className="flex rounded-lg bg-background/80 p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setMode("free")}
                className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                  mode === "free"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {lang === "bn" ? "ফ্রি" : "Free"}
              </button>
              <button
                type="button"
                onClick={() => setMode("advance")}
                className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                  mode === "advance"
                    ? "bg-gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSubscribed ? <Sparkles className="h-3.5 w-3.5 text-amber-300" /> : <Lock className="h-3.5 w-3.5" />}
                {lang === "bn" ? "এডভান্স" : "Advance"}
              </button>
            </div>
          </div>

          {/* Subscriptions Alert Banner if Advance Mode Selected without Subscription */}
          {mode === "advance" && !isSubscribed && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 text-xs flex items-center justify-between text-amber-200">
              <span className="flex items-center gap-1.5">
                <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                {lang === "bn" ? "এডভান্সড এআই সাবসক্রিপশন প্রয়োজন" : "Advance AI requires subscription"}
              </span>
              <Link to="/subscribe" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-2 py-0.5 rounded text-[11px] transition">
                {lang === "bn" ? "আপগ্রেড" : "Upgrade"}
              </Link>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground border border-border/50"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-muted-foreground animate-pulse">Ris AI {lang === "bn" ? "চিন্তা করছে..." : "is thinking..."}</div>}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-border flex gap-2 bg-background/50">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={
                mode === "advance"
                  ? lang === "bn"
                    ? "এডভান্সড এআই প্রশ্ন করুন..."
                    : "Ask Advance AI..."
                  : lang === "bn"
                  ? "মেসেজ লিখুন (ফ্রি)..."
                  : "Type a message (Free)..."
              }
              className="flex-1 bg-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-ring"
            />
            <Button size="icon" onClick={send} disabled={loading} className="bg-gradient-primary">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
