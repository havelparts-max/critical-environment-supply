import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { computeSellPrice } from "@/lib/pricing";
import { parseInventoryFile, toRows, type ImportedProductRow, type ImportResult } from "@/lib/inventoryImport";

// Bulk imports (e.g. thousands of configurator-generated SKUs) are sent as several
// smaller JSON batches from the client rather than one large file upload, since
// hosting platforms cap request body size well below what a full catalog export
// needs. Each batch is still written in a single round trip via one multi-row
// upsert statement, so even a large batch completes in well under a second.
export const maxDuration = 60;

// Comfortably under Postgres's ~65535 bound-parameter limit per statement
// (9 params/row here) and under typical request body size limits.
const MAX_BATCH_ROWS = 5000;

async function bulkUpsertProducts(rows: ImportedProductRow[], defaultMarkup: number) {
  if (rows.length === 0) return;

  const valueRows = rows.map((row) => {
    const markupPercent = row.markupPercent ?? defaultMarkup;
    const price = computeSellPrice(row.cost, markupPercent);
    return Prisma.sql`(
      ${randomUUID()},
      ${row.sku},
      ${row.name},
      ${row.description ?? null},
      ${row.vendor ?? null},
      ${row.category ?? null},
      ${row.cost.toString()},
      ${markupPercent.toString()},
      ${price.toString()},
      now()
    )`;
  });

  await prisma.$executeRaw`
    INSERT INTO "Product" (id, sku, name, description, vendor, category, "baseCost", "markupPercent", price, "updatedAt")
    VALUES ${Prisma.join(valueRows)}
    ON CONFLICT (sku) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      vendor = EXCLUDED.vendor,
      category = EXCLUDED.category,
      "baseCost" = EXCLUDED."baseCost",
      "markupPercent" = EXCLUDED."markupPercent",
      price = EXCLUDED.price,
      "updatedAt" = EXCLUDED."updatedAt"
  `;
}

async function importRows(rows: ImportedProductRow[], errors: ImportResult["errors"]) {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const defaultMarkup = Number(settings?.defaultMarkupPercent ?? 20);

  let imported = 0;
  for (let i = 0; i < rows.length; i += MAX_BATCH_ROWS) {
    const chunk = rows.slice(i, i + MAX_BATCH_ROWS);
    await bulkUpsertProducts(chunk, defaultMarkup);
    imported += chunk.length;
  }

  return NextResponse.json({ imported, errors });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  // Batch path: client has already parsed a chunk of the file into row objects
  // (used for large imports split into several requests to stay under body-size limits).
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const rawRows = Array.isArray(body?.rows) ? body.rows : null;
    if (!rawRows) {
      return NextResponse.json({ error: "Expected { rows: [...] }" }, { status: 400 });
    }
    const { rows, errors } = toRows(rawRows);
    if (rows.length === 0) {
      return NextResponse.json({ imported: 0, errors }, { status: 400 });
    }
    return importRows(rows, errors);
  }

  // Whole-file path: small enough imports can still be uploaded in one shot.
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const { rows, errors } = await parseInventoryFile(file);
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, errors }, { status: 400 });
  }

  return importRows(rows, errors);
}
