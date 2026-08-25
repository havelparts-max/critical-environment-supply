import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptPII, decryptPII } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.staffPayoutProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      method: profile.method,
      zelleContact: profile.encryptedZelleContact ? decryptPII(profile.encryptedZelleContact) : null,
      venmoUsername: profile.encryptedVenmoUsername ? decryptPII(profile.encryptedVenmoUsername) : null,
      checkAddress: profile.encryptedCheckAddress ? decryptPII(profile.encryptedCheckAddress) : null,
    },
  });
}

const payoutSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("ZELLE"), zelleContact: z.string().trim().min(1) }),
  z.object({ method: z.literal("VENMO"), venmoUsername: z.string().trim().min(1) }),
  z.object({ method: z.literal("CHECK"), checkAddress: z.string().trim().min(1) }),
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  await prisma.staffPayoutProfile.upsert({
    where: { userId: session.user.id },
    update: {
      method: data.method,
      encryptedZelleContact: data.method === "ZELLE" ? encryptPII(data.zelleContact) : null,
      encryptedVenmoUsername: data.method === "VENMO" ? encryptPII(data.venmoUsername) : null,
      encryptedCheckAddress: data.method === "CHECK" ? encryptPII(data.checkAddress) : null,
    },
    create: {
      userId: session.user.id,
      method: data.method,
      encryptedZelleContact: data.method === "ZELLE" ? encryptPII(data.zelleContact) : null,
      encryptedVenmoUsername: data.method === "VENMO" ? encryptPII(data.venmoUsername) : null,
      encryptedCheckAddress: data.method === "CHECK" ? encryptPII(data.checkAddress) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
