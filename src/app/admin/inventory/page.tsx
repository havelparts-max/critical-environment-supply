"use client";

import { useEffect, useState, type FormEvent } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.[0]) return;

    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.set("file", fileInput.files[0]);
    try {
      const res = await fetch("/api/admin/products/import", { method: "POST", body: formData });
      const data = await res.json();
      setImportResult(data);
      await refresh();
      form.reset();
    } finally {
      setImporting(false);
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
          <h2 className="text-lg font-semibold">Catalog ({products.length})</h2>
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
