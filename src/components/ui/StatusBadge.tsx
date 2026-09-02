const styles: Record<string, string> = {
  PAID: "bg-success/10 text-success",
  INVOICED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  UNPAID: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  FAILED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted-bg text-muted",
  ACTIVE: "bg-success/10 text-success",
  DEACTIVATED: "bg-muted-bg text-muted",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-muted-bg text-muted"
      }`}
    >
      {status}
    </span>
  );
}
