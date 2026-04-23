import { sql } from "drizzle-orm";
import { Router } from "express";

import { db } from "../../db/client";
import { cashMovements } from "../../db/schema";
import { handleRouteError } from "../../lib/http";

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

    const recent = await db.select().from(cashMovements);

    response.json({
      ok: true,
      data: {
        incomeCents: incomeRow.value,
        expenseCents: expenseRow.value,
        balanceCents: incomeRow.value - expenseRow.value,
        recent,
      },
    });
  } catch (error) {
    handleRouteError(error, response);
  }
});

