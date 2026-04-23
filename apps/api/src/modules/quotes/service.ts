import {
  calculateQuoteItem,
  calculateQuoteTotals,
  canTransitionQuoteStatus,
  createQuoteSchema,
  formatQuoteNumber,
  formatWorkOrderNumber,
  fromAreaBasisPoints,
  toAreaBasisPoints,
} from "@crm/shared";
import { and, count, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { clients, quoteItems, quotes, workOrderItems, workOrders } from "../../db/schema";

export async function nextQuoteNumber() {
  const [result] = await db.select({ value: count() }).from(quotes);
  return formatQuoteNumber(result.value + 1);
}

export async function nextWorkOrderNumber() {
  const [result] = await db.select({ value: count() }).from(workOrders);
  return formatWorkOrderNumber(result.value + 1);
}

export async function createQuote(payload: unknown) {
  const parsed = createQuoteSchema.parse(payload);
  const calculatedItems = parsed.items.map((item) => calculateQuoteItem(item));
  const totals = calculateQuoteTotals(calculatedItems);

  const [createdQuote] = await db
    .insert(quotes)
    .values({
      id: uuidv7(),
      quoteNumber: await nextQuoteNumber(),
      clientId: parsed.clientId,
      issueDate: parsed.issueDate,
      validUntil: parsed.validUntil ?? null,
      notes: parsed.notes ?? null,
      internalNotes: parsed.internalNotes ?? null,
      subtotalCents: totals.subtotalCents,
      extrasTotalCents: totals.extrasTotalCents,
      totalCents: totals.totalCents,
    })
    .returning();

  await db.insert(quoteItems).values(
    parsed.items.map((item, index) => {
      const calculated = calculatedItems[index];
      return {
        id: uuidv7(),
        quoteId: createdQuote.id,
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
  );

  return getQuoteDetail(createdQuote.id);
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
      status: quotes.status,
      issueDate: quotes.issueDate,
      totalCents: quotes.totalCents,
      clientName: clients.name,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id));
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
      workOrderNumber: await nextWorkOrderNumber(),
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

