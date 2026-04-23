import { stockMovementTypes } from "@crm/shared";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { glassTypes, stockMovements, stockSheets } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const stockSheetSchema = z.object({
  glassTypeId: z.string().uuid().optional().nullable(),
  typeLabel: z.string().min(2).max(120),
  thicknessMm: z.number().int().positive(),
  color: z.string().min(2).max(80),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  sheetCount: z.number().int().nonnegative(),
  location: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const stockMovementSchema = z.object({
  stockSheetId: z.string().uuid(),
  type: z.enum(stockMovementTypes),
  quantity: z.number().int().positive(),
  notes: z.string().max(2000).optional().nullable(),
});

function getMovementDelta(type: (typeof stockMovementTypes)[number], quantity: number) {
  if (type === "in") {
    return quantity;
  }

  return -quantity;
}

export const stockRouter = Router();

stockRouter.get("/sheets", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: stockSheets.id,
        glassTypeId: stockSheets.glassTypeId,
        typeLabel: stockSheets.typeLabel,
        thicknessMm: stockSheets.thicknessMm,
        color: stockSheets.color,
        widthMm: stockSheets.widthMm,
        heightMm: stockSheets.heightMm,
        sheetCount: stockSheets.sheetCount,
        location: stockSheets.location,
        notes: stockSheets.notes,
        glassName: glassTypes.name,
      })
      .from(stockSheets)
      .leftJoin(glassTypes, eq(stockSheets.glassTypeId, glassTypes.id))
      .orderBy(asc(stockSheets.typeLabel), asc(stockSheets.widthMm));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.post("/sheets", async (request, response) => {
  try {
    const payload = parseBody(stockSheetSchema, request);
    const [created] = await db
      .insert(stockSheets)
      .values({
        id: uuidv7(),
        glassTypeId: payload.glassTypeId ?? null,
        typeLabel: payload.typeLabel,
        thicknessMm: payload.thicknessMm,
        color: payload.color,
        widthMm: payload.widthMm,
        heightMm: payload.heightMm,
        sheetCount: payload.sheetCount,
        location: payload.location ?? null,
        notes: payload.notes ?? null,
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.put("/sheets/:id", async (request, response) => {
  try {
    const payload = parseBody(stockSheetSchema, request);
    const [updated] = await db
      .update(stockSheets)
      .set({
        glassTypeId: payload.glassTypeId ?? null,
        typeLabel: payload.typeLabel,
        thicknessMm: payload.thicknessMm,
        color: payload.color,
        widthMm: payload.widthMm,
        heightMm: payload.heightMm,
        sheetCount: payload.sheetCount,
        location: payload.location ?? null,
        notes: payload.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(stockSheets.id, request.params.id))
      .returning();

    if (!updated) {
      response.status(404).json({ ok: false, error: "Stock sheet not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.delete("/sheets/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(stockSheets).where(eq(stockSheets.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Stock sheet not found" });
      return;
    }

    const [movementCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(stockMovements)
      .where(eq(stockMovements.stockSheetId, request.params.id));

    if (Number(movementCount?.count ?? 0) > 0) {
      response.status(409).json({ ok: false, error: "La hoja tiene movimientos asociados y no se puede borrar." });
      return;
    }

    const [deleted] = await db.delete(stockSheets).where(eq(stockSheets.id, request.params.id)).returning();
    response.json({ ok: true, data: deleted });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.get("/movements", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: stockMovements.id,
        stockSheetId: stockMovements.stockSheetId,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
        typeLabel: stockSheets.typeLabel,
        location: stockSheets.location,
      })
      .from(stockMovements)
      .innerJoin(stockSheets, eq(stockMovements.stockSheetId, stockSheets.id))
      .orderBy(desc(stockMovements.createdAt));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.post("/movements", async (request, response) => {
  try {
    const payload = parseBody(stockMovementSchema, request);
    const [created] = await db.transaction(async (tx) => {
      const delta = getMovementDelta(payload.type, payload.quantity);
      const [sheet] = await tx.select().from(stockSheets).where(eq(stockSheets.id, payload.stockSheetId));

      if (!sheet) {
        throw new Error("Stock sheet not found");
      }

      const nextCount = sheet.sheetCount + delta;
      if (nextCount < 0) {
        throw new Error("Stock cannot be negative");
      }

      await tx
        .update(stockSheets)
        .set({
          sheetCount: nextCount,
          updatedAt: new Date(),
        })
        .where(eq(stockSheets.id, payload.stockSheetId));

      return tx
        .insert(stockMovements)
        .values({
          id: uuidv7(),
          stockSheetId: payload.stockSheetId,
          type: payload.type,
          quantity: payload.quantity,
          notes: payload.notes ?? null,
        })
        .returning();
    });

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.put("/movements/:id", async (request, response) => {
  try {
    const payload = parseBody(stockMovementSchema, request);
    const [existing] = await db.select().from(stockMovements).where(eq(stockMovements.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Stock movement not found" });
      return;
    }

    const [updated] = await db.transaction(async (tx) => {
      const revertDelta = -getMovementDelta(existing.type, existing.quantity);
      const nextDelta = getMovementDelta(payload.type, payload.quantity);

      const [oldSheet] = await tx.select().from(stockSheets).where(eq(stockSheets.id, existing.stockSheetId));
      const [newSheet] = await tx.select().from(stockSheets).where(eq(stockSheets.id, payload.stockSheetId));

      if (!oldSheet || !newSheet) {
        throw new Error("Stock sheet not found");
      }

      const oldSheetNextCount = oldSheet.id === newSheet.id ? oldSheet.sheetCount + revertDelta + nextDelta : oldSheet.sheetCount + revertDelta;
      const newSheetNextCount = oldSheet.id === newSheet.id ? oldSheetNextCount : newSheet.sheetCount + nextDelta;

      if (oldSheetNextCount < 0 || newSheetNextCount < 0) {
        throw new Error("Stock cannot be negative");
      }

      await tx
        .update(stockSheets)
        .set({
          sheetCount: oldSheetNextCount,
          updatedAt: new Date(),
        })
        .where(eq(stockSheets.id, oldSheet.id));

      if (oldSheet.id !== newSheet.id) {
        await tx
          .update(stockSheets)
          .set({
            sheetCount: newSheetNextCount,
            updatedAt: new Date(),
          })
          .where(eq(stockSheets.id, newSheet.id));
      }

      return tx
        .update(stockMovements)
        .set({
          stockSheetId: payload.stockSheetId,
          type: payload.type,
          quantity: payload.quantity,
          notes: payload.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(stockMovements.id, request.params.id))
        .returning();
    });

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.delete("/movements/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(stockMovements).where(eq(stockMovements.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Stock movement not found" });
      return;
    }

    const [deleted] = await db.transaction(async (tx) => {
      const revertDelta = -getMovementDelta(existing.type, existing.quantity);
      const [sheet] = await tx.select().from(stockSheets).where(eq(stockSheets.id, existing.stockSheetId));

      if (!sheet) {
        throw new Error("Stock sheet not found");
      }

      const nextCount = sheet.sheetCount + revertDelta;
      if (nextCount < 0) {
        throw new Error("Stock cannot be negative");
      }

      await tx
        .update(stockSheets)
        .set({
          sheetCount: nextCount,
          updatedAt: new Date(),
        })
        .where(eq(stockSheets.id, existing.stockSheetId));

      return tx.delete(stockMovements).where(eq(stockMovements.id, request.params.id)).returning();
    });

    response.json({ ok: true, data: deleted });
  } catch (error) {
    handleRouteError(error, response);
  }
});

stockRouter.get("/summary", async (_request, response) => {
  try {
    const rows = await db.select().from(stockSheets);
    const lowStock = rows.filter((item) => item.sheetCount <= 1);

    response.json({
      ok: true,
      data: {
        totalSheets: rows.reduce((sum, item) => sum + item.sheetCount, 0),
        lowStockCount: lowStock.length,
        lowStock,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});
