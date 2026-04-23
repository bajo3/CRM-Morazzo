import { sql } from "./client";

async function reset() {
  await sql.unsafe(`
    truncate table
      schedule_entries,
      cash_movements,
      payments,
      stock_movements,
      stock_sheets,
      work_order_items,
      work_orders,
      quote_items,
      quotes,
      templates,
      service_extras,
      glass_types,
      clients
    restart identity cascade;

    alter sequence if exists quotes_visible_number_seq restart with 1;
    alter sequence if exists work_orders_visible_number_seq restart with 1;
  `);

  await sql.end();
}

reset().catch(async (error) => {
  console.error("Reset failed", error);
  await sql.end();
  process.exit(1);
});
