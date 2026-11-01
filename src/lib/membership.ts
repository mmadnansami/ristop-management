import { supabase } from "@/integrations/supabase/client";

export type MembershipTierSlug = "special" | "premium" | "elite";
export type MembershipStatus = "active" | "expired" | "suspended" | "revoked";
export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "payment_pending"
  | "active"
  | "rejected"
  | "expired"
  | "suspended";

export interface MembershipTierConfig {
  slug: MembershipTierSlug;
  name: string;
  name_bn: string;
  tagline: string;
  tagline_bn: string;
  price_bdt: number;
  price_usd: number;
  billing_period: string;
  discount_percent: number; // 15% (Special), 20% (Premium), 30% (Elite)
  benefits: string[];
  benefits_bn: string[];
  theme: {
    cardBg: string;
    cardBorder: string;
    textColor: string;
    accentColor: string;
    badgeBg: string;
    chipGradient: string;
  };
}

export const MEMBERSHIP_TIERS: Record<MembershipTierSlug, MembershipTierConfig> = {
  special: {
    slug: "special",
    name: "Special Member",
    name_bn: "স্পেশাল মেম্বার",
    tagline: "Privileged Access & Substantial Savings",
    tagline_bn: "সুবিধাজনক এক্সেস এবং বিশেষ সঞ্চয়",
    price_bdt: 0,
    price_usd: 0,
    billing_period: "Annual (Complimentary)",
    discount_percent: 15,
    benefits: [
      "Digital Special Member Card (Purple & White theme)",
      "15%+ Extra Discount on software subscriptions",
      "Eligible member-only offers & priority announcements",
      "Basic membership privileges & account verification",
      "Eligible community access in future",
      "Access to applicable member partner perks",
    ],
    benefits_bn: [
      "ডিজিটাল স্পেশাল মেম্বার কার্ড (পার্পল ও হোয়াইট থিম)",
      "সফটওয়্যার সাবস্ক্রিপশনে ১৫%+ অতিরিক্ত ডিসকাউন্ট",
      "যোগ্য মেম্বার-অনলি অফার ও অগ্রিম ঘোষণা",
      "বেসিক মেম্বারশিপ সুবিধা ও প্রোফাইল ভেরিফিকেশন",
      "ভবিষ্যতে বিশেষ কমিউনিটি সুবিধা প্রাপ্তির যোগ্যতা",
      "প্রযোজ্য মেম্বার পার্টনার সুবিধায় অগ্রাধিকার",
    ],
    theme: {
      cardBg: "from-purple-900 via-indigo-950 to-purple-950",
      cardBorder: "border-purple-300/40",
      textColor: "text-white",
      accentColor: "text-purple-200",
      badgeBg: "bg-purple-100 text-purple-900 border-purple-200",
      chipGradient: "from-purple-200 via-white to-purple-300",
    },
  },
  premium: {
    slug: "premium",
    name: "Premium Member",
    name_bn: "প্রিমিয়াম মেম্বার",
    tagline: "Enhanced Power, Priority Support & Higher Discounts",
    tagline_bn: "অগ্রাধিকার সাপোর্ট এবং উচ্চতর ডিসকাউন্ট",
    price_bdt: 299,
    price_usd: 4,
    billing_period: "Annual",
    discount_percent: 20,
    benefits: [
      "Premium Digital Member Card (Deep Purple & Silver metallic)",
      "20% Extra Discount on software subscriptions",
      "Priority customer care & quick issue resolution",
      "Eligible exclusive partner & feature discounts",
      "Early access eligibility to upcoming tools",
      "Premium membership benefits & extended account perks",
    ],
    benefits_bn: [
      "প্রিমিয়াম ডিজিটাল মেম্বার কার্ড (ডিপ পার্পল ও সিলভার ফিনিশ)",
      "সফটওয়্যার সাবস্ক্রিপশনে ২০% অতিরিক্ত ডিসকাউন্ট",
      "অগ্রাধিকার কাস্টমার কেয়ার ও দ্রুত সমাধান",
      "যোগ্য এক্সক্লুসিভ পার্টনার ও ফিচার সুবিধা",
      "নতুন টুলসে দ্রুত আগাম এক্সেসের সুযোগ",
      "প্রিমিয়াম সদস্য সুবিধা ও একাউন্ট সহায়তা",
    ],
    theme: {
      cardBg: "from-[#1e1338] via-[#2a1b4d] to-[#120a24]",
      cardBorder: "border-slate-300/60",
      textColor: "text-slate-100",
      accentColor: "text-slate-300",
      badgeBg: "bg-gradient-to-r from-slate-200 to-slate-100 text-slate-900 border-slate-300",
      chipGradient: "from-slate-100 via-slate-300 to-slate-400",
    },
  },
  elite: {
    slug: "elite",
    name: "Elite Member",
    name_bn: "ইলিট মেম্বার",
    tagline: "The Pinnacle of Privilege, 30% Savings & Executive Onboarding",
    tagline_bn: "সর্বোচ্চ সুবিধা, ৩০% ডিসকাউন্ট ও ভিআইপি অনবোর্ডিং",
    price_bdt: 999,
    price_usd: 12,
    billing_period: "Annual",
    discount_percent: 30,
    benefits: [
      "Elite Digital Member Card (Deep Purple & Lustrous Gold)",
      "30% Highest Eligible Discount on software subscriptions",
      "Dedicated priority onboarding & executive account manager",
      "Exclusive business opportunities when available",
      "24/7 VIP priority support escalation",
      "Elite privileges across all present and future modules",
    ],
    benefits_bn: [
      "ইলিট ডিজিটাল মেম্বার কার্ড (ডিপ পার্পল ও লাক্সারি গোল্ড ফিনিশ)",
      "সফটওয়্যার সাবস্ক্রিপশনে সর্বোচ্চ ৩০% বিশেষ ডিসকাউন্ট",
      "ডেডিকেটেড ভিআইপি অনবোর্ডিং ও এক্সিকিউটিভ কেয়ার",
      "উপলব্ধি সাপেক্ষে এক্সক্লুসিভ ব্যবসায়িক সুযোগসুবিধা",
      "২৪/৭ জরুরি প্রায়োরিটি সাপোর্ট এসকেলেশন",
      "বর্তমান ও ভবিষ্যতের সব মডিউলে ইলিট অগ্রাধিকার",
    ],
    theme: {
      cardBg: "from-[#1c0d2e] via-[#2a0e44] to-[#0d0417]",
      cardBorder: "border-amber-400/70",
      textColor: "text-amber-50",
      accentColor: "text-amber-300",
      badgeBg:
        "bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 text-amber-950 font-bold border-amber-400",
      chipGradient: "from-amber-200 via-yellow-300 to-amber-500",
    },
  },
};

