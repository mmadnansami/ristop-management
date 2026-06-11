import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({ component: Sales });

type Sale = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  profit: number;
  sold_at: string;
  customer_id: string | null;
  validity_start: string | null;
  validity_end: string | null;
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Sales() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: async () =>
      (await supabase.from("sales").select("*").order("sold_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () =>
      (await supabase.from("products").select("id,name,price,cost_price,stock,duration_days")).data ?? [],
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-min"],
    queryFn: async () =>
      (await supabase.from("customers").select("id,name,phone,address,email")).data ?? [],
  });
  const { data: me } = useQuery({
    queryKey: ["me-company"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return { user: u.user, profile: p };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">{t("sales")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "bn"
              ? "নতুন সেল রেকর্ড করুন এবং সুন্দর ইনভয়েস ডাউনলোড করুন"
              : "Record sales and download beautiful invoices"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow rounded-xl h-11">
              <Plus className="h-4 w-4 mr-1" /> {lang === "bn" ? "নতুন সেল" : "New Sale"}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-white/10">
            <DialogHeader>
              <DialogTitle>{lang === "bn" ? "নতুন সেল" : "New Sale"}</DialogTitle>
            </DialogHeader>
            <SaleForm
              products={products}
              customers={customers.map((c) => ({ id: c.id, name: c.name }))}
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl glass-strong overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-muted-foreground border-b border-white/10">
              <tr>
                <th className="text-left p-4">{lang === "bn" ? "তারিখ" : "Date"}</th>
                <th className="text-left p-4">{lang === "bn" ? "প্রডাক্ট" : "Product"}</th>
                <th className="text-right p-4">Qty</th>
                <th className="text-right p-4">{lang === "bn" ? "মূল্য" : "Price"}</th>
                <th className="text-right p-4">{lang === "bn" ? "মোট" : "Total"}</th>
                <th className="text-right p-4">{lang === "bn" ? "লাভ" : "Profit"}</th>
                <th className="text-left p-4">{lang === "bn" ? "মেয়াদ" : "Validity"}</th>
                <th className="p-4 text-right">{lang === "bn" ? "ইনভয়েস" : "Invoice"}</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    {lang === "bn" ? "কোনো সেল নেই" : "No sales yet"}
                  </td>
                </tr>
              ) : (
                sales.map((s: Sale) => {
                  const customer = customers.find((c) => c.id === s.customer_id) ?? null;
                  return (
                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="p-4">{fmtDate(s.sold_at)}</td>
                      <td className="p-4 font-medium">{s.product_name}</td>
                      <td className="p-4 text-right">{s.quantity}</td>
                      <td className="p-4 text-right">৳{Number(s.unit_price).toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold">
                        ৳{Number(s.total).toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-success">
                        ৳{Number(s.profit).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs">
                        {s.validity_start && s.validity_end ? (
                          <span className="inline-block rounded-full bg-primary/15 text-primary-glow px-2.5 py-1 border border-primary/30">{fmtDate(s.validity_start)} → {fmtDate(s.validity_end)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openInvoice(s, customer, me?.profile)}
                          className="hover:bg-primary/10"
                        >
                          <Download className="h-4 w-4 mr-1" /> PDF
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type CompanyProfile = Record<string, string | null> | null | undefined;
type Customer = {
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
} | null;

function openInvoice(s: Sale, customer: Customer, company: CompanyProfile) {
  const c = company ?? {};
  const companyName = (c.company_name as string) || "Ristop Management";
  const tagline = (c.company_tagline as string) || "Smart Business Management";
  const addr = (c.company_address as string) || "";
  const cphone = (c.company_phone as string) || "";
  const cemail = (c.company_email as string) || "";
  const logo = (c.company_logo_url as string) || "";
  const invNo = "INV-" + s.id.slice(0, 8).toUpperCase();
  const date = new Date(s.sold_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const tax = 0;
  const grand = Number(s.total) + tax;
  const invoiceMarkup = `<div class="invoice" id="invoice-card">
    <div class="top">
      <div class="top-row">
        <div class="brand">
          ${logo ? `<img src="${escapeHtml(logo)}" alt="logo" crossorigin="anonymous"/>` : ""}
          <div>
            <div class="brand-name">${escapeHtml(companyName)}</div>
            <div class="brand-tag">${escapeHtml(tagline)}</div>
          </div>
        </div>
        <div class="inv-meta">
          <span class="tag">Invoice</span>
          <h2>${invNo}</h2>
          <p>${date}</p>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h4>From</h4>
        <div class="name">${escapeHtml(companyName)}</div>
        ${addr ? `<p>${escapeHtml(addr)}</p>` : ""}
        ${cphone ? `<p>📞 ${escapeHtml(cphone)}</p>` : ""}
        ${cemail ? `<p>✉ ${escapeHtml(cemail)}</p>` : ""}
      </div>
      <div class="party">
        <h4>Billed To</h4>
        <div class="name">${escapeHtml(customer?.name || "Walk-in Customer")}</div>
        ${customer?.address ? `<p>${escapeHtml(customer.address)}</p>` : ""}
        ${customer?.phone ? `<p>📞 ${escapeHtml(customer.phone)}</p>` : ""}
        ${customer?.email ? `<p>✉ ${escapeHtml(customer.email)}</p>` : ""}
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td class="prod">
            ${escapeHtml(s.product_name)}
            ${s.validity_start && s.validity_end ? `<div class="validity">Validity: ${fmtDate(s.validity_start)} → ${fmtDate(s.validity_end)}</div>` : ""}
          </td>
          <td class="r">${s.quantity}</td>
          <td class="r">৳ ${Number(s.unit_price).toLocaleString()}</td>
          <td class="r"><strong>৳ ${Number(s.total).toLocaleString()}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>৳ ${Number(s.total).toLocaleString()}</span></div>
      <div class="row"><span>Tax</span><span>৳ ${tax}</span></div>
      <div class="grand"><span>Total Due</span><span>৳ ${grand.toLocaleString()}</span></div>
    </div>

    <div class="footer">
      Thank you for your business! Powered by <strong>Ristop Management</strong>
    </div>
  </div>`;

  const styles = `
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{font-family:'Outfit','Hind Siliguri',system-ui,sans-serif;background:#0e0820;color:#1a1a1a;padding:32px;min-height:100vh}
  .invoice{max-width:820px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4)}
  .top{background:linear-gradient(135deg,#5b21b6 0%,#8b5cf6 60%,#c084fc 100%);color:#fff;padding:36px 44px;position:relative;overflow:hidden}
  .top::after{content:"";position:absolute;right:-80px;top:-80px;width:260px;height:260px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.25),transparent)}
  .top-row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;position:relative;z-index:1}
  .brand{display:flex;align-items:center;gap:14px}
  .brand img{width:54px;height:54px;border-radius:14px;object-fit:cover;background:#fff;padding:6px}
  .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.02em}
  .brand-tag{font-size:12px;opacity:.85;margin-top:2px}
  .inv-meta{text-align:right}
  .inv-meta .tag{display:inline-block;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);padding:6px 14px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  .inv-meta h2{font-size:28px;margin-top:8px;font-weight:800;letter-spacing:-0.02em}
  .inv-meta p{font-size:12px;opacity:.85;margin-top:2px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:32px 44px;background:#faf7ff}
  .party h4{font-size:10px;font-weight:700;letter-spacing:.14em;color:#7c3aed;text-transform:uppercase;margin-bottom:8px}
  .party .name{font-size:16px;font-weight:700;color:#1a1a1a}
  .party p{font-size:13px;color:#555;margin-top:3px;line-height:1.5}
  table{width:100%;border-collapse:collapse;margin:0}
  thead th{background:#1a1030;color:#fff;text-align:left;padding:14px 44px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600}
  thead th.r{text-align:right}
  tbody td{padding:18px 44px;border-bottom:1px solid #eee;font-size:14px}
  tbody td.r{text-align:right}
  tbody td.prod{font-weight:600;color:#1a1a1a}
  tbody td.prod .validity{margin-top:6px;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:.04em;background:#f3ecff;display:inline-block;padding:4px 10px;border-radius:999px}
  .totals{padding:24px 44px;background:#faf7ff}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#555}
  .totals .grand{margin-top:14px;padding-top:18px;border-top:2px dashed #c4b5fd;display:flex;justify-content:space-between;align-items:center}
  .totals .grand span:first-child{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#7c3aed;font-weight:700}
  .totals .grand span:last-child{font-size:30px;font-weight:800;color:#5b21b6}
  .footer{padding:24px 44px;background:#1a1030;color:#cbb8ff;text-align:center;font-size:12px}
  .footer strong{color:#fff}
  .actions{position:fixed;top:20px;right:20px;display:flex;gap:8px;z-index:10}
  .actions button{background:#7c3aed;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 10px 30px rgba(124,58,237,.4)}
  .actions button.alt{background:#fff;color:#1a1030}
  @page{size:A4;margin:10mm;background:#0e0820}
  @media print{.actions{display:none}body{background:#0e0820!important;padding:14px}.invoice{box-shadow:0 30px 80px rgba(0,0,0,.4);border-radius:24px}.top,.parties,.totals,.footer,thead th{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
</style>`;

  void downloadInvoicePdf(invoiceMarkup, styles, invNo);
}

async function downloadInvoicePdf(invoiceMarkup: string, styles: string, invNo: string) {
  const toastId = toast.loading("Preparing invoice PDF...");
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "absolute";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "900px";
  iframe.style.height = "1200px";
  iframe.style.border = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.opacity = "0.01";
  iframe.style.zIndex = "0";
  document.body.appendChild(iframe);
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await renderInvoiceFrame(iframe, styles, invoiceMarkup);
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Invoice renderer was not ready");
    await doc.fonts?.ready;
    const card = doc.querySelector(".invoice") as HTMLElement;
    if (!card) throw new Error("Invoice design was not ready");
    await waitForInvoiceAssets(card);
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(card, {
        scale: 2.5,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
    } catch (firstError) {
      card.querySelectorAll("img").forEach((img) => img.remove());
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      try {
        canvas = await html2canvas(card, {
          scale: 2.5,
          backgroundColor: null,
          useCORS: true,
          allowTaint: false,
          logging: false,
        });
      } catch {
        throw firstError;
      }
    }
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFillColor(14, 8, 32);
    pdf.rect(0, 0, 210, 297, "F");
    const imgData = canvas.toDataURL("image/png", 1);
    const maxWidth = 190;
    const maxHeight = 273;
    let width = maxWidth;
    let height = (canvas.height * width) / canvas.width;
    if (height > maxHeight) {
      height = maxHeight;
      width = (canvas.width * height) / canvas.height;
    }
    pdf.addImage(imgData, "PNG", (210 - width) / 2, 12, width, height);
    pdf.save(`${invNo}.pdf`);
    toast.success("Invoice PDF downloaded", { id: toastId });
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "PDF download failed", { id: toastId });
  } finally {
    iframe.remove();
  }
}

async function renderInvoiceFrame(
  iframe: HTMLIFrameElement,
  styles: string,
  invoiceMarkup: string,
) {
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${invoiceMarkup}</body></html>`;
    window.setTimeout(resolve, 600);
  });
}

async function waitForInvoiceAssets(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
  await new Promise((resolve) => window.setTimeout(resolve, 120));
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function SaleForm({
  products,
  customers,
  onDone,
}: {
  products: { id: string; name: string; price: number; cost_price: number; stock: number; duration_days: number | null }[];
  customers: { id: string; name: string }[];
  onDone: () => void;
}) {
  const { lang } = useI18n();
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const p = products.find((x) => x.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) {
      toast.error("Pick a product");
      return;
    }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error(lang === "bn" ? "আবার লগইন করুন" : "Please sign in again");
      setLoading(false);
      return;
    }
    const total = p.price * qty;
    const profit = (p.price - p.cost_price) * qty;
    const { error } = await supabase.from("sales").insert({
      user_id: u.user.id,
      product_id: p.id,
      customer_id: customerId || null,
      product_name: p.name,
      quantity: qty,
      unit_price: p.price,
      unit_cost: p.cost_price,
      total,
      profit,
    });
    if (!error) {
      await supabase
        .from("products")
        .update({ stock: Math.max(0, p.stock - qty) })
        .eq("id", p.id);
      await supabase
        .from("activity_log")
        .insert({ user_id: u.user.id, action: `Sale: ${p.name} x${qty}`, detail: `৳${total}` });
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "bn" ? "সেল রেকর্ড হয়েছে" : "Sale recorded");
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>{lang === "bn" ? "প্রডাক্ট" : "Product"}</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger className="h-11 bg-white/5 border-white/15 rounded-xl">
            <SelectValue placeholder={lang === "bn" ? "প্রডাক্ট নির্বাচন করুন" : "Pick product"} />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — ৳{p.price} (stock: {p.stock})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{lang === "bn" ? "কাস্টমার (অপশনাল)" : "Customer (optional)"}</Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="h-11 bg-white/5 border-white/15 rounded-xl">
            <SelectValue placeholder={lang === "bn" ? "Walk-in" : "Walk-in"} />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{lang === "bn" ? "পরিমাণ" : "Quantity"}</Label>
        <Input
          inputMode="numeric"
          value={String(qty)}
          onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value || 1))))}
          className="h-11 bg-white/5 border-white/15 rounded-xl"
        />
      </div>
      {p && (
        <div className="rounded-xl glass p-3 text-sm flex justify-between">
          <span>{lang === "bn" ? "মোট" : "Total"}</span>
          <span className="font-bold text-gradient">৳{(p.price * qty).toFixed(2)}</span>
        </div>
      )}
      <Button
        type="submit"
        disabled={loading || !p}
        className="w-full bg-gradient-primary shadow-glow rounded-xl h-11"
      >
        <FileText className="h-4 w-4 mr-1" />{" "}
        {loading ? "..." : lang === "bn" ? "সেল রেকর্ড" : "Record Sale"}
      </Button>
    </form>
  );
}
