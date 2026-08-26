"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import AddressFields, { type Address, emptyAddress, addressComplete } from "@/components/AddressFields";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  vendor: string | null;
  price: string;
}

interface CartLine {
  product: Product;
  quantity: number;
}

export default function Storefront() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billing, setBilling] = useState<Address>(emptyAddress);
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shipping, setShipping] = useState<Address>(emptyAddress);
  const [checkout, setCheckout] = useState<{ orderId: string; clientSecret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setResults(data.products ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [query]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.product.id !== productId)
        : prev.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    );
  }

  const total = cart.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  async function handleCheckout() {
    setError(null);
    if (cart.length === 0) {
      setError("Add at least one product to your cart.");
      return;
    }
    if (!customerName.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!addressComplete(billing)) {
      setError("Billing address is incomplete.");
      return;
    }
    if (!shippingSameAsBilling && !addressComplete(shipping)) {
      setError("Shipping address is incomplete.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/storefront/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerCompany,
          customerEmail,
          customerPhone,
          billingAddress: billing,
          shippingSameAsBilling,
          shippingAddress: shippingSameAsBilling ? undefined : shipping,
          items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        return;
      }
      setCheckout({ orderId: data.orderId, clientSecret: data.clientSecret });
    } finally {
      setSubmitting(false);
    }
  }

  if (checkout) {
    return (
      <main className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="text-xl font-semibold">Payment</h1>
        <Elements stripe={getStripe()} options={{ clientSecret: checkout.clientSecret }}>
          <CheckoutForm
            orderId={checkout.orderId}
            billingDetails={{
              name: customerCompany || customerName,
              address: {
                line1: billing.line1,
                line2: billing.line2 || undefined,
                city: billing.city,
                state: billing.state,
                postal_code: billing.postalCode,
                country: billing.country,
              },
            }}
          />
        </Elements>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
        <span className="font-semibold">Critical Environment Supply</span>
        <Link href="/sign-in" className="text-sm underline">
          Staff sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Shop HVAC parts</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Browse our catalog and check out securely below.
          </p>
        </div>

        <section>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name, SKU, vendor..."
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <ul className="mt-2 divide-y divide-black/5 dark:divide-white/5">
            {results.map((product) => (
              <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {product.name} <span className="text-black/50 dark:text-white/50">({product.sku})</span>
                </span>
                <span className="flex items-center gap-3">
                  <span>${product.price}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="rounded bg-black px-2 py-1 text-xs font-medium text-white dark:bg-white dark:text-black"
                  >
                    Add
                  </button>
                </span>
              </li>
            ))}
            {results.length === 0 && (
              <li className="py-2 text-sm text-black/60 dark:text-white/60">No products found.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cart</h2>
          {cart.length === 0 && <p className="text-sm text-black/60 dark:text-white/60">No items yet.</p>}
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {cart.map((line) => (
              <li key={line.product.id} className="flex items-center justify-between py-2 text-sm">
                <span>{line.product.name}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                    className="w-16 rounded border border-black/15 bg-transparent px-2 py-1 dark:border-white/20"
                  />
                  <span>${(Number(line.product.price) * line.quantity).toFixed(2)}</span>
                </span>
              </li>
            ))}
          </ul>
          {cart.length > 0 && <p className="mt-2 text-right font-medium">Total: ${total.toFixed(2)}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your info</h2>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <input
            value={customerCompany}
            onChange={(e) => setCustomerCompany(e.target.value)}
            placeholder="Company name (optional)"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Billing address</h2>
          <AddressFields value={billing} onChange={setBilling} prefix="Billing" />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shippingSameAsBilling}
                onChange={(e) => setShippingSameAsBilling(e.target.checked)}
              />
              Same as billing
            </label>
          </div>
          {!shippingSameAsBilling && <AddressFields value={shipping} onChange={setShipping} prefix="Shipping" />}
        </section>

        {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Preparing payment..." : "Continue to payment"}
        </button>
      </main>
    </div>
  );
}
