import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Download, ShieldCheck, QrCode as QrIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MEMBERSHIP_TIERS, type MembershipTierSlug } from "@/lib/membership";

export interface PrivilegeCardProps {
  memberName: string;
  memberId: string;
  tier: MembershipTierSlug;
  status: "active" | "expired" | "suspended" | "revoked";
  startsAt: string;
  expiresAt?: string | null;
  verificationToken: string;
  showActions?: boolean;
}

export function PrivilegeCard({
  memberName,
  memberId,
  tier,
  status,
  startsAt,
  expiresAt,
  verificationToken,
  showActions = true,
}: PrivilegeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const tierConfig = MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS.special;

  // Generate secure QR code
  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://ristopmanagement.site";
    const verificationUrl = `${origin}/verify-membership/${verificationToken}`;
    QRCode.toDataURL(verificationUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: tier === "elite" ? "#1a0b2e" : tier === "premium" ? "#0f0728" : "#1a0733",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [verificationToken, tier]);

  const downloadPNG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Ristop-Privilege-Card-${memberId}.png`;
      a.click();
      toast.success("Card downloaded as PNG");
    } catch (err: any) {
      toast.error("Failed to export card: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const downloadPDF = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL("image/png");
      // Standard CR80 card ratio: 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98],
      });
      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`Ristop-Privilege-Card-${memberId}.pdf`);
      toast.success("Card downloaded as PDF");
    } catch (err: any) {
      toast.error("Failed to export PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Card themes
  // Special: Purple & White
  // Premium: Deep Purple & Silver Metallic
  // Elite: Deep Purple & Lustrous Gold
  const isSpecial = tier === "special";
  const isPremium = tier === "premium";
  const isElite = tier === "elite";

  const cardBackground = isElite
    ? "bg-gradient-to-br from-[#1b082e] via-[#2c104d] to-[#120420] border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.25)]"
    : isPremium
      ? "bg-gradient-to-br from-[#19102c] via-[#241740] to-[#0f091c] border-slate-300/80 shadow-[0_0_30px_rgba(203,213,225,0.25)]"
      : "bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#311068] border-purple-300/80 shadow-[0_0_30px_rgba(168,85,247,0.3)]";

  const accentPill = isElite
    ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border border-amber-400 font-black"
    : isPremium
      ? "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 border border-slate-300 font-bold"
      : "bg-white text-purple-950 border border-white font-bold";

  const accentText = isElite ? "text-amber-300" : isPremium ? "text-slate-300" : "text-purple-200";

  const chipStyle = isElite
    ? "from-amber-200 via-yellow-400 to-amber-600 border-amber-300"
    : isPremium
      ? "from-slate-100 via-slate-300 to-slate-400 border-slate-200"
      : "from-purple-100 via-white to-purple-300 border-purple-200";

  return (
    <div className="flex flex-col items-center">
      {/* Visual Card Container */}
      <div
        ref={cardRef}
        className={`relative w-full max-w-[480px] aspect-[1.586/1] rounded-2xl p-5 sm:p-6 text-white border select-none overflow-hidden ${cardBackground}`}
      >
        {/* Background decorative watermark */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Top Bar: Brand, Logo, Privilege Pill */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-auto brightness-125" />
            <div className="leading-none">
              <div className="text-[13px] font-black tracking-wide uppercase">
                Ristop Privilege™
              </div>
              <div className="text-[9px] tracking-wider text-white/70">SPECIAL MEMBERSHIP</div>
            </div>
          </div>

          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow-sm ${accentPill}`}
          >
            {tierConfig.name}
          </div>
        </div>

        {/* Center: Chip Graphic & Member Name */}
        <div className="mt-4 sm:mt-5 flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <div
              className={`w-9 h-7 rounded bg-gradient-to-br ${chipStyle} border opacity-90 shadow-inner flex items-center justify-center`}
            >
              <div className="w-5 h-3 border-y border-black/20" />
            </div>
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider text-white/60">
                Privilege Holder
              </div>
              <div className="text-base sm:text-lg font-black tracking-tight truncate max-w-[260px] text-white drop-shadow">
                {memberName}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="shrink-0 bg-white p-1 rounded-lg shadow-md border border-white/40">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Card QR Verification"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center">
                <QrIcon className="h-6 w-6 text-purple-900 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Member ID, Issue Date, Expiry Date, Status */}
        <div className="absolute bottom-4 left-5 right-5 sm:bottom-5 sm:left-6 sm:right-6 flex items-end justify-between text-[11px] relative z-10">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/60">Member ID</div>
            <div className="font-mono font-bold tracking-wider text-white text-xs sm:text-sm">
              {memberId}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/60">Issued</div>
            <div className="font-mono text-white/90">
              {new Date(startsAt).toLocaleDateString("en-GB", {
                month: "2-digit",
                year: "2-digit",
              })}
            </div>
          </div>

          {expiresAt && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-white/60">Expires</div>
              <div className="font-mono text-white/90">
                {new Date(expiresAt).toLocaleDateString("en-GB", {
                  month: "2-digit",
                  year: "2-digit",
                })}
              </div>
            </div>
          )}

          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/60">Status</div>
            <div
              className={`font-semibold capitalize flex items-center justify-end gap-1 ${
                status === "active" ? "text-emerald-300" : "text-rose-400"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>{status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPNG}
            disabled={downloading}
            className="border-primary/40 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Exporting..." : "Download PNG"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPDF}
            disabled={downloading}
            className="border-primary/40 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
