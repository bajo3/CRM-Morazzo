import cors from "cors";
import express from "express";

import { cashRouter } from "./modules/cash/router";
import { calculatorRouter } from "./modules/calculator/router";
import { clientsRouter } from "./modules/clients/router";
import { dashboardRouter } from "./modules/dashboard/router";
import { healthRouter } from "./modules/health/router";
import { paymentsRouter } from "./modules/payments/router";
import { quotesRouter } from "./modules/quotes/router";
import { scheduleRouter } from "./modules/schedule/router";
import { settingsRouter } from "./modules/settings/router";
import { stockRouter } from "./modules/stock/router";
import { workOrdersRouter } from "./modules/work-orders/router";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/ping", (_request, response) => {
    response.json({ ok: true });
  });

  app.use("/api/cash", cashRouter);
  app.use("/api/calculator", calculatorRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/health", healthRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/quotes", quotesRouter);
  app.use("/api/schedule", scheduleRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/stock", stockRouter);
  app.use("/api/work-orders", workOrdersRouter);

  return app;
}
