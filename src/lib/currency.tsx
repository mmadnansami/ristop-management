import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppCurrency = "USD" | "BDT";

/** All business data is stored in BDT. This is the display conversion rate. */
export const BDT_PER_USD = 120;

const STORAGE_KEY = "ristop_currency";

interface CurrencyCtx {
  currency: AppCurrency;
  setCurrency: (c: AppCurrency) => void;
  symbol: string;
  /** Convert a BDT amount into the selected display currency (number). */
  convert: (bdt: number) => number;
  /** Format a BDT amount into a display string in the selected currency. */
  money: (bdt: number | string | null | undefined) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // USD is the default for everyone; users can switch to BDT manually.
  const [currency, setCurrencyState] = useState<AppCurrency>("USD");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "USD" || saved === "BDT") setCurrencyState(saved);
  }, []);

  const value = useMemo<CurrencyCtx>(() => {
    const setCurrency = (c: AppCurrency) => {
      setCurrencyState(c);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, c);
    };
    const convert = (bdt: number) => (currency === "BDT" ? bdt : bdt / BDT_PER_USD);
    const money = (bdt: number | string | null | undefined) => {
      const n = Number(bdt ?? 0);
      if (!Number.isFinite(n)) return currency === "BDT" ? "৳0" : "$0.00";
      const v = convert(n);
      return currency === "BDT"
        ? `৳${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    return { currency, setCurrency, symbol: currency === "BDT" ? "৳" : "$", convert, money };
  }, [currency]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCurrency outside provider");
  return c;
}

/** Small inline USD / BDT switcher. */
export function CurrencyToggle({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className={`inline-flex items-center rounded-full border border-border p-0.5 ${className}`}>
      {(["USD", "BDT"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            currency === c
              ? "bg-gradient-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {c === "USD" ? "$ USD" : "৳ BDT"}
        </button>
      ))}
    </div>
  );
}
