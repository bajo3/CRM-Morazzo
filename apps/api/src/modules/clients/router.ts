import { createClientSchema } from "@crm/shared";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { Router } from "express";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { clients, payments, quotes, scheduleEntries, workOrders } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

export const clientsRouter = Router();

clientsRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        address: clients.address,
        jobSite: clients.jobSite,
        notes: clients.notes,
      })
      .from(clients)
      .where(isNull(clients.deletedAt))
      .orderBy(asc(clients.name));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

clientsRouter.post("/", async (request, response) => {
  try {
    const payload = parseBody(createClientSchema, request);
    const [created] = await db
      .insert(clients)
      .values({
        id: uuidv7(),
        ...payload,
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

clientsRouter.put("/:id", async (request, response) => {
  try {
    const payload = parseBody(createClientSchema, request);
    const [updated] = await db
      .update(clients)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, request.params.id), isNull(clients.deletedAt)))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Client not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

clientsRouter.delete("/:id", async (request, response) => {
  try {
    const [existing] = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(and(eq(clients.id, request.params.id), isNull(clients.deletedAt)));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Client not found" });
      return;
    }

    const [related] = await db
      .select({
        quotesCount: sql<number>`(select count(*) from ${quotes} where ${quotes.clientId} = ${clients.id})`,
        workOrdersCount: sql<number>`(select count(*) from ${workOrders} where ${workOrders.clientId} = ${clients.id})`,
        paymentsCount: sql<number>`(select count(*) from ${payments} where ${payments.clientId} = ${clients.id})`,
        scheduleCount: sql<number>`(select count(*) from ${scheduleEntries} where ${scheduleEntries.clientId} = ${clients.id})`,
      })
      .from(clients)
      .where(eq(clients.id, request.params.id));

    const qc = Number(related?.quotesCount ?? 0);
    const wc = Number(related?.workOrdersCount ?? 0);
    const pc = Number(related?.paymentsCount ?? 0);
    const sc = Number(related?.scheduleCount ?? 0);
    const hasHistory = qc > 0 || wc > 0 || pc > 0 || sc > 0;

    if (hasHistory) {
      const parts: string[] = [];
      if (qc > 0) parts.push(`${qc} presupuesto${qc > 1 ? "s" : ""}`);
      if (wc > 0) parts.push(`${wc} orden${wc > 1 ? "es" : ""}`);
      if (pc > 0) parts.push(`${pc} pago${pc > 1 ? "s" : ""}`);
      if (sc > 0) parts.push(`${sc} entrada${sc > 1 ? "s" : ""} de agenda`);
      response.status(409).json({
        ok: false,
        error: `No se puede eliminar: ${existing.name} tiene ${parts.join(", ")}.`,
      });
      return;
    }

    const [deleted] = await db.delete(clients).where(eq(clients.id, request.params.id)).returning();
    response.json({ ok: true, data: { mode: "deleted", client: deleted } });
  } catch (error) {
    handleRouteError(error, response);
  }
});
