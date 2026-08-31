import Link from "next/link";
import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

// Dedicated order-confirmation page. Only ever loads after a completed
// checkout (the storefront redirects here once Stripe confirms payment), so
// its URL doubles as a simple, reliable conversion-tracking destination for
// Google Ads / Analytics ("record a conversion when this exact page loads") —
// no extra tracking code needed on our end.
export const metadata: Metadata = {
  title: "Thank you for your order — Critical Environment Supply",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({ searchParams }: PageProps<"/thank-you">) {
  const { order } = await searchParams;
  const orderId = Array.isArray(order) ? order[0] : order;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <Card className="space-y-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Thank you for your order!</h1>
        <p className="text-sm text-muted">
          {orderId
            ? `Your order (#${orderId}) has been received and is being processed.`
            : "Your order has been received and is being processed."}
        </p>
        <p className="text-sm text-muted">A confirmation will be sent to your email shortly.</p>
        <div className="pt-2">
          <Link href="/" className={buttonVariants({ size: "md" }) + " px-6 py-3 text-base"}>
            Continue shopping
          </Link>
        </div>
      </Card>
    </main>
  );
}
