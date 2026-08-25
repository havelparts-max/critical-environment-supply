import Papa from "papaparse";
import ExcelJS from "exceljs";
import { z } from "zod";
import { optionalTrimmedString, optionalNumber } from "@/lib/zodHelpers";

const rowSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: optionalTrimmedString,
  vendor: optionalTrimmedString,
  category: optionalTrimmedString,
  cost: z.coerce.number().positive(),
  markupPercent: optionalNumber,
});

export type ImportedProductRow = z.infer<typeof rowSchema>;

export interface ImportResult {
  rows: ImportedProductRow[];
  errors: { row: number; message: string }[];
}

const HEADER_ALIASES: Record<string, keyof ImportedProductRow> = {
  sku: "sku",
  name: "name",
  description: "description",
  vendor: "vendor",
  manufacturer: "vendor",
  category: "category",
  cost: "cost",
  basecost: "cost",
  price: "cost",
  markup: "markupPercent",
  markuppercent: "markupPercent",
};

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const alias = HEADER_ALIASES[key.trim().toLowerCase().replace(/[\s_-]/g, "")];
    if (alias) normalized[alias] = value;
  }
  return normalized;
}

function toRows(rawRows: Record<string, unknown>[]): ImportResult {
  const rows: ImportedProductRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rawRows.forEach((raw, index) => {
    const normalized = normalizeRow(raw);
    const parsed = rowSchema.safeParse(normalized);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push({
        row: index + 2, // +1 for header row, +1 for 1-indexing
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    }
  });

  return { rows, errors };
}

export async function parseCsv(file: File): Promise<ImportResult> {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return toRows(data);
}

export async function parseXlsx(file: File): Promise<ImportResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  // exceljs's own ambient `Buffer` shim conflicts with newer @types/node Buffer members (unrelated to runtime behavior).
  // @ts-expect-error - see above
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { rows: [], errors: [] };

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "");
  });

  const rawRows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const raw: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) raw[header] = cell.value;
    });
    rawRows.push(raw);
  });

  return toRows(rawRows);
}

export async function parseInventoryFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return parseXlsx(file);
  return parseCsv(file);
}
