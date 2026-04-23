import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    address: varchar("address", { length: 255 }),
    jobSite: varchar("job_site", { length: 160 }),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("clients_name_idx").on(table.name),
    index("clients_deleted_at_idx").on(table.deletedAt),
  ],
);

export const glassTypes = pgTable(
  "glass_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    thicknessMm: integer("thickness_mm").notNull(),
    color: varchar("color", { length: 80 }).notNull(),
    pricePerM2Cents: integer("price_per_m2_cents").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("glass_types_active_idx").on(table.isActive),
    index("glass_types_lookup_idx").on(table.name, table.thicknessMm, table.color),
    check("glass_types_thickness_positive_check", sql`${table.thicknessMm} > 0`),
    check("glass_types_price_non_negative_check", sql`${table.pricePerM2Cents} >= 0`),
  ],
);

export const serviceExtras = pgTable(
  "service_extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    pricingMode: extraPricingModeEnum("pricing_mode").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("service_extras_active_idx").on(table.isActive),
    index("service_extras_name_idx").on(table.name),
    check("service_extras_price_non_negative_check", sql`${table.unitPriceCents} >= 0`),
  ],
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteNumber: varchar("quote_number", { length: 24 }).default(sql`generate_quote_number()`).notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
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
  },
  (table) => [
    uniqueIndex("quotes_quote_number_idx").on(table.quoteNumber),
    index("quotes_client_id_idx").on(table.clientId),
    index("quotes_status_idx").on(table.status),
    index("quotes_issue_date_idx").on(table.issueDate),
    check("quotes_subtotal_non_negative_check", sql`${table.subtotalCents} >= 0`),
    check("quotes_extras_total_non_negative_check", sql`${table.extrasTotalCents} >= 0`),
    check("quotes_total_non_negative_check", sql`${table.totalCents} >= 0`),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
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
    extraBreakdown: jsonb("extra_breakdown").default(sql`'[]'::jsonb`).notNull(),
    ...timestamps,
  },
  (table) => [
    index("quote_items_quote_id_idx").on(table.quoteId),
    index("quote_items_glass_type_id_idx").on(table.glassTypeId),
    check("quote_items_width_positive_check", sql`${table.widthMm} > 0`),
    check("quote_items_height_positive_check", sql`${table.heightMm} > 0`),
    check("quote_items_quantity_positive_check", sql`${table.quantity} > 0`),
    check("quote_items_unit_price_non_negative_check", sql`${table.unitPricePerM2Cents} >= 0`),
    check("quote_items_area_positive_check", sql`${table.areaM2} > 0`),
    check("quote_items_subtotal_non_negative_check", sql`${table.subtotalCents} >= 0`),
    check("quote_items_extras_non_negative_check", sql`${table.extrasTotalCents} >= 0`),
    check("quote_items_total_non_negative_check", sql`${table.totalCents} >= 0`),
  ],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderNumber: varchar("work_order_number", { length: 24 }).default(sql`generate_work_order_number()`).notNull(),
    quoteId: uuid("quote_id").references(() => quotes.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    status: workOrderStatusEnum("status").default("pending").notNull(),
    promisedDate: date("promised_date"),
    internalNotes: text("internal_notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("work_orders_work_order_number_idx").on(table.workOrderNumber),
    index("work_orders_quote_id_idx").on(table.quoteId),
    index("work_orders_client_id_idx").on(table.clientId),
    index("work_orders_status_idx").on(table.status),
  ],
);

export const workOrderItems = pgTable(
  "work_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workOrderId: uuid("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    glassLabel: varchar("glass_label", { length: 160 }).notNull(),
    widthMm: integer("width_mm").notNull(),
    heightMm: integer("height_mm").notNull(),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (table) => [
    index("work_order_items_work_order_id_idx").on(table.workOrderId),
    check("work_order_items_width_positive_check", sql`${table.widthMm} > 0`),
    check("work_order_items_height_positive_check", sql`${table.heightMm} > 0`),
    check("work_order_items_quantity_positive_check", sql`${table.quantity} > 0`),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    quoteId: uuid("quote_id").references(() => quotes.id),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    amountCents: integer("amount_cents").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("payments_client_id_idx").on(table.clientId),
    index("payments_quote_id_idx").on(table.quoteId),
    index("payments_work_order_id_idx").on(table.workOrderId),
    index("payments_paid_at_idx").on(table.paidAt),
    check("payments_amount_positive_check", sql`${table.amountCents} > 0`),
  ],
);

export const cashMovements = pgTable(
  "cash_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
  },
  (table) => [
    index("cash_movements_type_idx").on(table.type),
    index("cash_movements_date_idx").on(table.movementDate),
    index("cash_movements_client_id_idx").on(table.clientId),
    index("cash_movements_quote_id_idx").on(table.quoteId),
    index("cash_movements_payment_id_idx").on(table.paymentId),
    check("cash_movements_amount_positive_check", sql`${table.amountCents} > 0`),
  ],
);

export const stockSheets = pgTable(
  "stock_sheets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
  },
  (table) => [
    index("stock_sheets_glass_type_id_idx").on(table.glassTypeId),
    index("stock_sheets_sheet_count_idx").on(table.sheetCount),
    index("stock_sheets_lookup_idx").on(table.typeLabel, table.thicknessMm, table.color),
    check("stock_sheets_thickness_positive_check", sql`${table.thicknessMm} > 0`),
    check("stock_sheets_width_positive_check", sql`${table.widthMm} > 0`),
    check("stock_sheets_height_positive_check", sql`${table.heightMm} > 0`),
    check("stock_sheets_count_non_negative_check", sql`${table.sheetCount} >= 0`),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stockSheetId: uuid("stock_sheet_id")
      .notNull()
      .references(() => stockSheets.id, { onDelete: "cascade" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("stock_movements_stock_sheet_id_idx").on(table.stockSheetId),
    index("stock_movements_type_idx").on(table.type),
    check("stock_movements_quantity_positive_check", sql`${table.quantity} > 0`),
  ],
);

export const scheduleEntries = pgTable(
  "schedule_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    status: scheduleStatusEnum("status").default("to_schedule").notNull(),
    address: varchar("address", { length: 255 }).notNull(),
    scheduledDate: date("scheduled_date").notNull(),
    timeLabel: varchar("time_label", { length: 80 }),
    jobType: varchar("job_type", { length: 120 }).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("schedule_entries_client_id_idx").on(table.clientId),
    index("schedule_entries_work_order_id_idx").on(table.workOrderId),
    index("schedule_entries_status_idx").on(table.status),
    index("schedule_entries_date_idx").on(table.scheduledDate),
  ],
);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    defaultWidthMm: integer("default_width_mm"),
    defaultHeightMm: integer("default_height_mm"),
    defaultQuantity: integer("default_quantity").default(1).notNull(),
    defaultGlassLabel: varchar("default_glass_label", { length: 160 }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("templates_name_idx").on(table.name),
    index("templates_deleted_at_idx").on(table.deletedAt),
    check("templates_default_quantity_positive_check", sql`${table.defaultQuantity} > 0`),
  ],
);
