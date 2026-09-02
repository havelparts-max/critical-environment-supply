import { z } from "zod";
import { optionalTrimmedString } from "@/lib/zodHelpers";

export const addressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: optionalTrimmedString,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().length(2).default("US"),
});

const baseOrderFields = {
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
};

function requireShippingAddress<T extends { shippingSameAsBilling: boolean; shippingAddress?: unknown }>(
  data: T,
) {
  return data.shippingSameAsBilling || !!data.shippingAddress;
}

// Public-facing schema (guest storefront checkout). Deliberately has no
// paymentMethod/poNumber fields at all - a guest request can never set them,
// since zod strips unknown keys by default. Purchase Order is staff-only;
// see createStaffOrderSchema below, which only /api/orders (an authenticated
// route) uses.
export const createOrderSchema = z
  .object(baseOrderFields)
  .refine(requireShippingAddress, {
    message: "Shipping address is required when it differs from billing",
    path: ["shippingAddress"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const createStaffOrderSchema = z
  .object({
    ...baseOrderFields,
    paymentMethod: z.enum(["CARD", "PURCHASE_ORDER"]).default("CARD"),
    poNumber: optionalTrimmedString,
  })
  .refine(requireShippingAddress, {
    message: "Shipping address is required when it differs from billing",
    path: ["shippingAddress"],
  })
  .refine((data) => data.paymentMethod !== "PURCHASE_ORDER" || !!data.poNumber, {
    message: "PO number is required when paying by purchase order",
    path: ["poNumber"],
  });

export type CreateStaffOrderInput = z.infer<typeof createStaffOrderSchema>;
