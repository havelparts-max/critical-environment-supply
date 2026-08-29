import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Summarizes a vendor's SKUs by a fixed-length prefix (the manufacturer's
// "model number"), so an admin can see how many distinct models exist and how
// many SKUs under each still need a photo before doing a bulk image backfill
// keyed by prefix (see set-image-by-prefix).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendor = searchParams.get("vendor");
  const prefixLen = Number(searchParams.get("prefixLen") ?? "3");

  if (!vendor) {
    return NextResponse.json({ error: "vendor is required" }, { status: 400 });
  }

  const rows = await prisma.$queryRaw<Array<{ prefix: string; total: bigint; missing_image: bigint }>>`
    SELECT
      upper(substring(sku, 1, ${prefixLen})) AS prefix,
      count(*) AS total,
      count(*) FILTER (WHERE "imageUrl" IS NULL) AS missing_image
    FROM "Product"
    WHERE vendor = ${vendor}
    GROUP BY 1
    ORDER BY total DESC
  `;

  return NextResponse.json({
    prefixes: rows.map((r) => ({
      prefix: r.prefix,
      total: Number(r.total),
      missingImage: Number(r.missing_image),
    })),
  });
}
