import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSellPrice } from "@/lib/pricing";
import { parseInventoryFile } from "@/lib/inventoryImport";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const { rows, errors } = await parseInventoryFile(file);
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, errors }, { status: 400 });
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const defaultMarkup = Number(settings?.defaultMarkupPercent ?? 20);

  let imported = 0;
  for (const row of rows) {
    const markupPercent = row.markupPercent ?? defaultMarkup;
    const price = computeSellPrice(row.cost, markupPercent);
    await prisma.product.upsert({
      where: { sku: row.sku },
      update: {
        name: row.name,
        description: row.description,
        vendor: row.vendor,
        category: row.category,
        baseCost: row.cost,
        markupPercent,
        price,
      },
      create: {
        sku: row.sku,
        name: row.name,
        description: row.description,
        vendor: row.vendor,
        category: row.category,
        baseCost: row.cost,
        markupPercent,
        price,
      },
    });
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
