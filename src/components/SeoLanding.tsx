import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Check } from "lucide-react";

export type SeoSection = { heading: string; body: string; points?: string[] };

export function SeoLanding({
  h1,
  intro,
  sections,
  cta = "Start with Ristop Management",
}: {
  h1: string;
  intro: string;
  sections: SeoSection[];
  cta?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2"><Logo className="h-11 md:h-12 w-auto" /></Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="sm" className="bg-gradient-primary shadow-glow">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-14 md:py-20 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight"><span className="text-gradient">{h1}</span></h1>
        <p className="mt-5 text-lg text-muted-foreground">{intro}</p>

        {sections.map((s) => (
          <section key={s.heading} className="mt-12">
            <h2 className="text-2xl md:text-3xl font-semibold">{s.heading}</h2>
            <p className="mt-3 text-muted-foreground">{s.body}</p>
            {s.points && (
              <ul className="mt-4 space-y-2 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{p}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-14 rounded-2xl glass border border-primary/30 p-7 text-center shadow-glow">
          <h2 className="text-xl font-semibold">{cta}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account and manage sales, inventory, customers, dues and reports from one workspace.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button className="bg-gradient-primary shadow-glow">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link to="/subscribe" search={{ plan: "monthly" as const }}>
              <Button variant="outline" className="border-primary/40">See pricing</Button>
            </Link>
          </div>
        </section>

        <nav className="mt-12 text-sm">
          <h2 className="font-semibold">Explore more</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-primary-glow">
            <li><Link to="/business-management-software-bangladesh">Business management software in Bangladesh</Link></li>
            <li><Link to="/inventory-management-software-bangladesh">Inventory management software</Link></li>
            <li><Link to="/sales-management-software-bangladesh">Sales management software</Link></li>
            <li><Link to="/customer-management-software-bangladesh">Customer management software</Link></li>
            <li><Link to="/business-profit-management-software">Profit management software</Link></li>
            <li><Link to="/business-software-bangladesh">Business software for Bangladesh</Link></li>
          </ul>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}

export const SITE_URL = "https://ristopmanagement.site";

export function seoHead({
  title,
  description,
  path,
}: { title: string; description: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${SITE_URL}/ristop-og.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}/ristop-og.jpg` },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
