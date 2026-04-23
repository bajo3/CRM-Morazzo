import {
  AREA_BASIS_POINTS_FACTOR,
  MM2_PER_M2,
  NUMBER_PAD_LENGTH,
  QUOTE_NUMBER_PREFIX,
  WORK_ORDER_NUMBER_PREFIX,
} from "./constants";
import { quoteItemCalculationInputSchema } from "./schemas";
import type { QuoteExtraInput, QuoteItemCalculationInput, QuoteItemCalculationResult } from "./types";

export function roundCurrency(value: number): number {
  return Math.round(value);
}

export function areaMm2ToM2(areaMm2: number): number {
  return areaMm2 / MM2_PER_M2;
}

export function calculateAreaM2(widthMm: number, heightMm: number): number {
  return areaMm2ToM2(widthMm * heightMm);
}

export function toAreaBasisPoints(areaM2: number): number {
  return Math.round(areaM2 * AREA_BASIS_POINTS_FACTOR);
}

export function fromAreaBasisPoints(value: number): number {
  return value / AREA_BASIS_POINTS_FACTOR;
}

function calculateExtraTotal(extra: QuoteExtraInput, totalAreaM2: number, quantity: number): number {
  if (extra.pricingMode === "fixed") {
    return extra.unitPriceCents;
  }

  if (extra.pricingMode === "per_unit") {
    return roundCurrency(extra.unitPriceCents * quantity);
  }

  return roundCurrency(extra.unitPriceCents * totalAreaM2);
}

export function calculateQuoteItem(input: QuoteItemCalculationInput): QuoteItemCalculationResult {
  const parsed = quoteItemCalculationInputSchema.parse(input);
  const areaM2 = calculateAreaM2(parsed.widthMm, parsed.heightMm);
  const totalAreaM2 = areaM2 * parsed.quantity;
  const baseSubtotalCents = roundCurrency(parsed.pricePerM2Cents * totalAreaM2);

  const extras = (parsed.extras ?? []).map((extra) => ({
    ...extra,
    totalCents: calculateExtraTotal(extra, totalAreaM2, parsed.quantity),
  }));

  const extrasTotalCents = extras.reduce((sum, extra) => sum + extra.totalCents, 0);
  const totalCents = baseSubtotalCents + extrasTotalCents;

  return {
    widthMm: parsed.widthMm,
    heightMm: parsed.heightMm,
    quantity: parsed.quantity,
    areaM2,
    totalAreaM2,
    baseSubtotalCents,
    extrasTotalCents,
    totalCents,
    extras,
  };
}

export function calculateQuoteTotals(items: QuoteItemCalculationResult[]) {
  return items.reduce(
    (accumulator, item) => {
      accumulator.subtotalCents += item.baseSubtotalCents;
      accumulator.extrasTotalCents += item.extrasTotalCents;
      accumulator.totalCents += item.totalCents;
      return accumulator;
    },
    {
      subtotalCents: 0,
      extrasTotalCents: 0,
      totalCents: 0,
    },
  );
}

export function formatSequentialNumber(prefix: string, currentValue: number): string {
  return `${prefix}-${String(currentValue).padStart(NUMBER_PAD_LENGTH, "0")}`;
}

export function formatQuoteNumber(currentValue: number): string {
  return formatSequentialNumber(QUOTE_NUMBER_PREFIX, currentValue);
}

export function formatWorkOrderNumber(currentValue: number): string {
  return formatSequentialNumber(WORK_ORDER_NUMBER_PREFIX, currentValue);
}
