import logoAsset from "@/assets/ristop-logo.png.asset.json";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Ristop Management" className={className} />;
}
