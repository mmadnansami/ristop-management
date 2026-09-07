import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/inventory-management-software-bangladesh")({
  head: () =>
    seoHead({
      title: "Inventory Management Software Bangladesh | Ristop Management",
      description:
        "Track stock in real time with Ristop Management — product-wise inventory, purchase entry, low-stock alerts and stock-linked sales for businesses in Bangladesh.",
      path: "/inventory-management-software-bangladesh",
    }),
  component: () => (
    <SeoLanding
      h1="Inventory Management Software for Bangladeshi Businesses"
      intro="Ristop Management keeps your stock accurate without manual counting. Every purchase increases stock and every sale reduces it, so the number you see is the number on your shelf."
      sections={[
        {
          heading: "Real-time stock, product by product",
          body: "Add products once with their buying and selling price, then let daily transactions maintain the balance. The stock page shows current quantity for each item.",
          points: [
            "Product catalogue with cost and selling price",
            "Automatic stock movement from sales and purchases",
            "Low-stock alerts before you run out",
          ],
        },
        {
          heading: "Purchases and suppliers stay connected",
          body: "Record purchases against suppliers so you always know what came in, at what cost, and what is still owed to whom.",
        },
        {
          heading: "Stock that feeds your profit reports",
          body: "Because cost price is stored with each product, your reports show profit alongside sales instead of revenue alone.",
        },
      ]}
    />
  ),
});
