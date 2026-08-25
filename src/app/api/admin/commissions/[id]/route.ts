import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const commission = await prisma.commission.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });

  return NextResponse.json({ commission });
}
