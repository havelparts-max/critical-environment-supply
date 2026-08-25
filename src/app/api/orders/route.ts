import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@/generated/prisma/client";
import { optionalTrimmedString } from "@/lib/zodHelpers";

const addressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: optionalTrimmedString,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().length(2).default("US"),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { staffId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return NextResponse.json({ orders });
}

const createOrderSchema = z.object({
  customerName: z.string().trim().min(1),
  customerCompany: optionalTrimmedString,
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().optional(),
  billingAddress: addressSchema,
  shippingSameAsBilling: z.boolean(),
  shippingAddress: addressSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
}).refine((data) => data.shippingSameAsBilling || data.shippingAddress, {
  message: "Shipping address is required when it differs from billing",
  path: ["shippingAddress"],
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  if (products.length !== new Set(productIds).size) {
    return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
  }

  let subtotal = new Prisma.Decimal(0);
  const itemsData = parsed.data.items.map((item) => {
    const product = productById.get(item.productId)!;
    const lineTotal = product.price.mul(item.quantity);
    subtotal = subtotal.plus(lineTotal);
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal,
    };
  });

  const total = subtotal;
  const totalCents = total.mul(100).round().toNumber();

  const billing = parsed.data.billingAddress;
  const shipping = parsed.data.shippingSameAsBilling ? billing : parsed.data.shippingAddress!;

  const order = await prisma.order.create({
    data: {
      staffId: session.user.id,
      customerName: parsed.data.customerName,
      customerCompany: parsed.data.customerCompany,
      customerEmail: parsed.data.customerEmail || undefined,
      customerPhone: parsed.data.customerPhone || undefined,
      billingLine1: billing.line1,
      billingLine2: billing.line2,
      billingCity: billing.city,
      billingState: billing.state,
      billingPostalCode: billing.postalCode,
      billingCountry: billing.country,
      shippingSameAsBilling: parsed.data.shippingSameAsBilling,
      shippingLine1: shipping.line1,
      shippingLine2: shipping.line2,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      shippingPostalCode: shipping.postalCode,
      shippingCountry: shipping.country,
      subtotal,
      total,
      items: { create: itemsData },
    },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    metadata: { orderId: order.id },
    automatic_payment_methods: { enabled: true },
    shipping: {
      name: parsed.data.customerCompany || parsed.data.customerName,
      address: {
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.postalCode,
        country: shipping.country,
      },
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({ orderId: order.id, clientSecret: paymentIntent.client_secret });
}
