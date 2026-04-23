CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SEQUENCE IF NOT EXISTS "quotes_visible_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "work_orders_visible_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE OR REPLACE FUNCTION "generate_quote_number"() RETURNS varchar AS $$
BEGIN
  RETURN 'PRES-' || lpad(nextval('quotes_visible_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION "generate_work_order_number"() RETURNS varchar AS $$
BEGIN
  RETURN 'OT-' || lpad(nextval('work_orders_visible_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION "set_updated_at"() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TYPE "public"."cash_expense_category" AS ENUM('glass_purchase', 'hardware', 'freight', 'salaries', 'misc');
CREATE TYPE "public"."cash_income_category" AS ENUM('deposit', 'sale', 'final_payment', 'manual_income');
CREATE TYPE "public"."cash_movement_type" AS ENUM('income', 'expense');
CREATE TYPE "public"."extra_pricing_mode" AS ENUM('per_unit', 'per_m2', 'fixed');
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'debit_card', 'credit_card', 'mercado_pago', 'other');
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'approved', 'rejected', 'in_progress', 'finished', 'delivered', 'paid');
CREATE TYPE "public"."schedule_status" AS ENUM('to_schedule', 'scheduled', 'completed', 'rescheduled');
CREATE TYPE "public"."stock_movement_type" AS ENUM('in', 'use', 'breakage', 'manual_adjustment');
CREATE TYPE "public"."work_order_status" AS ENUM('pending', 'cutting', 'in_progress', 'ready', 'delivered', 'installed');
CREATE TABLE "cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "cash_movement_type" NOT NULL,
	"income_category" "cash_income_category",
	"expense_category" "cash_expense_category",
	"client_id" uuid,
	"quote_id" uuid,
	"payment_id" uuid,
	"amount_cents" integer NOT NULL,
	"movement_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_movements_amount_positive_check" CHECK ("cash_movements"."amount_cents" > 0)
);

CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(40),
	"address" varchar(255),
	"job_site" varchar(160),
	"notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "glass_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"thickness_mm" integer NOT NULL,
	"color" varchar(80) NOT NULL,
	"price_per_m2_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glass_types_thickness_positive_check" CHECK ("glass_types"."thickness_mm" > 0),
	CONSTRAINT "glass_types_price_non_negative_check" CHECK ("glass_types"."price_per_m2_cents" >= 0)
);

CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"work_order_id" uuid,
	"amount_cents" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive_check" CHECK ("payments"."amount_cents" > 0)
);

CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"glass_type_id" uuid,
	"description" text NOT NULL,
	"width_mm" integer NOT NULL,
	"height_mm" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_per_m2_cents" integer NOT NULL,
	"area_m2_basis_points" integer NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"extras_total_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"extra_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_items_width_positive_check" CHECK ("quote_items"."width_mm" > 0),
	CONSTRAINT "quote_items_height_positive_check" CHECK ("quote_items"."height_mm" > 0),
	CONSTRAINT "quote_items_quantity_positive_check" CHECK ("quote_items"."quantity" > 0),
	CONSTRAINT "quote_items_unit_price_non_negative_check" CHECK ("quote_items"."unit_price_per_m2_cents" >= 0),
	CONSTRAINT "quote_items_area_positive_check" CHECK ("quote_items"."area_m2_basis_points" > 0),
	CONSTRAINT "quote_items_subtotal_non_negative_check" CHECK ("quote_items"."subtotal_cents" >= 0),
	CONSTRAINT "quote_items_extras_non_negative_check" CHECK ("quote_items"."extras_total_cents" >= 0),
	CONSTRAINT "quote_items_total_non_negative_check" CHECK ("quote_items"."total_cents" >= 0)
);

CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_number" varchar(24) DEFAULT generate_quote_number() NOT NULL,
	"client_id" uuid NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"valid_until" date,
	"notes" text,
	"internal_notes" text,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"extras_total_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_subtotal_non_negative_check" CHECK ("quotes"."subtotal_cents" >= 0),
	CONSTRAINT "quotes_extras_total_non_negative_check" CHECK ("quotes"."extras_total_cents" >= 0),
	CONSTRAINT "quotes_total_non_negative_check" CHECK ("quotes"."total_cents" >= 0)
);

CREATE TABLE "schedule_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"work_order_id" uuid,
	"status" "schedule_status" DEFAULT 'to_schedule' NOT NULL,
	"address" varchar(255) NOT NULL,
	"scheduled_date" date NOT NULL,
	"time_label" varchar(80),
	"job_type" varchar(120) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "service_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"pricing_mode" "extra_pricing_mode" NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_extras_price_non_negative_check" CHECK ("service_extras"."unit_price_cents" >= 0)
);

CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_sheet_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_quantity_positive_check" CHECK ("stock_movements"."quantity" > 0)
);

CREATE TABLE "stock_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"glass_type_id" uuid,
	"type_label" varchar(120) NOT NULL,
	"thickness_mm" integer NOT NULL,
	"color" varchar(80) NOT NULL,
	"width_mm" integer NOT NULL,
	"height_mm" integer NOT NULL,
	"sheet_count" integer DEFAULT 0 NOT NULL,
	"location" varchar(120),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_sheets_thickness_positive_check" CHECK ("stock_sheets"."thickness_mm" > 0),
	CONSTRAINT "stock_sheets_width_positive_check" CHECK ("stock_sheets"."width_mm" > 0),
	CONSTRAINT "stock_sheets_height_positive_check" CHECK ("stock_sheets"."height_mm" > 0),
	CONSTRAINT "stock_sheets_count_non_negative_check" CHECK ("stock_sheets"."sheet_count" >= 0)
);

CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"default_width_mm" integer,
	"default_height_mm" integer,
	"default_quantity" integer DEFAULT 1 NOT NULL,
	"default_glass_label" varchar(160),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_default_quantity_positive_check" CHECK ("templates"."default_quantity" > 0)
);

CREATE TABLE "work_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"description" text NOT NULL,
	"glass_label" varchar(160) NOT NULL,
	"width_mm" integer NOT NULL,
	"height_mm" integer NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_order_items_width_positive_check" CHECK ("work_order_items"."width_mm" > 0),
	CONSTRAINT "work_order_items_height_positive_check" CHECK ("work_order_items"."height_mm" > 0),
	CONSTRAINT "work_order_items_quantity_positive_check" CHECK ("work_order_items"."quantity" > 0)
);

CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_number" varchar(24) DEFAULT generate_work_order_number() NOT NULL,
	"quote_id" uuid,
	"client_id" uuid NOT NULL,
	"status" "work_order_status" DEFAULT 'pending' NOT NULL,
	"promised_date" date,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_glass_type_id_glass_types_id_fk" FOREIGN KEY ("glass_type_id") REFERENCES "public"."glass_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_entries" ADD CONSTRAINT "schedule_entries_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_sheet_id_stock_sheets_id_fk" FOREIGN KEY ("stock_sheet_id") REFERENCES "public"."stock_sheets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "stock_sheets" ADD CONSTRAINT "stock_sheets_glass_type_id_glass_types_id_fk" FOREIGN KEY ("glass_type_id") REFERENCES "public"."glass_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "cash_movements_type_idx" ON "cash_movements" USING btree ("type");
