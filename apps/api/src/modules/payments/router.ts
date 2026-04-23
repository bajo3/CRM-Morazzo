import { paymentMethodSchema } from "@crm/shared";
import { desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { cashMovements, clients, payments, quotes, workOrders } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const createPaymentSchema = z.object({
  clientId: z.string().uuid(),
  quoteId: z.string().uuid(),
  workOrderId: z.string().uuid().optional().nullable(),
  amountCents: z.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  paidAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const paymentsRouter = Router();

async function syncQuotePaymentState(quoteId: string) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

  if (!quote) {
    return;
  }

  const [paymentSummary] = await db
    .select({
      totalPaid: sql<number>`coalesce(sum(${payments.amountCents}), 0)`,
    })
    .from(payments)
    .where(eq(payments.quoteId, quoteId));

  const totalPaid = Number(paymentSummary?.totalPaid ?? 0);
  const isPaid = totalPaid >= quote.totalCents;

  await db
    .update(quotes)
    .set({
      status: isPaid ? "paid" : quote.status === "paid" ? "approved" : quote.status,
      paidAt: isPaid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));
}

paymentsRouter.get("/", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: payments.id,
        clientId: payments.clientId,
        clientName: clients.name,
        quoteId: payments.quoteId,
        quoteNumber: quotes.quoteNumber,
        workOrderId: payments.workOrderId,
        workOrderNumber: workOrders.workOrderNumber,
        amountCents: payments.amountCents,
        paymentMethod: payments.paymentMethod,
        paidAt: payments.paidAt,
        notes: payments.notes,
      })
      .from(payments)
      .innerJoin(clients, eq(payments.clientId, clients.id))
      .leftJoin(quotes, eq(payments.quoteId, quotes.id))
      .leftJoin(workOrders, eq(payments.workOrderId, workOrders.id))
      .orderBy(desc(payments.paidAt));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

paymentsRouter.post("/", async (request, response) => {
  try {
    const payload = parseBody(createPaymentSchema, request);
    const paymentDate = payload.paidAt ? new Date(payload.paidAt) : new Date();
    const [createdPayment] = await db
      .insert(payments)
      .values({
        id: uuidv7(),
        clientId: payload.clientId,
        quoteId: payload.quoteId,
        workOrderId: payload.workOrderId ?? null,
        amountCents: payload.amountCents,
        paymentMethod: payload.paymentMethod,
        paidAt: paymentDate,
        notes: payload.notes ?? null,
      })
      .returning();

    const [cashMovement] = await db
      .insert(cashMovements)
      .values({
        id: uuidv7(),
        type: "income",
        incomeCategory: "deposit",
        expenseCategory: null,
        clientId: payload.clientId,
        quoteId: payload.quoteId,
        paymentId: createdPayment.id,
        amountCents: payload.amountCents,
        movementDate: paymentDate,
        notes: payload.notes ?? "Ingreso desde pago",
      })
      .returning();

    await syncQuotePaymentState(payload.quoteId);

    response.status(201).json({
      ok: true,
      data: {
        payment: createdPayment,
        cashMovement,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

paymentsRouter.put("/:id", async (request, response) => {
  try {
    const payload = parseBody(createPaymentSchema, request);
    const [existingPayment] = await db.select().from(payments).where(eq(payments.id, request.params.id));

    if (!existingPayment) {
      response.status(404).json({ ok: false, error: "Payment not found" });
      return;
    }

    const paymentDate = payload.paidAt ? new Date(payload.paidAt) : existingPayment.paidAt;

    const [updatedPayment] = await db
      .update(payments)
      .set({
        clientId: payload.clientId,
        quoteId: payload.quoteId,
        workOrderId: payload.workOrderId ?? null,
        amountCents: payload.amountCents,
        paymentMethod: payload.paymentMethod,
        paidAt: paymentDate,
        notes: payload.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, request.params.id))
      .returning();

    const [existingMovement] = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.paymentId, request.params.id));

    const movementValues = {
      type: "income" as const,
      incomeCategory: "deposit" as const,
      expenseCategory: null,
      clientId: payload.clientId,
      quoteId: payload.quoteId,
      paymentId: request.params.id,
      amountCents: payload.amountCents,
      movementDate: paymentDate,
      notes: payload.notes ?? "Ingreso desde pago",
      updatedAt: new Date(),
    };

    let updatedMovement;

    if (existingMovement) {
      [updatedMovement] = await db
        .update(cashMovements)
        .set(movementValues)
        .where(eq(cashMovements.id, existingMovement.id))
        .returning();
    } else {
      [updatedMovement] = await db
        .insert(cashMovements)
        .values({
          id: uuidv7(),
          ...movementValues,
        })
        .returning();
    }

    await syncQuotePaymentState(existingPayment.quoteId ?? payload.quoteId);
    if (existingPayment.quoteId && existingPayment.quoteId !== payload.quoteId) {
      await syncQuotePaymentState(existingPayment.quoteId);
    }

    response.json({
      ok: true,
      data: {
        payment: updatedPayment,
        cashMovement: updatedMovement,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

paymentsRouter.delete("/:id", async (request, response) => {
  try {
    const [existingPayment] = await db.select().from(payments).where(eq(payments.id, request.params.id));

    if (!existingPayment) {
      response.status(404).json({ ok: false, error: "Payment not found" });
      return;
    }

    const [deletedMovement] = await db
      .delete(cashMovements)
      .where(eq(cashMovements.paymentId, request.params.id))
      .returning();
    const [deletedPayment] = await db.delete(payments).where(eq(payments.id, request.params.id)).returning();

    if (existingPayment.quoteId) {
      await syncQuotePaymentState(existingPayment.quoteId);
    }

    response.json({
      ok: true,
      data: {
        payment: deletedPayment,
        cashMovement: deletedMovement ?? null,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});
