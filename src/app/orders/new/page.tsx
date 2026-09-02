"use client";

import { useEffect, useState } from "react";
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
  price: string;
}

interface CartLine {
  product: Product;
  quantity: number;
}

export default function NewOrderPage() {
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
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "PURCHASE_ORDER">("CARD");
  const [poNumber, setPoNumber] = useState("");
  const [checkout, setCheckout] = useState<{ orderId: string; clientSecret: string | null } | null>(
    null,
  );
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
      setError("Add at least one product.");
      return;
    }
    if (!customerName.trim()) {
      setError("Customer name is required.");
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
    if (paymentMethod === "PURCHASE_ORDER" && !poNumber.trim()) {
      setError("PO number is required for Purchase Order payment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
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
          paymentMethod,
          poNumber: paymentMethod === "PURCHASE_ORDER" ? poNumber : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data.error));
        return;
      }
      setCheckout({ orderId: data.orderId, clientSecret: data.clientSecret });
    } finally {
      setSubmitting(false);
    }
  }

  if (checkout && !checkout.clientSecret) {
    return (
      <main className="mx-auto max-w-lg space-y-4 p-6">
        <Card className="space-y-2 p-6">
          <h1 className="text-xl font-semibold">Order placed</h1>
          <p className="text-sm text-muted">
            Order {checkout.orderId} was placed on Purchase Order{poNumber ? ` #${poNumber}` : ""}. No
            payment was collected — it will show as <span className="font-medium">Invoiced</span> in
            Your Orders until it's paid per the PO terms.
          </p>
          <div className="pt-2">
            <Button onClick={() => (window.location.href = "/orders")}>Back to your orders</Button>
          </div>
        </Card>
      </main>
    );
  }

  if (checkout && checkout.clientSecret) {
    const effectiveBilling = billing;
    return (
      <main className="mx-auto max-w-lg space-y-4 p-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Payment</h1>
          <div className="mt-4">
            <Elements stripe={getStripe()} options={{ clientSecret: checkout.clientSecret }}>
              <CheckoutForm
                orderId={checkout.orderId}
                billingDetails={{
                  name: customerCompany || customerName,
                  address: {
                    line1: effectiveBilling.line1,
                    line2: effectiveBilling.line2 || undefined,
                    city: effectiveBilling.city,
                    state: effectiveBilling.state,
                    postal_code: effectiveBilling.postalCode,
                    country: effectiveBilling.country,
                  },
                }}
              />
            </Elements>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">New order</h1>

      <Card className="p-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name, SKU, vendor..."
        />
        <ul className="mt-2 divide-y divide-border">
          {results.map((product) => (
            <li key={product.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {product.name} <span className="text-muted">({product.sku})</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-medium">${product.price}</span>
                <Button size="sm" onClick={() => addToCart(product)}>
                  Add
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Cart</h2>
        {cart.length === 0 && <p className="mt-2 text-sm text-muted">No items yet.</p>}
        <ul className="mt-2 divide-y divide-border">
          {cart.map((line) => (
            <li key={line.product.id} className="flex items-center justify-between py-2 text-sm">
              <span>{line.product.name}</span>
              <span className="flex items-center gap-2">
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
        {cart.length > 0 && (
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        )}
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold">Customer</h2>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
          <Input
            value={customerCompany}
            onChange={(e) => setCustomerCompany(e.target.value)}
            placeholder="Company name (optional)"
          />
          <Input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Customer email (optional)"
          />
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Customer phone (optional)"
          />
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold">Billing address</h2>
          <AddressFields value={billing} onChange={setBilling} prefix="Billing" />
        </Card>
      </div>

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

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Payment method</h2>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={paymentMethod === "CARD"}
              onChange={() => setPaymentMethod("CARD")}
              className="accent-primary"
            />
            Credit card
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value="PURCHASE_ORDER"
              checked={paymentMethod === "PURCHASE_ORDER"}
              onChange={() => setPaymentMethod("PURCHASE_ORDER")}
              className="accent-primary"
            />
            Purchase Order
          </label>
        </div>
        {paymentMethod === "PURCHASE_ORDER" && (
          <Input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="PO number"
          />
        )}
      </Card>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleCheckout} disabled={submitting} className="px-6 py-3 text-base">
          {submitting
            ? "Placing order..."
            : paymentMethod === "PURCHASE_ORDER"
              ? "Place order on PO"
              : "Continue to payment"}
        </Button>
      </div>
    </main>
  );
}
