import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      <ul className="space-y-2 text-sm underline">
        <li>
          <Link href="/admin/orders">All orders</Link>
        </li>
        <li>
          <Link href="/admin/inventory">Inventory import & catalog</Link>
        </li>
        <li>
          <Link href="/admin/commissions">Commission payouts</Link>
        </li>
        <li>
          <Link href="/admin/staff">Staff accounts</Link>
        </li>
      </ul>
    </main>
  );
}