/**
 * Generate a unique verification token for digital cards or invitations
 */
export function generateSecureToken(prefix = "rst"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
}

/**
 * Format Member ID cleanly: RST-SP-1001, RST-PR-1002, RST-EL-1003
 */
export function formatMemberId(tier: MembershipTierSlug, num: number | string): string {
  const code = tier === "special" ? "SP" : tier === "premium" ? "PR" : "EL";
  const formattedNum = String(num).padStart(4, "0");
  return `RST-${code}-${formattedNum}`;
}

/**
 * Helper to retrieve active membership of a user
 */
export async function fetchUserMembership(userId: string) {
  try {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, membership_cards(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.warn("fetchUserMembership error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("fetchUserMembership catch:", err);
    return null;
  }
}

/**
 * Calculate member subscription price after tier discount
 */
export function calculateMemberDiscount(
  basePrice: number,
  tier: MembershipTierSlug | null | undefined,
): { discountedPrice: number; discountAmount: number; discountPercent: number } {
  if (!tier || !MEMBERSHIP_TIERS[tier]) {
    return { discountedPrice: basePrice, discountAmount: 0, discountPercent: 0 };
  }
  const pct = MEMBERSHIP_TIERS[tier].discount_percent;
  const discountAmount = Math.round((basePrice * pct) / 100);
  const discountedPrice = Math.max(0, basePrice - discountAmount);
  return { discountedPrice, discountAmount, discountPercent: pct };
}
