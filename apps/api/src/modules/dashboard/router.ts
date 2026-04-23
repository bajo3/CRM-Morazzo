import { eq, sql } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { cashMovements, quotes, scheduleEntries, stockSheets, workOrders } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_request, response) => {
  try {
    const [quotesMonth] = await db.select({ value: sql<number>`count(*)` }).from(quotes);
    const [pendingOrders] = await db
      .select({ value: sql<number>`count(*)` })
      .from(workOrders)
      .where(sql`${workOrders.status} in ('pending', 'cutting', 'in_progress')`);
    const [readyOrders] = await db
      .select({ value: sql<number>`count(*)` })
      .from(workOrders)
      .where(eq(workOrders.status, "ready"));
    const [pendingPayments] = await db
      .select({ value: sql<number>`coalesce(sum(${quotes.totalCents}), 0)` })
      .from(quotes)
      .where(sql`${quotes.status} <> 'paid'`);
    const [todayCash] = await db
      .select({ value: sql<number>`coalesce(sum(case when ${cashMovements.type} = 'income' then ${cashMovements.amountCents} else -${cashMovements.amountCents} end), 0)` })
      .from(cashMovements);
    const lowStock = await db.select().from(stockSheets).where(sql`${stockSheets.sheetCount} <= 1`);
    const upcoming = await db.select().from(scheduleEntries).limit(5);

    response.json({
      ok: true,
      data: {
        quotesMonth: quotesMonth.value,
        pendingOrders: pendingOrders.value,
        readyOrders: readyOrders.value,
        pendingPaymentsCents: pendingPayments.value,
        lowStockCount: lowStock.length,
        todayCashCents: todayCash.value,
        upcoming,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

