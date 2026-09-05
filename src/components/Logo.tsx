/**
 * Brand assets are served from /public so they load on every host
 * (Lovable preview, Vercel deployment and custom domains alike).
 */
const officialLogoUrl = "/ristop-official-logo.png";
const mascotUrl = "/ristop-mascot.webp";

/**
 * Official RISTOP MANAGEMENT wordmark (the customer-approved logo).
 */
export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <span
      aria-label="Ristop Management — Official Logo"
      title="Ristop Management — Best Business Management Software"
      className={`inline-flex items-center ${className}`}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <meta itemProp="name" content="Ristop Management" />
      <link itemProp="url" href="https://ristopmanagement.vercel.app/" />
      <img
        src={officialLogoUrl}
        alt="Ristop Management official logo — business management software"
        title="Ristop Management"
        itemProp="logo"
        width={320}
        height={100}
        className="h-full w-auto max-w-[220px] object-contain"
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
