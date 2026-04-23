import { asc, eq } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { clients, scheduleEntries, workOrders } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const scheduleRouter = Router();

scheduleRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: scheduleEntries.id,
        status: scheduleEntries.status,
        scheduledDate: scheduleEntries.scheduledDate,
        timeLabel: scheduleEntries.timeLabel,
        address: scheduleEntries.address,
        jobType: scheduleEntries.jobType,
        notes: scheduleEntries.notes,
        clientName: clients.name,
        workOrderNumber: workOrders.workOrderNumber,
      })
      .from(scheduleEntries)
      .innerJoin(clients, eq(scheduleEntries.clientId, clients.id))
      .leftJoin(workOrders, eq(scheduleEntries.workOrderId, workOrders.id))
      .orderBy(asc(scheduleEntries.scheduledDate));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

