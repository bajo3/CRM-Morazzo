import { AREA_DISPLAY_DECIMALS, CURRENCY_CODE, CURRENCY_LOCALE } from "./constants";

export function formatCurrencyFromCents(value: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatAreaM2(value: number): string {
  return `${value.toFixed(AREA_DISPLAY_DECIMALS)} m2`;
}

export function formatMm(value: number): string {
  return `${value} mm`;
}

