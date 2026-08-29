import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Bulk-sets imageUrl for every SKU of a vendor sharing a manufacturer "model
// number" prefix (e.g. all Setra SKUs starting with "SRCM" get the one
// official Setra photo for the SRCM model). Scoped by vendor as well as
// prefix so a short numeric prefix (e.g. "264") can't accidentally match
// unrelated SKUs from a different vendor.
export const maxDuration = 60;

const bodySchema = z.object({
  vendor: z.string().trim().min(1),
  prefix: z.string().trim().min(1),
  imageUrl: z.string().trim().url(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { vendor, prefix, imageUrl } = parsed.data;

  const updated = await prisma.$executeRaw`
    UPDATE "Product"
    SET "imageUrl" = ${imageUrl}, "updatedAt" = now()
    WHERE vendor = ${vendor} AND sku ILIKE ${prefix + "%"}
  `;

  return NextResponse.json({ updated, vendor, prefix });
}
