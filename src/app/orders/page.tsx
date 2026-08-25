import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
        <Link
          href="/orders/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          New order
        </Link>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10">
            <th className="py-1 pr-3">Customer</th>
            <th className="py-1 pr-3">Company</th>
            <th className="py-1 pr-3">Total</th>
            <th className="py-1 pr-3">Status</th>
            <th className="py-1 pr-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-1 pr-3">{order.customerName}</td>
              <td className="py-1 pr-3">{order.customerCompany ?? "-"}</td>
              <td className="py-1 pr-3">${order.total.toString()}</td>
              <td className="py-1 pr-3">{order.status}</td>
              <td className="py-1 pr-3">{order.createdAt.toLocaleString()}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-black/60 dark:text-white/60">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
