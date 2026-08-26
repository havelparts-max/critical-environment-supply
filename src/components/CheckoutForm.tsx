"use client";

import { useState, type FormEvent } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Button from "@/components/ui/Button";

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
      <div className="rounded-lg bg-success/10 p-4 text-sm text-success">
        Payment submitted for order {orderId}. It will show as paid once confirmed.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ fields: { billingDetails: { address: "never", name: "never" } } }} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing..." : "Charge card"}
      </Button>
    </form>
  );
}