CREATE INDEX "cash_movements_date_idx" ON "cash_movements" USING btree ("movement_date");
CREATE INDEX "cash_movements_client_id_idx" ON "cash_movements" USING btree ("client_id");
CREATE INDEX "cash_movements_quote_id_idx" ON "cash_movements" USING btree ("quote_id");
CREATE INDEX "cash_movements_payment_id_idx" ON "cash_movements" USING btree ("payment_id");
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");
CREATE INDEX "clients_deleted_at_idx" ON "clients" USING btree ("deleted_at");
CREATE INDEX "glass_types_active_idx" ON "glass_types" USING btree ("is_active");
CREATE INDEX "glass_types_lookup_idx" ON "glass_types" USING btree ("name","thickness_mm","color");
CREATE INDEX "payments_client_id_idx" ON "payments" USING btree ("client_id");
CREATE INDEX "payments_quote_id_idx" ON "payments" USING btree ("quote_id");
CREATE INDEX "payments_work_order_id_idx" ON "payments" USING btree ("work_order_id");
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");
CREATE INDEX "quote_items_quote_id_idx" ON "quote_items" USING btree ("quote_id");
CREATE INDEX "quote_items_glass_type_id_idx" ON "quote_items" USING btree ("glass_type_id");
CREATE UNIQUE INDEX "quotes_quote_number_idx" ON "quotes" USING btree ("quote_number");
CREATE INDEX "quotes_client_id_idx" ON "quotes" USING btree ("client_id");
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");
CREATE INDEX "quotes_issue_date_idx" ON "quotes" USING btree ("issue_date");
CREATE INDEX "schedule_entries_client_id_idx" ON "schedule_entries" USING btree ("client_id");
CREATE INDEX "schedule_entries_work_order_id_idx" ON "schedule_entries" USING btree ("work_order_id");
CREATE INDEX "schedule_entries_status_idx" ON "schedule_entries" USING btree ("status");
CREATE INDEX "schedule_entries_date_idx" ON "schedule_entries" USING btree ("scheduled_date");
CREATE INDEX "service_extras_active_idx" ON "service_extras" USING btree ("is_active");
CREATE INDEX "service_extras_name_idx" ON "service_extras" USING btree ("name");
CREATE INDEX "stock_movements_stock_sheet_id_idx" ON "stock_movements" USING btree ("stock_sheet_id");
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");
CREATE INDEX "stock_sheets_glass_type_id_idx" ON "stock_sheets" USING btree ("glass_type_id");
CREATE INDEX "stock_sheets_sheet_count_idx" ON "stock_sheets" USING btree ("sheet_count");
CREATE INDEX "stock_sheets_lookup_idx" ON "stock_sheets" USING btree ("type_label","thickness_mm","color");
CREATE INDEX "templates_name_idx" ON "templates" USING btree ("name");
CREATE INDEX "templates_deleted_at_idx" ON "templates" USING btree ("deleted_at");
CREATE INDEX "work_order_items_work_order_id_idx" ON "work_order_items" USING btree ("work_order_id");
CREATE UNIQUE INDEX "work_orders_work_order_number_idx" ON "work_orders" USING btree ("work_order_number");
CREATE INDEX "work_orders_quote_id_idx" ON "work_orders" USING btree ("quote_id");
CREATE INDEX "work_orders_client_id_idx" ON "work_orders" USING btree ("client_id");
CREATE INDEX "work_orders_status_idx" ON "work_orders" USING btree ("status");
CREATE TRIGGER "set_cash_movements_updated_at" BEFORE UPDATE ON "cash_movements" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_clients_updated_at" BEFORE UPDATE ON "clients" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_glass_types_updated_at" BEFORE UPDATE ON "glass_types" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_payments_updated_at" BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_quote_items_updated_at" BEFORE UPDATE ON "quote_items" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_quotes_updated_at" BEFORE UPDATE ON "quotes" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_schedule_entries_updated_at" BEFORE UPDATE ON "schedule_entries" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_service_extras_updated_at" BEFORE UPDATE ON "service_extras" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_stock_movements_updated_at" BEFORE UPDATE ON "stock_movements" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_stock_sheets_updated_at" BEFORE UPDATE ON "stock_sheets" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_templates_updated_at" BEFORE UPDATE ON "templates" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_work_order_items_updated_at" BEFORE UPDATE ON "work_order_items" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "set_work_orders_updated_at" BEFORE UPDATE ON "work_orders" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

