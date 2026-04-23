import {
  calculateQuoteItem,
  calculateQuoteTotals,
  canTransitionQuoteStatus,
  createQuoteSchema,
  fromAreaBasisPoints,
  toAreaBasisPoints,
} from "@crm/shared";
import { and, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { clients, payments, quoteItems, quotes, workOrderItems, workOrders } from "../../db/schema";

function buildQuoteItemRows(
  quoteId: string,
  items: ReturnType<typeof createQuoteSchema.parse>["items"],
) {
  const calculatedItems = items.map((item) => calculateQuoteItem(item));
  const totals = calculateQuoteTotals(calculatedItems);

  return {
    totals,
    rows: items.map((item, index) => {
      const calculated = calculatedItems[index];
      return {
        id: uuidv7(),
        quoteId,
        glassTypeId: item.glassTypeId ?? null,
        description: item.description,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: item.quantity,
        unitPricePerM2Cents: item.pricePerM2Cents,
        areaM2: toAreaBasisPoints(calculated.areaM2),
        subtotalCents: calculated.baseSubtotalCents,
        extrasTotalCents: calculated.extrasTotalCents,
        totalCents: calculated.totalCents,
        extraBreakdown: calculated.extras,
      };
    }),
  };
}

export async function createQuote(payload: unknown) {
  const parsed = createQuoteSchema.parse(payload);
  const quoteId = uuidv7();
  const { totals, rows } = buildQuoteItemRows(quoteId, parsed.items);

  await db.transaction(async (tx) => {
    await tx.insert(quotes).values({
      id: quoteId,
      clientId: parsed.clientId,
      issueDate: parsed.issueDate,
      validUntil: parsed.validUntil ?? null,
      notes: parsed.notes ?? null,
      internalNotes: parsed.internalNotes ?? null,
      subtotalCents: totals.subtotalCents,
      extrasTotalCents: totals.extrasTotalCents,
      totalCents: totals.totalCents,
    });

    await tx.insert(quoteItems).values(rows);
  });

  return getQuoteDetail(quoteId);
}

export async function updateQuote(quoteId: string, payload: unknown) {
  const parsed = createQuoteSchema.parse(payload);

  const [existingQuote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
  if (!existingQuote) {
    return null;
  }

  if (existingQuote.status !== "draft" && existingQuote.status !== "sent") {
    throw new Error("Only draft or sent quotes can be edited");
  }

  const { totals, rows } = buildQuoteItemRows(quoteId, parsed.items);

  await db.transaction(async (tx) => {
    await tx
      .update(quotes)
      .set({
        clientId: parsed.clientId,
        issueDate: parsed.issueDate,
        validUntil: parsed.validUntil ?? null,
        notes: parsed.notes ?? null,
        internalNotes: parsed.internalNotes ?? null,
        subtotalCents: totals.subtotalCents,
        extrasTotalCents: totals.extrasTotalCents,
        totalCents: totals.totalCents,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
    await tx.insert(quoteItems).values(rows);
  });

  return getQuoteDetail(quoteId);
}

export async function getQuoteDetail(quoteId: string) {
  const [quote] = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      clientId: quotes.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientAddress: clients.address,
      status: quotes.status,
      issueDate: quotes.issueDate,
      validUntil: quotes.validUntil,
      notes: quotes.notes,
      internalNotes: quotes.internalNotes,
      subtotalCents: quotes.subtotalCents,
      extrasTotalCents: quotes.extrasTotalCents,
      totalCents: quotes.totalCents,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .where(eq(quotes.id, quoteId));

  if (!quote) {
    return null;
  }

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId));

  return {
    ...quote,
    items: items.map((item) => ({
      ...item,
      areaM2: fromAreaBasisPoints(item.areaM2),
    })),
  };
}

export async function listQuotes() {
  return db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      clientId: quotes.clientId,
      status: quotes.status,
      issueDate: quotes.issueDate,
      totalCents: quotes.totalCents,
      clientName: clients.name,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .orderBy(desc(quotes.createdAt));
}

export async function getWorkOrderDetail(workOrderId: string) {
  const [workOrder] = await db
    .select({
      id: workOrders.id,
      workOrderNumber: workOrders.workOrderNumber,
      quoteId: workOrders.quoteId,
      clientId: workOrders.clientId,
      clientName: clients.name,
      status: workOrders.status,
      promisedDate: workOrders.promisedDate,
      internalNotes: workOrders.internalNotes,
      createdAt: workOrders.createdAt,
    })
    .from(workOrders)
    .innerJoin(clients, eq(workOrders.clientId, clients.id))
    .where(eq(workOrders.id, workOrderId));

  if (!workOrder) {
    return null;
  }

  const items = await db.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId));

  return {
    ...workOrder,
    items,
  };
}

export async function approveQuote(quoteId: string) {
  const detail = await getQuoteDetail(quoteId);

  if (!detail) {
    return null;
  }

  if (!canTransitionQuoteStatus(detail.status, "approved") && detail.status !== "approved") {
    throw new Error(`Invalid transition from ${detail.status} to approved`);
  }

  const [updatedQuote] = await db
    .update(quotes)
    .set({
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId))
    .returning();

  const [existingWorkOrder] = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.quoteId, quoteId));

  if (existingWorkOrder) {
    return {
      quote: updatedQuote,
      workOrder: existingWorkOrder,
    };
  }

  const [workOrder] = await db
    .insert(workOrders)
    .values({
      id: uuidv7(),
      quoteId: detail.id,
      clientId: detail.clientId,
      status: "pending",
      promisedDate: detail.validUntil ?? null,
      internalNotes: detail.internalNotes ?? null,
    })
    .returning();

  await db.insert(workOrderItems).values(
    detail.items.map((item) => ({
      id: uuidv7(),
      workOrderId: workOrder.id,
      description: item.description,
      glassLabel: item.description,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      quantity: item.quantity,
    })),
  );

  return {
    quote: updatedQuote,
    workOrder,
  };
}

export async function getWorkOrderByQuote(quoteId: string) {
  const [workOrder] = await db
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.quoteId, quoteId), eq(workOrders.status, workOrders.status)));

  return workOrder ?? null;
}

export async function deleteQuote(quoteId: string) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

  if (!quote) {
    return { status: "not_found" } as const;
  }

  if (quote.status !== "draft" && quote.status !== "sent") {
    return { status: "blocked", reason: "Solo se pueden borrar presupuestos en borrador o enviados." } as const;
  }

  const [workOrder] = await db.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.quoteId, quoteId));
  if (workOrder) {
    return { status: "blocked", reason: "El presupuesto ya genero una orden de trabajo." } as const;
  }

  const [payment] = await db.select({ id: payments.id }).from(payments).where(eq(payments.quoteId, quoteId));
  if (payment) {
    return { status: "blocked", reason: "El presupuesto ya tiene pagos registrados." } as const;
  }

  const [deleted] = await db.delete(quotes).where(eq(quotes.id, quoteId)).returning();
  return { status: "deleted", data: deleted } as const;
}
