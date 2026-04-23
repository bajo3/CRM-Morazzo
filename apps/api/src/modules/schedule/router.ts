import { canTransitionScheduleStatus, scheduleStatusSchema } from "@crm/shared";
import { asc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { clients, scheduleEntries, workOrders } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const scheduleSchema = z.object({
  clientId: z.string().uuid(),
  workOrderId: z.string().uuid().optional().nullable(),
  status: scheduleStatusSchema,
  address: z.string().min(2).max(255),
  scheduledDate: z.string().min(1),
  timeLabel: z.string().max(80).optional().nullable(),
  jobType: z.string().min(2).max(120),
  notes: z.string().max(2000).optional().nullable(),
});

const updateScheduleStatusSchema = z.object({
  status: scheduleStatusSchema,
});

export const scheduleRouter = Router();

scheduleRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: scheduleEntries.id,
        clientId: scheduleEntries.clientId,
        workOrderId: scheduleEntries.workOrderId,
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
      .orderBy(asc(scheduleEntries.scheduledDate), asc(scheduleEntries.timeLabel));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

scheduleRouter.post("/", async (request, response) => {
  try {
    const payload = parseBody(scheduleSchema, request);
    const [created] = await db
      .insert(scheduleEntries)
      .values({
        id: uuidv7(),
        clientId: payload.clientId,
        workOrderId: payload.workOrderId ?? null,
        status: payload.status,
        address: payload.address,
        scheduledDate: payload.scheduledDate,
        timeLabel: payload.timeLabel ?? null,
        jobType: payload.jobType,
        notes: payload.notes ?? null,
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

scheduleRouter.put("/:id", async (request, response) => {
  try {
    const payload = parseBody(scheduleSchema, request);
    const [updated] = await db
      .update(scheduleEntries)
      .set({
        clientId: payload.clientId,
        workOrderId: payload.workOrderId ?? null,
        status: payload.status,
        address: payload.address,
        scheduledDate: payload.scheduledDate,
        timeLabel: payload.timeLabel ?? null,
        jobType: payload.jobType,
        notes: payload.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(scheduleEntries.id, request.params.id))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Schedule entry not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

scheduleRouter.patch("/:id/status", async (request, response) => {
  try {
    const payload = parseBody(updateScheduleStatusSchema, request);
    const [existing] = await db.select().from(scheduleEntries).where(eq(scheduleEntries.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Schedule entry not found" });
      return;
    }

    if (existing.status !== payload.status && !canTransitionScheduleStatus(existing.status, payload.status)) {
      response.status(400).json({ ok: false, error: `Invalid transition from ${existing.status} to ${payload.status}` });
      return;
    }

    const [updated] = await db
      .update(scheduleEntries)
      .set({
        status: payload.status,
        updatedAt: new Date(),
      })
      .where(eq(scheduleEntries.id, request.params.id))
      .returning();

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

scheduleRouter.delete("/:id", async (request, response) => {
  try {
    const [deleted] = await db.delete(scheduleEntries).where(eq(scheduleEntries.id, request.params.id)).returning();

    if (!deleted) {
      response.status(404).json({ ok: false, error: "Schedule entry not found" });
      return;
    }

    response.json({ ok: true, data: deleted });
  } catch (error) {
    handleRouteError(error, response);
  }
});
