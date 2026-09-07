import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/sales-management-software-bangladesh")({
  head: () =>
    seoHead({
      title: "Sales Management Software Bangladesh | Ristop Management",
      description:
        "Record daily sales, generate invoices and follow profit per sale with Ristop Management — sales management software for shops and small businesses in Bangladesh.",
      path: "/sales-management-software-bangladesh",
    }),
  component: () => (
    <SeoLanding
      h1="Sales Management Software for Daily Business"
      intro="Ristop Management turns each sale into a complete record: the invoice for your customer, the stock adjustment for your shelf and the profit line for your report."
      sections={[
        {
          heading: "Faster daily sales entry",
          body: "Pick a product, set quantity, choose the customer and save. The invoice is ready to share and the numbers update everywhere at once.",
          points: [
            "Invoice generation for every sale",
            "Automatic stock deduction",
            "Cash and due sales supported",
          ],
        },
        {
          heading: "See performance, not just totals",
          body: "The dashboard summarises daily sales, order count and profit, and the reports section lets you review performance over time.",
        },
        {
          heading: "Dues follow the sale",
          body: "When a customer pays partly, the remaining amount is stored as bakeya against that customer, so collection never depends on memory.",
        },
      ]}
    />
  ),
});
