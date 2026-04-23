import type { ExtraPricingMode, PaymentMethod, QuoteStatus, ScheduleStatus, WorkOrderStatus } from "./enums";

export type QuoteExtraInput = {
  extraId?: string;
  label: string;
  pricingMode: ExtraPricingMode;
  unitPriceCents: number;
};

export type QuoteItemCalculationInput = {
  widthMm: number;
  heightMm: number;
  quantity: number;
  pricePerM2Cents: number;
  extras?: QuoteExtraInput[];
};

export type QuoteItemExtraResult = QuoteExtraInput & {
  totalCents: number;
};

export type QuoteItemCalculationResult = {
  widthMm: number;
  heightMm: number;
  quantity: number;
  areaM2: number;
  totalAreaM2: number;
  baseSubtotalCents: number;
  extrasTotalCents: number;
  totalCents: number;
  extras: QuoteItemExtraResult[];
};

export type Client = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  jobSite?: string | null;
  notes?: string | null;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: QuoteStatus;
  issueDate: string;
  validUntil?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  subtotalCents: number;
  extrasTotalCents: number;
  totalCents: number;
};

export type WorkOrder = {
  id: string;
  workOrderNumber: string;
  clientId: string;
  quoteId?: string | null;
  status: WorkOrderStatus;
  promisedDate?: string | null;
  internalNotes?: string | null;
};

export type Payment = {
  id: string;
  clientId: string;
  quoteId?: string | null;
  workOrderId?: string | null;
  amountCents: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
};

export type ScheduleEntry = {
  id: string;
  clientId: string;
  workOrderId?: string | null;
  status: ScheduleStatus;
  address: string;
  scheduledDate: string;
  timeLabel?: string | null;
  jobType: string;
  notes?: string | null;
};

