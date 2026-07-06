import restockAiAsset from "@/assets/restock-ai-logo.png.asset.json";

/**
 * Inline SVG wordmark — renders on any host (Vercel, custom domains, etc.)
 * without depending on CDN asset URLs. This is what shows in the navbar.
 */
export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 44 44"
        className="h-full w-auto shrink-0"
        role="img"
        aria-label="Ristop Management Logo"
      >
        <defs>
          <linearGradient id="ristopGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="40" height="40" rx="10" fill="url(#ristopGrad)" />
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Outfit, system-ui, sans-serif"
          fontSize="22"
          fontWeight="800"
          fill="white"
        >
          R
        </text>
      </svg>
      <span
        className="whitespace-nowrap font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500"
        style={{ fontSize: "clamp(1rem, 2.4vw, 1.35rem)" }}
      >
        Ristop Management
      </span>
    </div>
  );
}

/**
 * Ris AI mascot — small round avatar for the floating assistant.
 * Falls back gracefully if the CDN image is unreachable.
 */
export function RisMascot({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <div
      className={`${className} relative rounded-full overflow-hidden bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-[0_0_22px_rgba(168,85,247,0.65)]`}
      role="img"
      aria-label="Ris AI Assistant"
    >
      <img
        src={restockAiAsset.url}
        alt="Ris AI Assistant"
        className="h-full w-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-white font-black text-sm pointer-events-none" aria-hidden="true">
        Ris
      </span>
    </div>
  );
}
