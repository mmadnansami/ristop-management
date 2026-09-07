import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/business-profit-management-software")({
  head: () =>
    seoHead({
      title: "Business Profit Management Software | Ristop Management",
      description:
        "Understand profit, not just sales. Ristop Management calculates profit from cost and selling price and turns daily transactions into clear business reports.",
      path: "/business-profit-management-software",
    }),
  component: () => (
    <SeoLanding
      h1="Profit Management Software for Everyday Decisions"
      intro="Revenue alone does not tell you whether a day was good. Ristop Management stores cost price with every product, so profit is calculated as you sell."
      sections={[
        {
          heading: "Profit calculated from real transactions",
          body: "Because purchases, sales and product costs live in the same system, profit comes from your actual records rather than an estimate.",
          points: [
            "Profit per sale and per period",
            "Sales, purchase and profit reports",
            "Dashboard summary of daily performance",
          ],
        },
        {
          heading: "Reports you can act on",
          body: "Review which periods performed well and which products move fastest, then adjust purchasing and pricing accordingly.",
        },
        {
          heading: "AI-assisted context",
          body: "The Market Analyst section summarises recent market signals, and Ris AI can explain how to use a feature or read a report in Bangla or English.",
        },
      ]}
    />
  ),
});
