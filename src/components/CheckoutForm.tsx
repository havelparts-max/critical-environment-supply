"use client";

import { useState, type FormEvent } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export interface BillingDetails {
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function CheckoutForm({
  orderId,
  billingDetails,
}: {
  orderId: string;
  billingDetails: BillingDetails;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
        payment_method_data: { billing_details: billingDetails },
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    setSucceeded(true);
    setSubmitting(false);
  }

  if (succeeded) {
    return (
      <div className="rounded border border-green-600/30 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
        Payment submitted for order {orderId}. It will show as paid once confirmed.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ fields: { billingDetails: { address: "never", name: "never" } } }} />
      {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {submitting ? "Processing..." : "Charge card"}
      </button>
    </form>
  );
}
