import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, staff: true },
  });

  const result = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    customerCompany: order.customerCompany,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    staffName: order.staff?.name ?? "Online (self-checkout)",
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    items: order.items.map((item) => ({
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  }));

  return NextResponse.json({ orders: result });
}
