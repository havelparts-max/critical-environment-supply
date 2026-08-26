import Link from "next/link";
import Card from "@/components/ui/Card";

const links = [
  { href: "/admin/orders", label: "All orders", description: "View and fulfill every order, staff and online" },
  { href: "/admin/inventory", label: "Inventory", description: "Import products and manage the catalog" },
  { href: "/admin/commissions", label: "Commission payouts", description: "Review and mark commissions paid" },
  { href: "/admin/staff", label: "Staff accounts", description: "Create, deactivate, and manage staff logins" },
];

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <p className="font-medium">{link.label}</p>
              <p className="mt-1 text-sm text-muted">{link.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
