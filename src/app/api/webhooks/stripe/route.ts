import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handlePaymentSucceeded(paymentIntent.id);
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntentId: string) {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (!order || order.status === "PAID") return; // already processed - webhook retries are idempotent

  if (!order.staffId) {
    // Self-checkout order - no staff to attribute a commission to.
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    return;
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const rate = settings?.commissionRatePercent ?? 10;
  const amount = order.total.mul(rate).div(100);

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    prisma.commission.upsert({
      where: { orderId: order.id },
      update: {},
      create: {
        orderId: order.id,
        staffId: order.staffId,
        rate,
        amount,
      },
    }),
  ]);
}
