import { createClientSchema } from "@crm/shared";
import { asc } from "drizzle-orm";
import { Router } from "express";
import { v7 as uuidv7 } from "uuid";

import { db } from "../../db/client";
import { clients } from "../../db/schema";
import { handleRouteError, parseBody } from "../../lib/http";

export const clientsRouter = Router();

clientsRouter.get("/", async (_request, response) => {
  try {
    const rows = await db.select().from(clients).orderBy(asc(clients.name));
    response.json({ ok: true, data: rows });
  } catch (error) {
    handleRouteError(error, response);
  }
});

clientsRouter.post("/", async (request, response) => {
  try {
    const payload = parseBody(createClientSchema, request);
    const [created] = await db
      .insert(clients)
      .values({
        id: uuidv7(),
        ...payload,
      })
      .returning();

    response.status(201).json({ ok: true, data: created });
  } catch (error) {
    handleRouteError(error, response);
  }
});

