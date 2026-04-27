import { eq, sql } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { cashMovements, clients, payments, quotes, scheduleEntries, stockSheets, workOrders } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_request, response) => {
  try {
    const [pendingQuotes] = await db
      .select({ value: sql<number>`count(*)` })
      .from(quotes)
      .where(sql`${quotes.status} in ('draft', 'sent')`);

    const [approvedQuotes] = await db
      .select({ value: sql<number>`count(*)` })
      .from(quotes)
      .where(sql`${quotes.status} in ('approved', 'in_progress')`);

    const [pendingOrders] = await db
      .select({ value: sql<number>`count(*)` })
      .from(workOrders)
      .where(sql`${workOrders.status} in ('pending', 'cutting', 'in_progress')`);

    const [readyOrders] = await db
      .select({ value: sql<number>`count(*)` })
      .from(workOrders)
      .where(eq(workOrders.status, "ready"));

    const [overdueOrders] = await db
      .select({ value: sql<number>`count(*)` })
      .from(workOrders)
      .where(sql`${workOrders.promisedDate} is not null and ${workOrders.promisedDate} < current_date and ${workOrders.status} not in ('delivered', 'installed')`);

    // Balance real: total de presupuestos activos menos pagos recibidos
    const [quotesTotal] = await db
      .select({ value: sql<number>`coalesce(sum(${quotes.totalCents}), 0)` })
      .from(quotes)
      .where(sql`${quotes.status} in ('sent', 'approved', 'in_progress', 'finished')`);

    const [paymentsTotal] = await db
      .select({ value: sql<number>`coalesce(sum(${payments.amountCents}), 0)` })
      .from(payments)
      .innerJoin(quotes, eq(payments.quoteId, quotes.id))
      .where(sql`${quotes.status} in ('sent', 'approved', 'in_progress', 'finished')`);

    const pendingPaymentsCents = Math.max(0, Number(quotesTotal.value) - Number(paymentsTotal.value));

    const [todayCash] = await db
      .select({
        value: sql<number>`coalesce(sum(case when ${cashMovements.type} = 'income' then ${cashMovements.amountCents} else -${cashMovements.amountCents} end), 0)`,
      })
      .from(cashMovements)
      .where(sql`date(${cashMovements.movementDate}) = current_date`);

    const lowStock = await db
      .select()
      .from(stockSheets)
      .where(sql`${stockSheets.sheetCount} <= 1`);

    const upcoming = await db
      .select({
        id: scheduleEntries.id,
        scheduledDate: scheduleEntries.scheduledDate,
        timeLabel: scheduleEntries.timeLabel,
        address: scheduleEntries.address,
        jobType: scheduleEntries.jobType,
        status: scheduleEntries.status,
        clientName: clients.name,
      })
      .from(scheduleEntries)
      .leftJoin(clients, eq(scheduleEntries.clientId, clients.id))
      .where(sql`${scheduleEntries.scheduledDate} >= current_date and ${scheduleEntries.status} != 'completed'`)
      .orderBy(scheduleEntries.scheduledDate)
      .limit(6);

    response.json({
      ok: true,
      data: {
        pendingQuotes: Number(pendingQuotes.value),
        approvedQuotes: Number(approvedQuotes.value),
        pendingOrders: Number(pendingOrders.value),
        readyOrders: Number(readyOrders.value),
        overdueOrders: Number(overdueOrders.value),
        pendingPaymentsCents,
        lowStockCount: lowStock.length,
        todayCashCents: Number(todayCash.value),
        upcoming,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});
