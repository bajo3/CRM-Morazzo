import { asc, eq } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { glassTypes, stockSheets } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const stockRouter = Router();

stockRouter.get("/sheets", async (_request, response) => {
  try {
    const rows = await db
      .select({
        id: stockSheets.id,
        typeLabel: stockSheets.typeLabel,
        thicknessMm: stockSheets.thicknessMm,
        color: stockSheets.color,
        widthMm: stockSheets.widthMm,
        heightMm: stockSheets.heightMm,
        sheetCount: stockSheets.sheetCount,
        location: stockSheets.location,
        glassName: glassTypes.name,
      })
      .from(stockSheets)
      .leftJoin(glassTypes, eq(stockSheets.glassTypeId, glassTypes.id))
      .orderBy(asc(stockSheets.typeLabel));

    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

