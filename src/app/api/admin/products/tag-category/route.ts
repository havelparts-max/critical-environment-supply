import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// One-off / occasional maintenance endpoint: bulk-sets `category` on products
// identified by SKU. Used to flag the machine-generated configurator SKU sets
// (MSX/626/628 combinations) so they can be excluded from things like the
// Google Merchant Center feed without touching name/description/price.
export const maxDuration = 60;

const bodySchema = z.object({
  skus: z.array(z.string().trim().min(1)).min(1).max(50000),
  category: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { skus, category } = parsed.data;
  const updated = await prisma.$executeRaw`
    UPDATE "Product"
    SET category = ${category}, "updatedAt" = now()
    WHERE sku = ANY(${skus}::text[])
  `;

  return NextResponse.json({ updated, requested: skus.length });
}
