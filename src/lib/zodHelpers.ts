import { z } from "zod";

/** Treats "" (from empty form fields / CSV cells) as absent instead of coercing to a bogus value. */
export const optionalTrimmedString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

export const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional(),
);
