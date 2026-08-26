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

export const createOrderSchema = z
  .object({
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
  })
  .refine((data) => data.shippingSameAsBilling || data.shippingAddress, {
    message: "Shipping address is required when it differs from billing",
    path: ["shippingAddress"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
