import { desc, eq } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { clients, workOrders } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const workOrdersRouter = Router();

workOrdersRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: workOrders.id,
        workOrderNumber: workOrders.workOrderNumber,
        status: workOrders.status,
        promisedDate: workOrders.promisedDate,
        clientName: clients.name,
      })
      .from(workOrders)
      .innerJoin(clients, eq(workOrders.clientId, clients.id))
      .orderBy(desc(workOrders.createdAt));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

