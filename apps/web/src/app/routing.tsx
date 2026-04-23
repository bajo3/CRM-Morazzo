import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/app-shell";
import { CalculatorPage } from "../features/calculator/calculator-page";
import { ClientsPage } from "../features/clients/clients-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { PlaceholderPage } from "../features/placeholder/placeholder-page";
import { SettingsPage } from "../features/settings/settings-page";

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
        element: (
          <PlaceholderPage
            title="Presupuestos"
            description="Se apoya en la formula compartida, PDF en backend y estados centralizados."
          />
        ),
      },
      {
        path: "ordenes",
        element: (
          <PlaceholderPage
            title="Ordenes de trabajo"
            description="Nacen desde presupuesto aprobado y siguen un estado operativo simple."
          />
        ),
      },
      {
        path: "stock",
        element: (
          <PlaceholderPage
            title="Stock"
            description="Stock simple de hojas enteras con movimientos de ingreso, uso, rotura y ajuste."
          />
        ),
      },
      {
        path: "caja",
        element: (
          <PlaceholderPage
            title="Caja"
            description="Caja simple con ingresos, egresos y trazabilidad de pagos."
          />
        ),
      },
      {
        path: "agenda",
        element: (
          <PlaceholderPage
            title="Agenda"
            description="Entregas y colocaciones con estado, fecha, horario y observaciones."
          />
        ),
      },
    ],
  },
]);
