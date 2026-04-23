import {
  demoCashMovements,
  demoClients,
  demoGlassTypes,
  demoPayments,
  demoQuoteItems,
  demoQuotes,
  demoScheduleEntries,
  demoServiceExtras,
  demoStockMovements,
  demoStockSheets,
  demoTemplates,
  demoWorkOrderItems,
  demoWorkOrders,
} from "./seed-data";
import { db, sql } from "./client";
import {
  cashMovements,
  clients,
  glassTypes,
  payments,
  quoteItems,
  quotes,
  scheduleEntries,
  serviceExtras,
  stockMovements,
  stockSheets,
  templates,
  workOrderItems,
  workOrders,
} from "./schema";

async function run() {
  for (const row of demoClients) {
    await db.insert(clients).values(row).onConflictDoUpdate({ target: clients.id, set: row });
  }

  for (const row of demoGlassTypes) {
    await db.insert(glassTypes).values(row).onConflictDoUpdate({ target: glassTypes.id, set: row });
  }

  for (const row of demoServiceExtras) {
    await db.insert(serviceExtras).values(row).onConflictDoUpdate({ target: serviceExtras.id, set: row });
  }

  for (const row of demoTemplates) {
    await db.insert(templates).values(row).onConflictDoUpdate({ target: templates.id, set: row });
  }

  for (const row of demoQuotes) {
    await db.insert(quotes).values(row).onConflictDoUpdate({ target: quotes.id, set: row });
  }

  for (const row of demoQuoteItems) {
    await db.insert(quoteItems).values(row).onConflictDoUpdate({ target: quoteItems.id, set: row });
  }

  for (const row of demoWorkOrders) {
    await db.insert(workOrders).values(row).onConflictDoUpdate({ target: workOrders.id, set: row });
  }

  for (const row of demoWorkOrderItems) {
    await db.insert(workOrderItems).values(row).onConflictDoUpdate({ target: workOrderItems.id, set: row });
  }

  for (const row of demoPayments) {
    await db.insert(payments).values(row).onConflictDoUpdate({ target: payments.id, set: row });
  }

  for (const row of demoCashMovements) {
    await db.insert(cashMovements).values(row).onConflictDoUpdate({ target: cashMovements.id, set: row });
  }

  for (const row of demoStockSheets) {
    await db.insert(stockSheets).values(row).onConflictDoUpdate({ target: stockSheets.id, set: row });
  }

  for (const row of demoStockMovements) {
    await db.insert(stockMovements).values(row).onConflictDoUpdate({ target: stockMovements.id, set: row });
  }

  for (const row of demoScheduleEntries) {
    await db.insert(scheduleEntries).values(row).onConflictDoUpdate({ target: scheduleEntries.id, set: row });
  }

  await sql.end();
}

run().catch(async (error) => {
  console.error("Seed failed", error);
  await sql.end();
  process.exit(1);
});
