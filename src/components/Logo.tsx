import logoAsset from "@/assets/ristop-logo.png.asset.json";

export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Ristop Management"
      className={`${className} drop-shadow-[0_0_18px_oklch(0.65_0.22_300/0.55)]`}
    />
  );
}
