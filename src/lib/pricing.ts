export type PlanId = "monthly" | "quarterly" | "biannual";
export type Currency = "BDT" | "USD";

export type Plan = {
  id: PlanId;
  label_en: string;
  label_bn: string;
  period_en: string;
  period_bn: string;
  bdt: number;
  bdt_original?: number;
  usd: number;
  usd_original?: number;
  popular?: boolean;
};

/** Launch pricing. Monthly is discounted for the launch campaign. */
export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    label_en: "Monthly",
    label_bn: "একমাসিক",
    period_en: "/month",
    period_bn: "/মাস",
    bdt: 190,
    bdt_original: 399,
    usd: 3,
    usd_original: 4,
  },
  quarterly: {
    id: "quarterly",
    label_en: "Quarterly",
    label_bn: "তৃমাসিক",
    period_en: "/3 months",
    period_bn: "/৩ মাস",
    bdt: 799,
    usd: 10,
    popular: true,
  },
  biannual: {
    id: "biannual",
    label_en: "Biannual",
    label_bn: "ছয়মাসিক",
    period_en: "/6 months",
    period_bn: "/৬ মাস",
    bdt: 1199,
    usd: 16,
  },
};

export const PLAN_LIST: Plan[] = [PLANS.monthly, PLANS.quarterly, PLANS.biannual];

export const priceOf = (plan: Plan, currency: Currency) => (currency === "BDT" ? plan.bdt : plan.usd);
export const originalPriceOf = (plan: Plan, currency: Currency) =>
  currency === "BDT" ? plan.bdt_original : plan.usd_original;

export function formatPrice(amount: number, currency: Currency) {
  return currency === "BDT" ? `৳${amount}` : `$${amount}`;
}

export function discountPercent(plan: Plan, currency: Currency) {
  const original = originalPriceOf(plan, currency);
  if (!original) return 0;
  return Math.round(((original - priceOf(plan, currency)) / original) * 100);
}
