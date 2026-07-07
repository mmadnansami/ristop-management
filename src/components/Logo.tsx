import officialLogo from "@/assets/ristop-official-logo.jpg.asset.json";
import mascotAsset from "@/assets/ristop-mascot.png.asset.json";

/**
 * Official Ristop Management wordmark — used as-is, no extra text.
 * Wrapped in an anchor + itemScope so Google associates the image
 * with the "Ristop Management" brand for image search.
 */
export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <a
      href="/"
      aria-label="Ristop Management — Official Logo"
      title="Ristop Management"
      className={`inline-flex items-center ${className}`}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <meta itemProp="name" content="Ristop Management" />
      <img
        src={officialLogo.url}
        alt="Ristop Management official logo"
        title="Ristop Management"
        itemProp="logo"
        className="h-full w-auto object-contain"
        loading="eager"
        decoding="async"
      />
    </a>
  );
}

/**
 * Ristop AI mascot — used as-is (uploaded round mascot).
 */
export function RisMascot({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={mascotAsset.url}
      alt="Ristop AI Assistant mascot"
      title="Ristop AI"
      className={`${className} rounded-full object-cover shadow-[0_0_22px_rgba(168,85,247,0.55)]`}
    />
  );
}
