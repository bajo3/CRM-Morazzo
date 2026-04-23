import { z } from "zod";

import {
  cashExpenseCategories,
  cashIncomeCategories,
  extraPricingModes,
  paymentMethods,
  quoteStatuses,
  scheduleStatuses,
  workOrderStatuses,
} from "./enums";

export const integerMmSchema = z.number().int().positive();
export const moneyCentsSchema = z.number().int().nonnegative();

export const quoteExtraInputSchema = z.object({
  extraId: z.string().uuid().optional(),
  label: z.string().min(1),
  pricingMode: z.enum(extraPricingModes),
  unitPriceCents: moneyCentsSchema,
});

export const quoteItemCalculationInputSchema = z.object({
  widthMm: integerMmSchema,
  heightMm: integerMmSchema,
  quantity: z.number().int().positive(),
  pricePerM2Cents: moneyCentsSchema,
  extras: z.array(quoteExtraInputSchema).optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(2).max(160),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  jobSite: z.string().max(160).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createGlassTypeSchema = z.object({
  name: z.string().min(2).max(120),
  thicknessMm: integerMmSchema,
  color: z.string().min(2).max(80),
  pricePerM2Cents: moneyCentsSchema,
});

export const createServiceExtraSchema = z.object({
  name: z.string().min(2).max(120),
  pricingMode: z.enum(extraPricingModes),
  unitPriceCents: moneyCentsSchema,
});

export const createQuoteItemSchema = z.object({
  description: z.string().min(2),
  glassTypeId: z.string().uuid().optional().nullable(),
  widthMm: integerMmSchema,
  heightMm: integerMmSchema,
  quantity: z.number().int().positive(),
  pricePerM2Cents: moneyCentsSchema,
  extras: z.array(quoteExtraInputSchema).default([]),
});

export const createQuoteSchema = z.object({
  clientId: z.string().uuid(),
  issueDate: z.string().min(1),
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  items: z.array(createQuoteItemSchema).min(1),
});

export const quoteStatusSchema = z.enum(quoteStatuses);
export const workOrderStatusSchema = z.enum(workOrderStatuses);
export const scheduleStatusSchema = z.enum(scheduleStatuses);
export const paymentMethodSchema = z.enum(paymentMethods);
export const cashIncomeCategorySchema = z.enum(cashIncomeCategories);
export const cashExpenseCategorySchema = z.enum(cashExpenseCategories);

