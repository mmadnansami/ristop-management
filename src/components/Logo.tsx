import logoAsset from "@/assets/ristop-logo-transparent.png.asset.json";
import mascotAsset from "@/assets/ris-ai-mascot.png.asset.json";

export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Ristop Management"
      className={`${className} object-contain drop-shadow-[0_0_28px_oklch(0.65_0.25_300/0.65)]`}
    />
  );
}

export function RisMascot({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <img
      src={mascotAsset.url}
      alt="Ris AI"
      className={`${className} object-contain drop-shadow-[0_0_28px_oklch(0.65_0.25_300/0.75)]`}
    />
  );
}
