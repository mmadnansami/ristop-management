import officialLogoAsset from "@/assets/ristop-official-logo.png.asset.json";
import mascotAsset from "@/assets/ristop-mascot.png.asset.json";

const officialLogoUrl = officialLogoAsset.url;
const mascotUrl = mascotAsset.url;

/**
 * Official RISTOP MANAGEMENT wordmark (the customer-approved logo).
 * Served from immutable project assets so it renders identically on every domain.
 */
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <span
      aria-label="Ristop Management — Official Logo"
      title="Ristop Management — Best Business Management Software"
      className={`inline-flex items-center ${className}`}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <meta itemProp="name" content="Ristop Management" />
      <link itemProp="url" href="https://ristop-smart-hub.lovable.app/" />
      <img
        src={officialLogoUrl}
        alt="Ristop Management official logo — business management software"
        title="Ristop Management"
        itemProp="logo"
        width={320}
        height={100}
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
