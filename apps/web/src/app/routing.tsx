import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/app-shell";
import { CalculatorPage } from "../features/calculator/calculator-page";
import { CashPage } from "../features/cash/cash-page";
import { ClientsPage } from "../features/clients/clients-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { QuotesPage } from "../features/quotes/quotes-page";
import { SchedulePage } from "../features/schedule/schedule-page";
import { SettingsPage } from "../features/settings/settings-page";
import { StockPage } from "../features/stock/stock-page";
import { WorkOrdersPage } from "../features/work-orders/work-orders-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "configuracion",
        element: <SettingsPage />,
      },
      {
        path: "calculadora",
        element: <CalculatorPage />,
      },
      {
        path: "clientes",
        element: <ClientsPage />,
      },
      {
        path: "presupuestos",
        element: <QuotesPage />,
      },
      {
        path: "ordenes",
        element: <WorkOrdersPage />,
      },
      {
        path: "stock",
        element: <StockPage />,
      },
      {
        path: "caja",
        element: <CashPage />,
      },
      {
        path: "agenda",
        element: <SchedulePage />,
      },
    ],
  },
]);
