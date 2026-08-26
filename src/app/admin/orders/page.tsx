"use client";

import { Fragment, useEffect, useState } from "react";

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  lineTotal: string;
}

interface Order {
  id: string;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  staffName: string;
  status: string;
  total: string;
  createdAt: string;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []));
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">All orders</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="py-1 pr-3">Customer</th>
              <th className="py-1 pr-3">Company</th>
              <th className="py-1 pr-3">Source</th>
              <th className="py-1 pr-3">Total</th>
              <th className="py-1 pr-3">Status</th>
              <th className="py-1 pr-3">Date</th>
              <th className="py-1 pr-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <td className="py-1 pr-3">{order.customerName}</td>
                  <td className="py-1 pr-3">{order.customerCompany ?? "-"}</td>
                  <td className="py-1 pr-3">{order.staffName}</td>
                  <td className="py-1 pr-3">${order.total}</td>
                  <td className="py-1 pr-3">{order.status}</td>
                  <td className="py-1 pr-3">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="py-1 pr-3">
                    <button
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      className="text-xs underline"
                    >
                      {expanded === order.id ? "Hide" : "Details"}
                    </button>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                    <td colSpan={7} className="py-3 pr-3">
                      <div className="grid grid-cols-2 gap-6 text-xs">
                        <div>
                          <p className="font-medium">Contact</p>
                          <p>{order.customerEmail ?? "No email"}</p>
                          <p>{order.customerPhone ?? "No phone"}</p>
                          <p className="mt-2 font-medium">Ship to</p>
                          <p>{order.shippingLine1}</p>
                          {order.shippingLine2 && <p>{order.shippingLine2}</p>}
                          <p>
                            {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                          </p>
                          <p>{order.shippingCountry}</p>
                        </div>
                        <div>
                          <p className="font-medium">Items</p>
                          <ul>
                            {order.items.map((item) => (
                              <li key={item.sku}>
                                {item.quantity}x {item.name} ({item.sku}) - ${item.lineTotal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-3 text-black/60 dark:text-white/60">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
