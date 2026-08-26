import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function NavBar() {
  const session = await auth();
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
      <nav className="flex gap-4 text-sm">
        <Link href="/orders">Orders</Link>
        <Link href="/account/payout">Payout Info</Link>
        {isAdmin && <Link href="/admin/orders">All Orders</Link>}
        {isAdmin && <Link href="/admin/inventory">Inventory</Link>}
        {isAdmin && <Link href="/admin/commissions">Commissions</Link>}
        {isAdmin && <Link href="/admin/staff">Staff</Link>}
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span>
          {session.user.name} ({session.user.role})
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button type="submit" className="underline">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
