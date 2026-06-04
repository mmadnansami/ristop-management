import logoAsset from "@/assets/ristop-logo-transparent.png.asset.json";

export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Ristop Management"
      className={`${className} object-contain drop-shadow-[0_0_28px_oklch(0.65_0.25_300/0.65)]`}
    />
  );
}
