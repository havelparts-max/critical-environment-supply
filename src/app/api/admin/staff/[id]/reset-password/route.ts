import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePassword } from "@/lib/password";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user, password });
}
