import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/crypto";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const commissions = await prisma.commission.findMany({
    where: { status: "UNPAID" },
    orderBy: { staffId: "asc" },
    include: { staff: { include: { payoutProfile: true } } },
  });

  const header = ["Staff Name", "Staff Email", "Payout Method", "Payout Detail", "Amount", "Commission ID"];
  const rows = commissions.map((c) => {
    const profile = c.staff.payoutProfile;
    let detail = "";
    if (profile?.method === "ZELLE" && profile.encryptedZelleContact) detail = decryptPII(profile.encryptedZelleContact);
    if (profile?.method === "VENMO" && profile.encryptedVenmoUsername) detail = decryptPII(profile.encryptedVenmoUsername);
    if (profile?.method === "CHECK" && profile.encryptedCheckAddress) detail = decryptPII(profile.encryptedCheckAddress);

    return [c.staff.name, c.staff.email, profile?.method ?? "NOT SET", detail, c.amount.toString(), c.id];
  });

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="unpaid-commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
