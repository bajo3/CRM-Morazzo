import { workOrderStatusSchema } from "@crm/shared";
import { desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db } from "../../db/client";
import { clients, payments, scheduleEntries, workOrders } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";
import { getWorkOrderDetail } from "../quotes/service";

const updateWorkOrderStatusSchema = z.object({
  status: workOrderStatusSchema,
});

const updateWorkOrderSchema = z.object({
  status: workOrderStatusSchema,
  promisedDate: z.string().optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
});

export const workOrdersRouter = Router();

workOrdersRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: workOrders.id,
        workOrderNumber: workOrders.workOrderNumber,
        quoteId: workOrders.quoteId,
        clientId: workOrders.clientId,
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

workOrdersRouter.get("/:id", async (request, response) => {
  try {
    const detail = await getWorkOrderDetail(request.params.id);

    if (!detail) {
      response.status(404).json({ ok: false, error: "Work order not found" });
      return;
    }

    response.json({ ok: true, data: detail });
  } catch (error) {
    handleRouteError(error, response);
  }
});

workOrdersRouter.patch("/:id/status", async (request, response) => {
  try {
    const payload = parseBody(updateWorkOrderStatusSchema, request);
    const [current] = await db.select().from(workOrders).where(eq(workOrders.id, request.params.id));

    if (!current) {
      response.status(404).json({ ok: false, error: "Work order not found" });
      return;
    }

    const [updated] = await db
      .update(workOrders)
      .set({
        status: payload.status,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, request.params.id))
      .returning();

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

workOrdersRouter.put("/:id", async (request, response) => {
  try {
    const payload = parseBody(updateWorkOrderSchema, request);
    const [current] = await db.select().from(workOrders).where(eq(workOrders.id, request.params.id));

    if (!current) {
      response.status(404).json({ ok: false, error: "Work order not found" });
      return;
    }

    const [updated] = await db
      .update(workOrders)
      .set({
        status: payload.status,
        promisedDate: payload.promisedDate ?? null,
        internalNotes: payload.internalNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, request.params.id))
      .returning();

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

workOrdersRouter.delete("/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(workOrders).where(eq(workOrders.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Work order not found" });
      return;
    }

    const [usage] = await db
      .select({
        paymentsCount: sql<number>`(select count(*) from ${payments} where ${payments.workOrderId} = ${workOrders.id})`,
        scheduleCount: sql<number>`(select count(*) from ${scheduleEntries} where ${scheduleEntries.workOrderId} = ${workOrders.id})`,
      })
      .from(workOrders)
      .where(eq(workOrders.id, request.params.id));

    if (Number(usage?.paymentsCount ?? 0) > 0 || Number(usage?.scheduleCount ?? 0) > 0) {
      response.status(409).json({ ok: false, error: "La orden tiene pagos o agenda vinculada y no se puede borrar." });
      return;
    }

    const [deleted] = await db.delete(workOrders).where(eq(workOrders.id, request.params.id)).returning();
    response.json({ ok: true, data: deleted });
  } catch (error) {
    handleRouteError(error, response);
  }
});
