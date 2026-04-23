import { Router } from "express";

import { handleRouteError } from "../../lib/http";
import { buildQuotePdf } from "./pdf";
import { approveQuote, createQuote, deleteQuote, getQuoteDetail, listQuotes, updateQuote } from "./service";

export const quotesRouter = Router();

quotesRouter.get("/", async (_request, response) => {
  try {
    const rows = await listQuotes();
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.post("/", async (request, response) => {
  try {
    const created = await createQuote(request.body);
    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.get("/:id", async (request, response) => {
  try {
    const detail = await getQuoteDetail(request.params.id);

    if (!detail) {
      response.status(404).json({ ok: false, error: "Quote not found" });
      return;
    }

    response.json({ ok: true, data: detail });
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.put("/:id", async (request, response) => {
  try {
    const updated = await updateQuote(request.params.id, request.body);

    if (!updated) {
      response.status(404).json({ ok: false, error: "Quote not found" });
      return;
    }

    response.json({ ok: true, data: updated });
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.get("/:id/pdf", async (request, response) => {
  try {
    const detail = await getQuoteDetail(request.params.id);

    if (!detail) {
      response.status(404).json({ ok: false, error: "Quote not found" });
      return;
    }

    const pdfBytes = await buildQuotePdf({
      quoteNumber: detail.quoteNumber,
      issueDate: detail.issueDate,
      validUntil: detail.validUntil,
      clientName: detail.clientName,
      clientPhone: detail.clientPhone,
      clientAddress: detail.clientAddress,
      notes: detail.notes,
      subtotalCents: detail.subtotalCents,
      extrasTotalCents: detail.extrasTotalCents,
      totalCents: detail.totalCents,
      items: detail.items.map((item) => ({
        description: item.description,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: item.quantity,
        totalCents: item.totalCents,
      })),
    });

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `inline; filename="${detail.quoteNumber}.pdf"`);
    response.send(Buffer.from(pdfBytes));
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.post("/:id/approve", async (request, response) => {
  try {
    const result = await approveQuote(request.params.id);

    if (!result) {
      response.status(404).json({ ok: false, error: "Quote not found" });
      return;
    }

    response.json({ ok: true, data: result });
  } catch (error) {
    handleRouteError(error, response);
  }
});

quotesRouter.delete("/:id", async (request, response) => {
  try {
    const result = await deleteQuote(request.params.id);

    if (result.status === "not_found") {
      response.status(404).json({ ok: false, error: "Quote not found" });
      return;
    }

    if (result.status === "blocked") {
      response.status(409).json({ ok: false, error: result.reason });
      return;
    }

    response.json({ ok: true, data: result.data });
  } catch (error) {
    handleRouteError(error, response);
  }
});
