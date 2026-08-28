import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.criticalenvironmentsupply.com";
const CONFIGURATOR_CATEGORY = "Dwyer Configurator";

// Google Merchant Center primary feed (tab-separated), fetched on a schedule via
// Merchant Center's "Scheduled fetch" — no manual spreadsheet upload needed.
// Scope: the "core catalog" only — excludes the machine-generated Dwyer
// configurator combinations (tagged category = "Dwyer Configurator"), since
// those are quoting/reference SKUs rather than individually-marketed products.
//
// image_link is left blank for products with no photo on file yet; Google will
// hold/reject just those specific items until an image is added, rather than
// blocking the rest of the feed.

function tsvField(value: string) {
  return value.replace(/[\t\n\r]+/g, " ").trim();
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [{ category: null }, { category: { not: CONFIGURATOR_CATEGORY } }],
    },
    select: {
      sku: true,
      name: true,
      description: true,
      vendor: true,
      price: true,
      imageUrl: true,
    },
    orderBy: { sku: "asc" },
  });

  const headers = [
    "id",
    "title",
    "description",
    "link",
    "image_link",
    "availability",
    "price",
    "condition",
    "brand",
    "mpn",
  ];

  const rows = products.map((p) => {
    const link = `${SITE_URL}/product/${encodeURIComponent(p.sku)}`;
    const description = p.description?.trim() || p.name;
    return [
      p.sku,
      p.name,
      description,
      link,
      p.imageUrl ?? "",
      "in stock",
      `${p.price.toFixed(2)} USD`,
      "new",
      p.vendor ?? "",
      p.sku,
    ]
      .map((v) => tsvField(String(v)))
      .join("\t");
  });

  const body = [headers.join("\t"), ...rows].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
