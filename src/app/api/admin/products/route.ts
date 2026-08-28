import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeSellPrice } from "@/lib/pricing";
import { optionalTrimmedString, optionalNumber } from "@/lib/zodHelpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeCategory = searchParams.get("excludeCategory");
  const withCount = searchParams.get("withCount") === "1";
  const groupByVendor = searchParams.get("groupByVendor") === "1";
  const noImageOnly = searchParams.get("noImageOnly") === "1";

  const where = {
    ...(excludeCategory ? { OR: [{ category: null }, { category: { not: excludeCategory } }] } : {}),
    ...(noImageOnly ? { imageUrl: null } : {}),
  };

  if (groupByVendor) {
    const groups = await prisma.product.groupBy({
      by: ["vendor"],
      where,
      _count: { _all: true },
      orderBy: { _count: { vendor: "desc" } },
    });
    return NextResponse.json({ vendors: groups.map((g) => ({ vendor: g.vendor, count: g._count._all })) });
  }

  // Capped so a large catalog (e.g. a full configurator import) doesn't force
  // the admin page to fetch and render every row at once.
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
    withCount ? prisma.product.count({ where }) : Promise.resolve(null),
  ]);
  return NextResponse.json({ products, total });
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
