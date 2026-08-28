"use client";

import { useEffect, useState, type FormEvent } from "react";
import Papa from "papaparse";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Matches the server's MAX_BATCH_ROWS in api/admin/products/import/route.ts, so a
// normal client-driven import maps to exactly one bulk upsert per request.
const IMPORT_BATCH_SIZE = 5000;

interface ImportBatchResult {
  imported?: number;
  errors?: { row: number; message: string }[];
  error?: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  vendor: string | null;
  category: string | null;
  baseCost: string;
  markupPercent: string;
  price: string;
  active: boolean;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []));
  }, []);

  async function postBatch(rows: Record<string, unknown>[]): Promise<ImportBatchResult> {
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    return res.json();
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportProgress(null);

    try {
      // CSV is parsed here and uploaded in batches — large imports (thousands of
      // rows, e.g. a full configurator export) would otherwise exceed the
      // hosting platform's request body size limit in one shot, or time out
      // doing one database round trip per row.
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const { data } = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });

        let imported = 0;
        const errors: { row: number; message: string }[] = [];
        const totalBatches = Math.max(1, Math.ceil(data.length / IMPORT_BATCH_SIZE));

        for (let i = 0; i < data.length; i += IMPORT_BATCH_SIZE) {
          const batchNumber = i / IMPORT_BATCH_SIZE + 1;
          setImportProgress(`Importing rows ${i + 1}-${Math.min(i + IMPORT_BATCH_SIZE, data.length)} of ${data.length} (batch ${batchNumber}/${totalBatches})...`);
          const batch = data.slice(i, i + IMPORT_BATCH_SIZE);
          const result = await postBatch(batch);
          if (result.error) {
            errors.push({ row: i + 2, message: result.error });
            continue;
          }
          imported += result.imported ?? 0;
          for (const e of result.errors ?? []) {
            errors.push({ row: e.row + i, message: e.message });
          }
        }

        setImportResult({ imported, errors });
      } else {
        // .xlsx: uploaded whole. Fine for smaller workbooks; for very large
        // catalogs, export as .csv instead so it can be batched.
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch("/api/admin/products/import", { method: "POST", body: formData });
        const data = await res.json();
        setImportResult(data);
      }
      await refresh();
      form.reset();
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  async function handleAddProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setAddError(JSON.stringify(data.error));
      return;
    }

    form.reset();
    await refresh();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Inventory Import</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a CSV or XLSX export (columns: sku, name, description, vendor, category, cost, markupPercent).
          The 20% markup is applied automatically to cost when markupPercent is left blank.
        </p>
        <form onSubmit={handleImport} className="mt-3 flex items-center gap-3">
          <input type="file" name="file" accept=".csv,.xlsx" required className="text-sm text-muted" />
          <Button type="submit" size="sm" disabled={importing}>
            {importing ? "Importing..." : "Import"}
          </Button>
        </form>
        {importProgress && <p className="mt-3 text-sm text-muted">{importProgress}</p>}
        {importResult && (
          <div className="mt-3 rounded-lg border border-border bg-muted-bg p-3 text-sm">
            <p>Imported {importResult.imported} products.</p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-destructive">
                {importResult.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Add a product manually</h2>
        <form onSubmit={handleAddProduct} className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Input name="sku" placeholder="SKU" required />
          <Input name="name" placeholder="Name" required />
          <Input name="vendor" placeholder="Vendor" />
          <Input name="category" placeholder="Category" />
          <Input name="cost" type="number" step="0.01" placeholder="Cost" required />
          <Input name="markupPercent" type="number" step="0.01" placeholder="Markup % (default 20)" />
          <Input name="description" placeholder="Description" className="col-span-2" />
          <Button type="submit" className="col-span-2">
            Add product
          </Button>
        </form>
        {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-6 pb-4">
          <h2 className="text-lg font-semibold">Catalog (showing {products.length} most recent)</h2>
        </div>
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-muted">
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium">Cost</th>
                <th className="px-4 py-2 font-medium">Markup</th>
                <th className="px-4 py-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-muted">{p.sku}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.vendor}</td>
                  <td className="px-4 py-2">${p.baseCost}</td>
                  <td className="px-4 py-2">{p.markupPercent}%</td>
                  <td className="px-4 py-2 font-medium">${p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
