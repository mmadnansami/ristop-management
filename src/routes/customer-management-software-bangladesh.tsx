import { createFileRoute } from "@tanstack/react-router";
import { SeoLanding, seoHead } from "@/components/SeoLanding";

export const Route = createFileRoute("/customer-management-software-bangladesh")({
  head: () =>
    seoHead({
      title: "Customer Management Software Bangladesh | Ristop Management",
      description:
        "Keep customer records, purchase history and outstanding dues in one place with Ristop Management — customer management built into your business software.",
      path: "/customer-management-software-bangladesh",
    }),
  component: () => (
    <SeoLanding
      h1="Customer Management Built Into Your Business Software"
      intro="Ristop Management stores your customers with their contact details, purchase history and current balance, so every conversation starts with the right information."
      sections={[
        {
          heading: "Customer records that stay current",
          body: "Each sale is attached to a customer, so their history builds automatically instead of being written down separately.",
          points: [
            "Customer list with contact details",
            "Purchase history per customer",
            "Outstanding due (bakeya) balance",
          ],
        },
        {
          heading: "Dues you can actually collect",
          body: "The dues page shows who owes what, so follow-ups are based on records rather than memory or scattered notes.",
        },
        {
          heading: "Suppliers too",
          body: "The same approach applies to suppliers: purchases, payments and what you still owe are kept together.",
        },
      ]}
    />
  ),
});
