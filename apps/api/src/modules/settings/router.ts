import { asc } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { glassTypes, serviceExtras } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

export const settingsRouter = Router();

settingsRouter.get("/glass-types", async (_request, response) => {
  try {
    const rows = await db.select().from(glassTypes).orderBy(asc(glassTypes.name), asc(glassTypes.thicknessMm));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

settingsRouter.get("/service-extras", async (_request, response) => {
  try {
    const rows = await db.select().from(serviceExtras).orderBy(asc(serviceExtras.name));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

