"use client";

import { useEffect, useState, type FormEvent } from "react";

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
      <section>
        <h1 className="text-xl font-semibold">Inventory Import</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Upload a CSV or XLSX export (columns: sku, name, description, vendor, category, cost, markupPercent).
          The 20% markup is applied automatically to cost when markupPercent is left blank.
        </p>
        <form onSubmit={handleImport} className="mt-3 flex items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,.xlsx"
            required
            className="text-sm"
          />
          <button
            type="submit"
            disabled={importing}
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </form>
        {importResult && (
          <div className="mt-3 rounded border border-black/10 p-3 text-sm dark:border-white/10">
            <p>Imported {importResult.imported} products.</p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-red-700 dark:text-red-400">
                {importResult.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Add a product manually</h2>
        <form onSubmit={handleAddProduct} className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <input name="sku" placeholder="SKU" required className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="name" placeholder="Name" required className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="vendor" placeholder="Vendor" className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="category" placeholder="Category" className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="cost" type="number" step="0.01" placeholder="Cost" required className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="markupPercent" type="number" step="0.01" placeholder="Markup % (default 20)" className="rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <input name="description" placeholder="Description" className="col-span-2 rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20" />
          <button type="submit" className="col-span-2 rounded bg-black px-3 py-1.5 font-medium text-white dark:bg-white dark:text-black">
            Add product
          </button>
        </form>
        {addError && <p className="mt-2 text-sm text-red-700 dark:text-red-400">{addError}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Catalog ({products.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="py-1 pr-3">SKU</th>
                <th className="py-1 pr-3">Name</th>
                <th className="py-1 pr-3">Vendor</th>
                <th className="py-1 pr-3">Cost</th>
                <th className="py-1 pr-3">Markup</th>
                <th className="py-1 pr-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-1 pr-3">{p.sku}</td>
                  <td className="py-1 pr-3">{p.name}</td>
                  <td className="py-1 pr-3">{p.vendor}</td>
                  <td className="py-1 pr-3">${p.baseCost}</td>
                  <td className="py-1 pr-3">{p.markupPercent}%</td>
                  <td className="py-1 pr-3">${p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
