export const quoteStatuses = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "in_progress",
  "finished",
  "delivered",
  "paid",
] as const;

export const workOrderStatuses = [
  "pending",
  "cutting",
  "in_progress",
  "ready",
  "delivered",
  "installed",
] as const;

export const scheduleStatuses = ["to_schedule", "scheduled", "completed", "rescheduled"] as const;
export const paymentMethods = ["cash", "bank_transfer", "debit_card", "credit_card", "mercado_pago", "other"] as const;
export const stockMovementTypes = ["in", "use", "breakage", "manual_adjustment"] as const;
export const cashMovementTypes = ["income", "expense"] as const;
export const extraPricingModes = ["per_unit", "per_m2", "fixed"] as const;
export const cashIncomeCategories = ["deposit", "sale", "final_payment", "manual_income"] as const;
export const cashExpenseCategories = ["glass_purchase", "hardware", "freight", "salaries", "misc"] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
export type WorkOrderStatus = (typeof workOrderStatuses)[number];
export type ScheduleStatus = (typeof scheduleStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type StockMovementType = (typeof stockMovementTypes)[number];
export type CashMovementType = (typeof cashMovementTypes)[number];
export type ExtraPricingMode = (typeof extraPricingModes)[number];
export type CashIncomeCategory = (typeof cashIncomeCategories)[number];
export type CashExpenseCategory = (typeof cashExpenseCategories)[number];

