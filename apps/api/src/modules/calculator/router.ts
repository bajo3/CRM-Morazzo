import { calculateQuoteItem, quoteItemCalculationInputSchema } from "@crm/shared";
import { Router } from "express";

import { handleRouteError, parseBody } from "../../lib/http";

export const calculatorRouter = Router();

calculatorRouter.post("/quote-item", (request, response) => {
  try {
    const payload = parseBody(quoteItemCalculationInputSchema, request);
    const result = calculateQuoteItem(payload);
    response.json({ ok: true, data: result });
  } catch (error) {
    handleRouteError(error, response);
  }
});

