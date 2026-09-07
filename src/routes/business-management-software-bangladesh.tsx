import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/business-management-software-bangladesh")({
  head: () =>
    seoHead({
      title: "Business Management Software in Bangladesh | Ristop Management",
      description:
        "Ristop Management is a business management software for Bangladeshi shops, wholesalers and small businesses — sales, inventory, customers, dues, invoices and reports in one place.",
      path: "/business-management-software-bangladesh",
    }),
  component: () => (
    <SeoLanding
      h1="Business Management Software in Bangladesh"
      intro="Ristop Management helps businesses in Bangladesh run daily operations from one connected workspace — sales, inventory, customers, suppliers, dues, invoices, profit and reports, with AI-assisted insights."
      sections={[
        {
          heading: "Built for how businesses work in Bangladesh",
          body: "Retail shops, wholesalers and distributors usually track sales in one notebook, dues in another and stock in memory. Ristop Management keeps all of it together, with Bangla and English available across the app and prices shown in BDT.",
          points: [
            "Bangla / English language toggle",
            "BDT and USD pricing",
            "Works on mobile, tablet and desktop browsers",
          ],
        },
        {
          heading: "What you can manage",
          body: "Every core part of daily business management is covered, so the same record powers your invoice, your stock level and your profit report.",
          points: [
            "Sales entry with automatic stock deduction",
            "Purchases and supplier records",
            "Customer profiles and bakeya (dues) tracking",
            "Invoices and billing",
            "Profit analysis and business reports",
            "Low-stock alerts",
          ],
        },
        {
          heading: "AI-assisted business insights",
          body: "Ris AI answers questions about your business workflow in Bangla or English, and the Market Analyst section summarises recent market signals so you can decide what to stock and price next.",
        },
      ]}
    />
  ),
});
