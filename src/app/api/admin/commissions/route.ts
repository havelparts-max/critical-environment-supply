import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/crypto";

export async function GET() {
  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      staff: { include: { payoutProfile: true } },
      order: true,
    },
  });

  const result = commissions.map((c) => ({
    id: c.id,
    staffName: c.staff.name,
    staffEmail: c.staff.email,
    orderCustomer: c.order.customerName,
    rate: c.rate,
    amount: c.amount,
    status: c.status,
    createdAt: c.createdAt,
    paidAt: c.paidAt,
    payoutMethod: c.staff.payoutProfile?.method ?? null,
    payoutDetail: c.staff.payoutProfile
      ? decryptPayoutDetail(c.staff.payoutProfile)
      : null,
  }));

  return NextResponse.json({ commissions: result });
}

function decryptPayoutDetail(profile: {
  method: string;
  encryptedZelleContact: string | null;
  encryptedVenmoUsername: string | null;
  encryptedCheckAddress: string | null;
}): string | null {
  if (profile.method === "ZELLE" && profile.encryptedZelleContact) {
    return decryptPII(profile.encryptedZelleContact);
  }
  if (profile.method === "VENMO" && profile.encryptedVenmoUsername) {
    return decryptPII(profile.encryptedVenmoUsername);
  }
  if (profile.method === "CHECK" && profile.encryptedCheckAddress) {
    return decryptPII(profile.encryptedCheckAddress);
  }
  return null;
}
