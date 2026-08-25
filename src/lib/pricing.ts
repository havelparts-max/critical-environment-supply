import { Prisma } from "@/generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

/** sell price = baseCost * (1 + markupPercent / 100), rounded to cents. */
export function computeSellPrice(
  baseCost: DecimalInput,
  markupPercent: DecimalInput,
): Prisma.Decimal {
  const cost = new Prisma.Decimal(baseCost);
  const markupMultiplier = new Prisma.Decimal(markupPercent).div(100).plus(1);
  return cost.mul(markupMultiplier).toDecimalPlaces(2);
}
