import { createGlassTypeSchema, createServiceExtraSchema, integerMmSchema } from "@crm/shared";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { glassTypes, quoteItems, serviceExtras, stockSheets, templates } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(2000),
  defaultWidthMm: integerMmSchema.optional().nullable(),
  defaultHeightMm: integerMmSchema.optional().nullable(),
  defaultQuantity: z.number().int().positive(),
  defaultGlassLabel: z.string().max(160).optional().nullable(),
});

export const settingsRouter = Router();

settingsRouter.get("/glass-types", async (_request, response) => {
  try {
    const rows = await db
      .select()
      .from(glassTypes)
      .orderBy(desc(glassTypes.isActive), asc(glassTypes.name), asc(glassTypes.thicknessMm));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.post("/glass-types", async (request, response) => {
  try {
    const payload = parseBody(createGlassTypeSchema, request);
    const [created] = await db
      .insert(glassTypes)
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

settingsRouter.put("/glass-types/:id", async (request, response) => {
  try {
    const payload = parseBody(createGlassTypeSchema.extend({ isActive: z.boolean().optional() }), request);
    const [updated] = await db
      .update(glassTypes)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(glassTypes.id, request.params.id))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Glass type not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.delete("/glass-types/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(glassTypes).where(eq(glassTypes.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Glass type not found" });
      return;
    }

    const [usage] = await db
      .select({
        quoteItemsCount: sql<number>`(select count(*) from ${quoteItems} where ${quoteItems.glassTypeId} = ${glassTypes.id})`,
        stockSheetsCount: sql<number>`(select count(*) from ${stockSheets} where ${stockSheets.glassTypeId} = ${glassTypes.id})`,
      })
      .from(glassTypes)
      .where(eq(glassTypes.id, request.params.id));

    const hasUsage = Number(usage?.quoteItemsCount ?? 0) > 0 || Number(usage?.stockSheetsCount ?? 0) > 0;

    if (hasUsage) {
      const [archived] = await db
        .update(glassTypes)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(glassTypes.id, request.params.id))
        .returning();

      response.json({ ok: true, data: { mode: "archived", item: archived } });
      return;
    }

    const [deleted] = await db.delete(glassTypes).where(eq(glassTypes.id, request.params.id)).returning();
    response.json({ ok: true, data: { mode: "deleted", item: deleted } });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.get("/service-extras", async (_request, response) => {
  try {
    const rows = await db.select().from(serviceExtras).orderBy(desc(serviceExtras.isActive), asc(serviceExtras.name));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.post("/service-extras", async (request, response) => {
  try {
    const payload = parseBody(createServiceExtraSchema, request);
    const [created] = await db
      .insert(serviceExtras)
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

settingsRouter.put("/service-extras/:id", async (request, response) => {
  try {
    const payload = parseBody(createServiceExtraSchema.extend({ isActive: z.boolean().optional() }), request);
    const [updated] = await db
      .update(serviceExtras)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(serviceExtras.id, request.params.id))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Extra not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.delete("/service-extras/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(serviceExtras).where(eq(serviceExtras.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Extra not found" });
      return;
    }

    const [archived] = await db
      .update(serviceExtras)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(serviceExtras.id, request.params.id))
      .returning();

    response.json({ ok: true, data: { mode: "archived", item: archived } });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.get("/templates", async (_request, response) => {
  try {
    const rows = await db
      .select()
      .from(templates)
      .where(isNull(templates.deletedAt))
      .orderBy(asc(templates.name));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.post("/templates", async (request, response) => {
  try {
    const payload = parseBody(createTemplateSchema, request);
    const [created] = await db
      .insert(templates)
      .values({
        id: uuidv7(),
        ...payload,
        defaultGlassLabel: payload.defaultGlassLabel ?? null,
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.put("/templates/:id", async (request, response) => {
  try {
    const payload = parseBody(createTemplateSchema, request);
    const [updated] = await db
      .update(templates)
      .set({
        ...payload,
        defaultGlassLabel: payload.defaultGlassLabel ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(templates.id, request.params.id), isNull(templates.deletedAt)))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Template not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.delete("/templates/:id", async (request, response) => {
  try {
    const [updated] = await db
      .update(templates)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(templates.id, request.params.id), isNull(templates.deletedAt)))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Template not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});
