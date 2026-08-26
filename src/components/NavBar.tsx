import Link from "next/link";
import { auth, signOut } from "@/auth";
import { buttonVariants } from "@/components/ui/Button";

export default async function NavBar() {
  const session = await auth();
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";

  const linkClasses =
    "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-muted-bg hover:text-foreground";

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-1">
          <Link href="/orders" className="mr-3 text-sm font-semibold tracking-tight">
            Critical Environment Supply
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/orders" className={linkClasses}>
              Orders
            </Link>
            <Link href="/account/payout" className={linkClasses}>
              Payout Info
            </Link>
            {isAdmin && (
              <Link href="/admin/orders" className={linkClasses}>
                All Orders
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/inventory" className={linkClasses}>
                Inventory
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/commissions" className={linkClasses}>
                Commissions
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/staff" className={linkClasses}>
                Staff
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            {session.user.name} <span className="text-xs">({session.user.role})</span>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
