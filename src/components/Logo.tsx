import officialLogoUrl from "@/assets/ristop-logo-selfhost.png";
import mascotUrl from "@/assets/ristop-mascot-selfhost.webp";

/**
 * Official Ristop Management wordmark — bundled locally so it works on
 * Vercel/GitHub deployments as well as Lovable preview.
 */
export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <span
      aria-label="Ristop Management — Official Logo"
      title="Ristop Management"
      className={`inline-flex items-center ${className}`}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <meta itemProp="name" content="Ristop Management" />
      <img
        src={officialLogoUrl}
        alt="Ristop Management official logo"
        title="Ristop Management"
        itemProp="logo"
        className="h-full w-auto object-contain"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}

/**
 * Ristop AI mascot — used as-is (uploaded round mascot).
 */
export function RisMascot({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={mascotUrl}
      alt="Ristop AI Assistant mascot"
      title="Ristop AI"
      className={`${className} rounded-full object-cover shadow-[0_0_22px_rgba(168,85,247,0.55)]`}
    />
  );
}
