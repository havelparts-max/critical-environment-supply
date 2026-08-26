"use client";

import { Fragment, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{order.customerName}</td>
                    <td className="px-4 py-2">{order.customerCompany ?? "-"}</td>
                    <td className="px-4 py-2">{order.staffName}</td>
                    <td className="px-4 py-2 font-medium">${order.total}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2 text-muted">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      >
                        {expanded === order.id ? "Hide" : "Details"}
                      </Button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr className="border-b border-border bg-muted-bg last:border-0">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6 text-xs">
                          <div>
                            <p className="font-medium text-foreground">Contact</p>
                            <p className="text-muted">{order.customerEmail ?? "No email"}</p>
                            <p className="text-muted">{order.customerPhone ?? "No phone"}</p>
                            <p className="mt-2 font-medium text-foreground">Ship to</p>
                            <p className="text-muted">{order.shippingLine1}</p>
                            {order.shippingLine2 && <p className="text-muted">{order.shippingLine2}</p>}
                            <p className="text-muted">
                              {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                            </p>
                            <p className="text-muted">{order.shippingCountry}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Items</p>
                            <ul className="text-muted">
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
                  <td colSpan={7} className="px-4 py-6 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
