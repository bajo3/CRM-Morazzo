import { cashExpenseCategorySchema, cashIncomeCategorySchema, moneyCentsSchema } from "@crm/shared";
import { desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { cashMovements, clients, quotes } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const separator = "\n---\n";

const manualCashMovementSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    concept: z.string().min(2).max(140),
    category: z.string().min(1),
    amountCents: moneyCentsSchema.refine((value) => value > 0, "Amount must be positive"),
    movementDate: z.string().datetime().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "income") {
      const result = cashIncomeCategorySchema.safeParse(value.category);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid income category",
          path: ["category"],
        });
      }
    }

    if (value.type === "expense") {
      const result = cashExpenseCategorySchema.safeParse(value.category);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid expense category",
          path: ["category"],
        });
      }
    }
  });

function packNotes(concept: string, notes?: string | null) {
  return notes && notes.trim().length > 0 ? `${concept.trim()}${separator}${notes.trim()}` : concept.trim();
}

function unpackNotes(rawNotes: string | null) {
  if (!rawNotes) {
    return { concept: "", notes: null };
  }

  const [concept, notes] = rawNotes.split(separator);
  return {
    concept: concept ?? "",
    notes: notes ?? null,
  };
}

export const cashRouter = Router();

cashRouter.get("/summary", async (_request, response) => {
  try {
    const [incomeRow] = await db
      .select({ value: sql<number>`coalesce(sum(${cashMovements.amountCents}), 0)` })
      .from(cashMovements)
      .where(sql`${cashMovements.type} = 'income'`);

    const [expenseRow] = await db
      .select({ value: sql<number>`coalesce(sum(${cashMovements.amountCents}), 0)` })
      .from(cashMovements)
      .where(sql`${cashMovements.type} = 'expense'`);

    const recentRows = await db
      .select({
        id: cashMovements.id,
        type: cashMovements.type,
        amountCents: cashMovements.amountCents,
        movementDate: cashMovements.movementDate,
        incomeCategory: cashMovements.incomeCategory,
        expenseCategory: cashMovements.expenseCategory,
        paymentId: cashMovements.paymentId,
        clientId: cashMovements.clientId,
        clientName: clients.name,
        quoteId: cashMovements.quoteId,
        quoteNumber: quotes.quoteNumber,
        rawNotes: cashMovements.notes,
      })
      .from(cashMovements)
      .leftJoin(clients, eq(cashMovements.clientId, clients.id))
      .leftJoin(quotes, eq(cashMovements.quoteId, quotes.id))
      .orderBy(desc(cashMovements.movementDate))
      .limit(20);

    const recent = recentRows.map((row) => {
      const parsedNotes = unpackNotes(row.rawNotes);
      return {
        id: row.id,
        type: row.type,
        amountCents: row.amountCents,
        movementDate: row.movementDate,
        category: row.type === "income" ? row.incomeCategory : row.expenseCategory,
        paymentId: row.paymentId,
        clientId: row.clientId,
        clientName: row.clientName,
        quoteId: row.quoteId,
        quoteNumber: row.quoteNumber,
        concept: parsedNotes.concept || (row.paymentId ? "Pago registrado" : "Movimiento de caja"),
        notes: parsedNotes.notes,
      };
    });

    response.json({
      ok: true,
      data: {
        incomeCents: Number(incomeRow.value),
        expenseCents: Number(expenseRow.value),
        balanceCents: Number(incomeRow.value) - Number(expenseRow.value),
        recent,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

cashRouter.get("/movements", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: cashMovements.id,
        type: cashMovements.type,
        amountCents: cashMovements.amountCents,
        movementDate: cashMovements.movementDate,
        incomeCategory: cashMovements.incomeCategory,
        expenseCategory: cashMovements.expenseCategory,
        paymentId: cashMovements.paymentId,
        rawNotes: cashMovements.notes,
      })
      .from(cashMovements)
      .orderBy(desc(cashMovements.movementDate));

    response.json({
      ok: true,
      data: rows.map((row) => {
        const parsedNotes = unpackNotes(row.rawNotes);
        return {
          id: row.id,
          type: row.type,
          amountCents: row.amountCents,
          movementDate: row.movementDate,
          category: row.type === "income" ? row.incomeCategory : row.expenseCategory,
          paymentId: row.paymentId,
          concept: parsedNotes.concept || (row.paymentId ? "Pago registrado" : "Movimiento de caja"),
          notes: parsedNotes.notes,
          isEditable: row.paymentId === null,
        };
      }),
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

cashRouter.post("/movements", async (request, response) => {
  try {
    const payload = parseBody(manualCashMovementSchema, request);
    const [created] = await db
      .insert(cashMovements)
      .values({
        id: uuidv7(),
        type: payload.type,
        incomeCategory: payload.type === "income" ? cashIncomeCategorySchema.parse(payload.category) : null,
        expenseCategory: payload.type === "expense" ? cashExpenseCategorySchema.parse(payload.category) : null,
        amountCents: payload.amountCents,
        movementDate: payload.movementDate ? new Date(payload.movementDate) : new Date(),
        notes: packNotes(payload.concept, payload.notes),
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

cashRouter.put("/movements/:id", async (request, response) => {
  try {
    const payload = parseBody(manualCashMovementSchema, request);
    const [existing] = await db.select().from(cashMovements).where(eq(cashMovements.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Cash movement not found" });
      return;
    }

    if (existing.paymentId) {
      response.status(409).json({ ok: false, error: "Los movimientos originados por pagos se editan desde Pagos." });
      return;
    }

    const [updated] = await db
      .update(cashMovements)
      .set({
        type: payload.type,
        incomeCategory: payload.type === "income" ? cashIncomeCategorySchema.parse(payload.category) : null,
        expenseCategory: payload.type === "expense" ? cashExpenseCategorySchema.parse(payload.category) : null,
        amountCents: payload.amountCents,
        movementDate: payload.movementDate ? new Date(payload.movementDate) : existing.movementDate,
        notes: packNotes(payload.concept, payload.notes),
        updatedAt: new Date(),
      })
      .where(eq(cashMovements.id, request.params.id))
      .returning();

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

cashRouter.delete("/movements/:id", async (request, response) => {
  try {
    const [existing] = await db.select().from(cashMovements).where(eq(cashMovements.id, request.params.id));

    if (!existing) {
      response.status(404).json({ ok: false, error: "Cash movement not found" });
      return;
    }

    if (existing.paymentId) {
      response.status(409).json({ ok: false, error: "Los movimientos originados por pagos se borran desde Pagos." });
      return;
    }

    const [deleted] = await db.delete(cashMovements).where(eq(cashMovements.id, request.params.id)).returning();
    response.json({ ok: true, data: deleted });
  } catch (error) {
    handleRouteError(error, response);
  }
});
