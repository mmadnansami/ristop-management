import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/business-software-bangladesh")({
  head: () =>
    seoHead({
      title: "Business Software for Bangladeshi Businesses | Ristop Management",
      description:
        "Looking for business software in Bangladesh? Ristop Management combines sales, stock, customers, suppliers, invoices and reporting in a single web app for growing businesses.",
      path: "/business-software-bangladesh",
    }),
  component: () => (
    <SeoLanding
      h1="Business Software for Growing Bangladeshi Businesses"
      intro="Ristop Management is a web-based business software you can open from any browser. There is nothing to install, and your records stay in one place instead of spreading across notebooks, spreadsheets and phone notes."
      sections={[
        {
          heading: "One workspace instead of separate tools",
          body: "Many small teams run one tool for billing, another for stock and a chat group for dues. Ristop Management connects those records, so a single sale updates stock, customer balance and your profit report at the same time.",
        },
        {
          heading: "Simple to start, useful from day one",
          body: "Create an account, add your products, and start recording sales. The dashboard shows daily sales, profit, order count and low-stock items immediately.",
          points: [
            "No installation — works in the browser",
            "Bangla and English interface",
            "Cloud-stored data with account-level isolation",
          ],
        },
        {
          heading: "Grows with your business",
          body: "Start on the free plan and move to a paid plan when you need unlimited invoices, priority support and the full reporting set. Pricing is shown in both BDT and USD.",
        },
      ]}
    />
  ),
});
