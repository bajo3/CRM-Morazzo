import { paymentMethodSchema } from "@crm/shared";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { cashMovements, payments, quotes } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

const createPaymentSchema = z.object({
  clientId: z.string().uuid(),
  quoteId: z.string().uuid(),
  workOrderId: z.string().uuid().optional().nullable(),
  amountCents: z.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  notes: z.string().max(2000).optional().nullable(),
});

export const paymentsRouter = Router();

paymentsRouter.get("/", async (_request, response) => {
  try {
    const rows = await db.select().from(payments).orderBy(desc(payments.paidAt));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

paymentsRouter.post("/", async (request, response) => {
  try {
    const payload = parseBody(createPaymentSchema, request);
    const [createdPayment] = await db
      .insert(payments)
      .values({
        id: uuidv7(),
        clientId: payload.clientId,
        quoteId: payload.quoteId,
        workOrderId: payload.workOrderId ?? null,
        amountCents: payload.amountCents,
        paymentMethod: payload.paymentMethod,
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
        notes: payload.notes ?? "Ingreso desde pago",
      })
      .returning();

    const [quote] = await db.select().from(quotes).where(eq(quotes.id, payload.quoteId));

    if (quote) {
      const paidTotal = await db
        .select()
        .from(payments)
        .where(eq(payments.quoteId, payload.quoteId));

      const totalPaid = paidTotal.reduce((sum, payment) => sum + payment.amountCents, 0);
      if (totalPaid >= quote.totalCents) {
        await db
          .update(quotes)
          .set({
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, quote.id));
      }
    }

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

