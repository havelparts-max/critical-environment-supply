import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/orderSchema";
import { createOrderAndPaymentIntent } from "@/lib/checkout";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkRateLimit(`storefront-checkout:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const result = await createOrderAndPaymentIntent(parsed.data, null);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
