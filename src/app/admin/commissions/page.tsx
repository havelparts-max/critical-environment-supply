"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button, { buttonVariants } from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

interface CommissionRow {
  id: string;
  staffName: string;
  staffEmail: string;
  orderCustomer: string;
  rate: string;
  amount: string;
  status: "UNPAID" | "PAID";
  payoutMethod: string | null;
  payoutDetail: string | null;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await fetch("/api/admin/commissions");
    const data = await res.json();
    setCommissions(data.commissions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/admin/commissions")
      .then((res) => res.json())
      .then((data) => {
        setCommissions(data.commissions ?? []);
        setLoading(false);
      });
  }, []);

  async function markPaid(id: string) {
    await fetch(`/api/admin/commissions/${id}`, { method: "PATCH" });
    await refresh();
  }

  if (loading) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Commission payouts</h1>
        <Link href="/api/admin/commissions/export" className={buttonVariants({ size: "sm" })}>
          Export unpaid (CSV)
        </Link>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-2 font-medium">Staff</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Rate</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Payout method</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  {c.staffName} <span className="text-muted">({c.staffEmail})</span>
                </td>
                <td className="px-4 py-2">{c.orderCustomer}</td>
                <td className="px-4 py-2">{c.rate}%</td>
                <td className="px-4 py-2 font-medium">${c.amount}</td>
                <td className="px-4 py-2">
                  {c.payoutMethod ?? "Not set"}
                  {c.payoutDetail ? ` - ${c.payoutDetail}` : ""}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-2">
                  {c.status === "UNPAID" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid(c.id)}>
                      Mark paid
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  No commissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
