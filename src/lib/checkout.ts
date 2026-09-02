import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Prisma } from "@/generated/prisma/client";
import type { CreateOrderInput } from "@/lib/orderSchema";

type CheckoutInput = CreateOrderInput & {
  paymentMethod?: "CARD" | "PURCHASE_ORDER";
  poNumber?: string;
};

export async function createOrderAndPaymentIntent(data: CheckoutInput, staffId: string | null) {
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  if (products.length !== new Set(productIds).size) {
    return { error: "One or more products are unavailable" } as const;
  }

  let subtotal = new Prisma.Decimal(0);
  const itemsData = data.items.map((item) => {
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

  const billing = data.billingAddress;
  const shipping = data.shippingSameAsBilling ? billing : data.shippingAddress!;

  // Purchase Order is a staff-only payment method (see createStaffOrderSchema
  // - the public storefront schema has no paymentMethod field at all, so a
  // guest request can never reach this branch). No Stripe payment is
  // collected: the order is placed directly on PO terms, and since it's a
  // real, staff-attributed sale, commission is earned immediately rather
  // than waiting on a payment webhook that will never fire for it.
  const isPurchaseOrder = data.paymentMethod === "PURCHASE_ORDER";

  const order = await prisma.order.create({
    data: {
      staffId,
      customerName: data.customerName,
      customerCompany: data.customerCompany,
      customerEmail: data.customerEmail || undefined,
      customerPhone: data.customerPhone || undefined,
      billingLine1: billing.line1,
      billingLine2: billing.line2,
      billingCity: billing.city,
      billingState: billing.state,
      billingPostalCode: billing.postalCode,
      billingCountry: billing.country,
      shippingSameAsBilling: data.shippingSameAsBilling,
      shippingLine1: shipping.line1,
      shippingLine2: shipping.line2,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      shippingPostalCode: shipping.postalCode,
      shippingCountry: shipping.country,
      paymentMethod: isPurchaseOrder ? "PURCHASE_ORDER" : "CARD",
      poNumber: isPurchaseOrder ? data.poNumber : undefined,
      status: isPurchaseOrder ? "INVOICED" : "PENDING",
      subtotal,
      total,
      items: { create: itemsData },
    },
  });

  if (isPurchaseOrder) {
    if (staffId) {
      const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
      const rate = settings?.commissionRatePercent ?? 10;
      const amount = total.mul(rate).div(100);
      await prisma.commission.create({
        data: { orderId: order.id, staffId, rate, amount },
      });
    }
    return { orderId: order.id, clientSecret: null } as const;
  }

  const totalCents = total.mul(100).round().toNumber();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    metadata: { orderId: order.id },
    automatic_payment_methods: { enabled: true },
    shipping: {
      name: data.customerCompany || data.customerName,
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

  return { orderId: order.id, clientSecret: paymentIntent.client_secret } as const;
}
