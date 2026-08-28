import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeSellPrice } from "@/lib/pricing";
import { optionalTrimmedString, optionalNumber } from "@/lib/zodHelpers";

export async function GET() {
  // Capped so a large catalog (e.g. a full configurator import) doesn't force
  // the admin page to fetch and render every row at once.
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return NextResponse.json({ products });
}

const createSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: optionalTrimmedString,
  vendor: optionalTrimmedString,
  category: optionalTrimmedString,
  cost: z.coerce.number().positive(),
  markupPercent: optionalNumber,
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const markupPercent = parsed.data.markupPercent ?? Number(settings?.defaultMarkupPercent ?? 20);
  const price = computeSellPrice(parsed.data.cost, markupPercent);

  const product = await prisma.product.upsert({
    where: { sku: parsed.data.sku },
    update: {
      name: parsed.data.name,
      description: parsed.data.description,
      vendor: parsed.data.vendor,
      category: parsed.data.category,
      baseCost: parsed.data.cost,
      markupPercent,
      price,
    },
    create: {
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description,
      vendor: parsed.data.vendor,
      category: parsed.data.category,
      baseCost: parsed.data.cost,
      markupPercent,
      price,
    },
  });

  return NextResponse.json({ product });
}
