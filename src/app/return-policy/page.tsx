import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Return Policy — Critical Environment Supply",
  description: "Our return policy: 30 days to return, 20% restocking fee.",
};

export default function ReturnPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
          &larr; Back to home
        </Link>
      </div>

      <Card className="space-y-4 p-6 text-sm leading-relaxed">
        <h1 className="text-xl font-semibold">Return Policy</h1>

        <p>
          We want you to be happy with your purchase. If something isn&apos;t right, you may return
          most items within <strong>30 days</strong> of delivery for a refund, subject to the terms
          below.
        </p>

        <div>
          <h2 className="font-medium text-foreground">Eligibility</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
            <li>Returns must be requested within 30 days of the delivery date.</li>
            <li>Items must be unused, in their original condition, and in the original packaging.</li>
            <li>Proof of purchase (order number or receipt) is required.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-medium text-foreground">Restocking Fee</h2>
          <p className="mt-1 text-muted">
            A <strong>20% restocking fee</strong> applies to all eligible returns and will be
            deducted from your refund. Original shipping charges are non-refundable, and return
            shipping is the customer&apos;s responsibility unless the return is due to our error
            (e.g., an incorrect or defective item).
          </p>
        </div>

        <div>
          <h2 className="font-medium text-foreground">Non-Returnable Items</h2>
          <p className="mt-1 text-muted">
            Special-order, custom-configured, or clearance items are not eligible for return
            unless defective.
          </p>
        </div>

        <div>
          <h2 className="font-medium text-foreground">How to Start a Return</h2>
          <p className="mt-1 text-muted">
            Contact us at{" "}
            <a href="mailto:sales@criticalenvironmentsupply.com" className="text-primary hover:underline">
              sales@criticalenvironmentsupply.com
            </a>{" "}
            with your order number to request a return authorization before sending an item back.
            Refunds are issued to the original payment method once the returned item is received
            and inspected.
          </p>
        </div>

        <p className="text-xs text-muted">
          This policy is provided as a general guideline and may be updated at any time. Contact
          us with any questions about a specific order.
        </p>
      </Card>
    </main>
  );
}
