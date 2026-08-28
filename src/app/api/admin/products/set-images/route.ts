import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Bulk-sets imageUrl on existing products, keyed by SKU. Each row gets its own
// value (unlike tag-category, which sets one shared value), so this uses a
// VALUES-based bulk update rather than `= ANY(...)`.
export const maxDuration = 60;

const bodySchema = z.object({
  items: z
    .array(z.object({ sku: z.string().trim().min(1), imageUrl: z.string().trim().url() }))
    .min(1)
    .max(5000),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { items } = parsed.data;
  const valueRows = items.map((item) => Prisma.sql`(${item.sku}, ${item.imageUrl})`);

  const updated = await prisma.$executeRaw`
    UPDATE "Product" AS p
    SET "imageUrl" = v.image_url, "updatedAt" = now()
    FROM (VALUES ${Prisma.join(valueRows)}) AS v(sku, image_url)
    WHERE p.sku = v.sku
  `;

  return NextResponse.json({ updated, requested: items.length });
}
