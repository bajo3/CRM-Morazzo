import { formatCurrencyFromCents } from "@crm/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { TopHeader } from "../../components/layout/top-header";
import { QuickActionCard } from "../../components/ui/quick-action-card";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiFetch } from "../../lib/api";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type DashboardSummary = {
  quotesMonth: number;
  pendingOrders: number;
  readyOrders: number;
  pendingPaymentsCents: number;
  lowStockCount: number;
  todayCashCents: number;
  upcoming: Array<{
    id: string;
    scheduledDate: string;
    timeLabel: string | null;
    address: string;
    jobType: string;
    status: string;
  }>;
};

const fallbackSummary: DashboardSummary = {
  quotesMonth: 0,
  pendingOrders: 0,
  readyOrders: 0,
  pendingPaymentsCents: 0,
  lowStockCount: 0,
  todayCashCents: 0,
  upcoming: [],
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [message, setMessage] = useState("Cargando indicadores del tablero.");

  useEffect(() => {
    let isMounted = true;

    apiFetch<ApiResponse<DashboardSummary>>("/dashboard/summary")
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setSummary(response.data);
        setMessage("Tablero conectado con Supabase.");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMessage("No se pudo cargar el dashboard. Se mantiene la UI lista para cuando la API responda.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = [
    { label: "Presupuestos", value: String(summary.quotesMonth) },
    { label: "Trabajos pendientes", value: String(summary.pendingOrders) },
    { label: "Trabajos listos", value: String(summary.readyOrders) },
    { label: "Cobros pendientes", value: formatCurrencyFromCents(summary.pendingPaymentsCents) },
    { label: "Stock bajo", value: `${summary.lowStockCount} alertas` },
    { label: "Caja neta", value: formatCurrencyFromCents(summary.todayCashCents) },
  ];

  return (
    <div className="space-y-6">
      <TopHeader
        title="Dashboard"
        description="Vista operativa del dia para seguir ventas, trabajos, cobros y entregas sin perder foco."
        action={
          <Link to="/presupuestos" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Nuevo presupuesto
          </Link>
        }
      />

      <div className="rounded-2xl border border-line bg-white p-4 text-sm text-stone-600 shadow-panel">{message}</div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-line bg-white p-5 shadow-panel">
            <p className="text-sm text-stone-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Proximos trabajos y entregas</h3>
            <StatusBadge tone="info">agenda</StatusBadge>
          </div>
          <div className="mt-4 space-y-3">
            {summary.upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-4 text-sm text-stone-600">
                Aun no hay movimientos en agenda.
              </div>
            ) : (
              summary.upcoming.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-ink">{item.jobType}</p>
                    <p className="text-sm text-stone-600">{item.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-stone-600">
                      {item.scheduledDate} {item.timeLabel ?? ""}
                    </p>
                    <StatusBadge tone={item.status === "scheduled" ? "success" : "warning"}>{item.status}</StatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <QuickActionCard
            title="Nuevo cliente"
            description="Empieza el flujo comercial desde el mostrador."
            action={
              <Link to="/clientes" className="rounded-xl border border-accent px-4 py-2 text-sm font-semibold text-accent">
                Ir a clientes
              </Link>
            }
          />
          <QuickActionCard
            title="Cerrar recorrido"
            description="Presupuesto, PDF, orden, pago y caja en un solo circuito de prueba."
            action={
              <Link to="/caja" className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">
                Ver caja
              </Link>
            }
          />
        </div>
      </section>
    </div>
  );
}
