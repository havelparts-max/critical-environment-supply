"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  successRedirectPath,
}: {
  orderId: string;
  billingDetails: BillingDetails;
  /**
   * Where to send the customer after a confirmed payment (e.g. a
   * "/thank-you" order-confirmation page for conversion tracking). When
   * omitted, falls back to showing an inline success message in place —
   * used by the staff order-entry flow, which has no separate confirmation
   * page to send someone to.
   */
  successRedirectPath?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = successRedirectPath
      ? `${window.location.origin}${successRedirectPath}`
      : `${window.location.origin}/orders`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: { billing_details: billingDetails },
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    // Card payments that don't require a redirect (the common case) land
    // here instead of following return_url, so send the customer on
    // manually once we know the payment succeeded.
    if (successRedirectPath) {
      router.push(returnUrl.replace(window.location.origin, ""));
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
