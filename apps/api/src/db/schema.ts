import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "approved",
  "rejected",
  "in_progress",
  "finished",
  "delivered",
  "paid",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "pending",
  "cutting",
  "in_progress",
  "ready",
  "delivered",
  "installed",
]);

export const scheduleStatusEnum = pgEnum("schedule_status", [
  "to_schedule",
  "scheduled",
  "completed",
  "rescheduled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "debit_card",
  "credit_card",
  "mercado_pago",
  "other",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "in",
  "use",
  "breakage",
  "manual_adjustment",
]);

export const cashMovementTypeEnum = pgEnum("cash_movement_type", ["income", "expense"]);

export const cashIncomeCategoryEnum = pgEnum("cash_income_category", [
  "deposit",
  "sale",
  "final_payment",
  "manual_income",
]);

export const cashExpenseCategoryEnum = pgEnum("cash_expense_category", [
  "glass_purchase",
  "hardware",
  "freight",
  "salaries",
  "misc",
]);

export const extraPricingModeEnum = pgEnum("extra_pricing_mode", ["per_unit", "per_m2", "fixed"]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 255 }),
  jobSite: varchar("job_site", { length: 160 }),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

export const glassTypes = pgTable("glass_types", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  thicknessMm: integer("thickness_mm").notNull(),
  color: varchar("color", { length: 80 }).notNull(),
  pricePerM2Cents: integer("price_per_m2_cents").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const serviceExtras = pgTable("service_extras", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  pricingMode: extraPricingModeEnum("pricing_mode").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 24 }).notNull().unique(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  status: quoteStatusEnum("status").default("draft").notNull(),
  issueDate: date("issue_date").notNull(),
  validUntil: date("valid_until"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  subtotalCents: integer("subtotal_cents").default(0).notNull(),
  extrasTotalCents: integer("extras_total_cents").default(0).notNull(),
  totalCents: integer("total_cents").default(0).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  ...timestamps,
});

export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id),
  glassTypeId: uuid("glass_type_id").references(() => glassTypes.id),
  description: text("description").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  unitPricePerM2Cents: integer("unit_price_per_m2_cents").notNull(),
  areaM2: integer("area_m2_basis_points").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  extrasTotalCents: integer("extras_total_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  extraBreakdown: jsonb("extra_breakdown").default([]).notNull(),
  ...timestamps,
});

export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey(),
  workOrderNumber: varchar("work_order_number", { length: 24 }).notNull().unique(),
  quoteId: uuid("quote_id").references(() => quotes.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  status: workOrderStatusEnum("status").default("pending").notNull(),
  promisedDate: date("promised_date"),
  internalNotes: text("internal_notes"),
  ...timestamps,
});

export const workOrderItems = pgTable("work_order_items", {
  id: uuid("id").primaryKey(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
  description: text("description").notNull(),
  glassLabel: varchar("glass_label", { length: 160 }).notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  quantity: integer("quantity").notNull(),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  workOrderId: uuid("work_order_id").references(() => workOrders.id),
  amountCents: integer("amount_cents").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const cashMovements = pgTable("cash_movements", {
  id: uuid("id").primaryKey(),
  type: cashMovementTypeEnum("type").notNull(),
  incomeCategory: cashIncomeCategoryEnum("income_category"),
  expenseCategory: cashExpenseCategoryEnum("expense_category"),
  clientId: uuid("client_id").references(() => clients.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  amountCents: integer("amount_cents").notNull(),
  movementDate: timestamp("movement_date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const stockSheets = pgTable("stock_sheets", {
  id: uuid("id").primaryKey(),
  glassTypeId: uuid("glass_type_id").references(() => glassTypes.id),
  typeLabel: varchar("type_label", { length: 120 }).notNull(),
  thicknessMm: integer("thickness_mm").notNull(),
  color: varchar("color", { length: 80 }).notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  sheetCount: integer("sheet_count").default(0).notNull(),
  location: varchar("location", { length: 120 }),
  notes: text("notes"),
  ...timestamps,
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey(),
  stockSheetId: uuid("stock_sheet_id").notNull().references(() => stockSheets.id),
  type: stockMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const scheduleEntries = pgTable("schedule_entries", {
  id: uuid("id").primaryKey(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  workOrderId: uuid("work_order_id").references(() => workOrders.id),
  status: scheduleStatusEnum("status").default("to_schedule").notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  timeLabel: varchar("time_label", { length: 80 }),
  jobType: varchar("job_type", { length: 120 }).notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  defaultWidthMm: integer("default_width_mm"),
  defaultHeightMm: integer("default_height_mm"),
  defaultQuantity: integer("default_quantity").default(1).notNull(),
  defaultGlassLabel: varchar("default_glass_label", { length: 160 }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

