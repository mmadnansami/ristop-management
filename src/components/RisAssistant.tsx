import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { chatWithRis } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import { RisMascot } from "@/components/Logo";

type Msg = { role: "user" | "assistant"; content: string };

export function RisAssistant() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: lang === "bn" ? "হ্যালো! আমি Ris — আপনার স্মার্ট অ্যাসিস্ট্যান্ট। কীভাবে সাহায্য করতে পারি?" : "Hi! I'm Ris, your smart assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithRis);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999 }); }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next, lang } });
      setMsgs([...next, { role: "assistant", content: res.reply }]);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : "Error";
      setMsgs([...next, { role: "assistant", content: lang === "bn" ? `দুঃখিত, একটা সমস্যা হয়েছে: ${err}` : `Sorry, error: ${err}` }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform"
          aria-label="Ris AI"
        >
          <RisMascot className="h-20 w-20 animate-pulse-glow" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] rounded-2xl glass-strong shadow-glow flex flex-col overflow-hidden border border-primary/30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-primary">
            <div className="flex items-center gap-2 text-primary-foreground">
              <RisMascot className="h-9 w-9" />
              <span className="font-semibold">Ris {lang === "bn" ? "এসিস্ট্যান্ট" : "Assistant"}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-muted-foreground">Ris {lang === "bn" ? "লিখছে..." : "is typing..."}</div>}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={lang === "bn" ? "মেসেজ লিখুন..." : "Type a message..."}
              className="flex-1 bg-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-ring"
            />
            <Button size="icon" onClick={send} disabled={loading} className="bg-gradient-primary"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
