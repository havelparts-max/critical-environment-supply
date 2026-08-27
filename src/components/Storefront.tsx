"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripeClient";
import CheckoutForm from "@/components/CheckoutForm";
import AddressFields, { type Address, emptyAddress, addressComplete } from "@/components/AddressFields";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-primary">
      <path
        d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 8.5 12 13l8-4.5M12 13v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
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
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

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

  const ContactBanner = (
    <div className="bg-muted-bg px-6 py-2 text-center text-xs text-muted">
      For questions about products, or to sign up as a sales rep, please email:{" "}
      <a href="mailto:sales@criticalenvironmentsupply.com" className="font-medium text-primary hover:underline">
        sales@criticalenvironmentsupply.com
      </a>
    </div>
  );

  const Header = (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">Critical Environment Supply</span>
        <Link href="/sign-in" className="text-sm text-muted transition-colors hover:text-foreground">
          Staff sign in
        </Link>
      </div>
    </header>
  );

  if (checkout) {
    return (
      <div className="min-h-full">
        {Header}
        <main className="mx-auto max-w-lg space-y-4 p-6">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">Payment</h1>
            <p className="mt-1 text-sm text-muted">Order total: ${total.toFixed(2)}</p>
            <div className="mt-4">
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
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {ContactBanner}
      {Header}

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">HVAC parts & controls, in stock</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Browse our full catalog and check out securely — no account required.
          </p>
          <div className="mx-auto mt-6 max-w-lg">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, or vendor..."
              className="py-2.5 shadow-sm"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-10 p-6">
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => (
              <Card key={product.id} className="flex flex-col p-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ProductIcon />
                </div>
                <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
                <p className="mt-1 text-xs text-muted">
                  {product.vendor ? `${product.vendor} · ` : ""}
                  {product.sku}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">${product.price}</span>
                  <Button size="sm" onClick={() => addToCart(product)}>
                    Add
                  </Button>
                </div>
              </Card>
            ))}
            {results.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted">No products found.</p>
            )}
          </div>
        </section>

        <section id="cart">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cart</h2>
              {itemCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No items yet — add something from the catalog above.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {cart.map((line) => (
                  <li key={line.product.id} className="flex items-center justify-between py-3 text-sm">
                    <span>{line.product.name}</span>
                    <span className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="w-20 text-right font-medium">
                        ${(Number(line.product.price) * line.quantity).toFixed(2)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            )}
          </Card>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">Your info</h2>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
            <Input
              value={customerCompany}
              onChange={(e) => setCustomerCompany(e.target.value)}
              placeholder="Company name (optional)"
            />
            <Input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email"
              type="email"
            />
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
            />
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">Billing address</h2>
            <AddressFields value={billing} onChange={setBilling} prefix="Billing" />
          </Card>
        </section>

        <section>
          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shipping address</h2>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={shippingSameAsBilling}
                  onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                  className="accent-primary"
                />
                Same as billing
              </label>
            </div>
            {!shippingSameAsBilling && <AddressFields value={shipping} onChange={setShipping} prefix="Shipping" />}
          </Card>
        </section>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end">
          <Button size="md" onClick={handleCheckout} disabled={submitting} className="px-6 py-3 text-base">
            {submitting ? "Preparing payment..." : `Continue to payment${cart.length ? ` · $${total.toFixed(2)}` : ""}`}
          </Button>
        </div>
      </main>
    </div>
  );
}
