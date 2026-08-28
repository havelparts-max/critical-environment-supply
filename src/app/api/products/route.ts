import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Escape LIKE/ILIKE wildcards in user input so a literal "%" or "_" in a search
// doesn't act as a pattern instead of a plain character.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      take: 100,
    });
    return NextResponse.json({ products });
  }

  // Many SKUs are hyphenated (e.g. "MSX-U21-IN-NIST"), but customers often type
  // them without the hyphens. Compare hyphen-stripped versions on both sides so
  // "MSXU21IN" still matches "MSX-U21-IN".
  const pattern = `%${escapeLike(q.replace(/-/g, ""))}%`;

  const products = await prisma.$queryRaw<
    Array<{
      id: string;
      sku: string;
      name: string;
      description: string | null;
      vendor: string | null;
      price: string;
    }>
  >`
    SELECT id, sku, name, description, vendor, price
    FROM "Product"
    WHERE active = true
      AND (
        REPLACE(name, '-', '') ILIKE ${pattern} ESCAPE '\\' OR
        REPLACE(sku, '-', '') ILIKE ${pattern} ESCAPE '\\' OR
        REPLACE(vendor, '-', '') ILIKE ${pattern} ESCAPE '\\' OR
        REPLACE(category, '-', '') ILIKE ${pattern} ESCAPE '\\'
      )
    ORDER BY name ASC
    LIMIT 100
  `;

  return NextResponse.json({ products });
}
