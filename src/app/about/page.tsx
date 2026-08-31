import Link from "next/link";
import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Us — Critical Environment Supply",
  description:
    "Critical Environment Supply is an authorized distributor of HVAC and building automation controls, stocking thousands of parts from trusted brands.",
};

const pillars = [
  {
    title: "In-Stock Inventory",
    body: "Thousands of controls, sensors, and HVAC parts kept in stock and ready to ship — no waiting on backorders for the parts you need most.",
  },
  {
    title: "Trusted Brands",
    body: "We're an authorized distributor for the manufacturers your projects already call for, so what you order is exactly what shows up on the job.",
  },
  {
    title: "Simple Ordering",
    body: "Search by part number, name, or vendor, build your order, and check out securely online — no account or phone call required.",
  },
  {
    title: "Real Support",
    body: "Questions about a part or an order? A real person is a phone call or email away, not a support ticket queue.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6">
      <div>
        <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
          &larr; Back to home
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">About Critical Environment Supply</h1>
        <p className="text-base leading-relaxed text-muted">
          Critical Environment Supply is an authorized distributor of HVAC and building automation
          controls, serving contractors, facility teams, and engineers who need the right part on
          time. We carry a deep in-stock catalog of pressure transducers, room monitors, thermostats,
          and controls hardware from the manufacturers you already trust — and we've built our
          ordering process to be as straightforward as the parts themselves.
        </p>
        <p className="text-base leading-relaxed text-muted">
          Whether you're specifying a single sensor for a critical environment or sourcing parts for
          a full retrofit, our goal is the same: make it easy to find what you need, get a fair
          price, and get it shipped without the runaround.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-2 p-6">
            <h2 className="text-lg font-semibold">{pillar.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{pillar.body}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-6 text-center">
        <h2 className="text-lg font-semibold">Get in touch</h2>
        <p className="text-sm text-muted">
          Have a question about a part, an order, or becoming a customer? We're happy to help.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-sm">
          <a
            href="mailto:sales@criticalenvironmentsupply.com"
            className="font-medium text-primary hover:underline"
          >
            sales@criticalenvironmentsupply.com
          </a>
          <a href="tel:+15089058581" className="font-medium text-primary hover:underline">
            (508) 905-8581
          </a>
        </div>
        <div className="pt-2">
          <Link href="/" className={buttonVariants({ size: "md" }) + " px-6 py-3 text-base"}>
            Browse the catalog
          </Link>
        </div>
      </Card>
    </main>
  );
}
