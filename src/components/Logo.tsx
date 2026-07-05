import logoAsset from "@/assets/ristop-logo-transparent.png.asset.json";
import restockAiAsset from "@/assets/restock-ai-logo.png.asset.json";

export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Ristop Management"
      className={`${className} object-contain drop-shadow-[0_0_28px_oklch(0.65_0.25_300/0.65)]`}
    />
  );
}

export function RisMascot({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={restockAiAsset.url}
      alt="Restock AI"
      className={`${className} rounded-full object-cover drop-shadow-[0_0_22px_oklch(0.65_0.25_300/0.65)]`}
    />
  );
}
