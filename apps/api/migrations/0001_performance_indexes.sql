-- Performance indexes for CRM Morazzo
-- All indexes use IF NOT EXISTS to be safe to run multiple times

create index if not exists quotes_created_at_idx
  on public.quotes (created_at desc);

create index if not exists work_orders_created_at_idx
  on public.work_orders (created_at desc);

create index if not exists stock_movements_created_at_idx
  on public.stock_movements (created_at desc);

create index if not exists cash_movements_movement_date_desc_idx
  on public.cash_movements (movement_date desc);

create index if not exists schedule_entries_date_status_idx
  on public.schedule_entries (scheduled_date, status);

create index if not exists work_orders_promised_date_status_idx
  on public.work_orders (promised_date, status);

create index if not exists quotes_status_created_at_idx
  on public.quotes (status, created_at desc);

create index if not exists payments_paid_at_desc_idx
  on public.payments (paid_at desc);
