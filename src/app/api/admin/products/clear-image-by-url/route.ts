import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Clears imageUrl on every product currently pointing at a specific image
// (e.g. a bad placeholder/logo image picked up from a vendor data import),
// so those products fall back to no image rather than a wrong one.
export const maxDuration = 60;

const bodySchema = z.object({
  imageUrl: z.string().trim().url(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { imageUrl } = parsed.data;

  const affected = await prisma.product.findMany({
    where: { imageUrl },
    select: { sku: true },
  });

  const updated = await prisma.$executeRaw`
    UPDATE "Product" SET "imageUrl" = NULL, "updatedAt" = now() WHERE "imageUrl" = ${imageUrl}
  `;

  return NextResponse.json({ updated, skus: affected.map((p) => p.sku) });
}
