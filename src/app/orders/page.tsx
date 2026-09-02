import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function OrdersPage() {
  const session = await auth();
  const orders = session
    ? await prisma.order.findMany({
        where: { staffId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your orders</h1>
        <Link href="/orders/new" className={buttonVariants()}>
          New order
        </Link>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Payment</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{order.customerName}</td>
                <td className="px-4 py-2">{order.customerCompany ?? "-"}</td>
                <td className="px-4 py-2 font-medium">${order.total.toString()}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-2">
                  {order.paymentMethod === "PURCHASE_ORDER" ? `PO #${order.poNumber}` : "Card"}
                </td>
                <td className="px-4 py-2 text-muted">{order.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
