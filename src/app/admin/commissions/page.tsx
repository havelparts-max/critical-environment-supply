"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
        <Link
          href="/api/admin/commissions/export"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Export unpaid (CSV)
        </Link>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10">
            <th className="py-1 pr-3">Staff</th>
            <th className="py-1 pr-3">Order</th>
            <th className="py-1 pr-3">Rate</th>
            <th className="py-1 pr-3">Amount</th>
            <th className="py-1 pr-3">Payout method</th>
            <th className="py-1 pr-3">Status</th>
            <th className="py-1 pr-3" />
          </tr>
        </thead>
        <tbody>
          {commissions.map((c) => (
            <tr key={c.id} className="border-b border-black/5 dark:border-white/5">
              <td className="py-1 pr-3">
                {c.staffName} <span className="text-black/50 dark:text-white/50">({c.staffEmail})</span>
              </td>
              <td className="py-1 pr-3">{c.orderCustomer}</td>
              <td className="py-1 pr-3">{c.rate}%</td>
              <td className="py-1 pr-3">${c.amount}</td>
              <td className="py-1 pr-3">
                {c.payoutMethod ?? "Not set"}
                {c.payoutDetail ? ` - ${c.payoutDetail}` : ""}
              </td>
              <td className="py-1 pr-3">{c.status}</td>
              <td className="py-1 pr-3">
                {c.status === "UNPAID" && (
                  <button
                    onClick={() => markPaid(c.id)}
                    className="rounded bg-black px-2 py-1 text-xs font-medium text-white dark:bg-white dark:text-black"
                  >
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
          {commissions.length === 0 && (
            <tr>
              <td colSpan={7} className="py-3 text-black/60 dark:text-white/60">
                No commissions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
