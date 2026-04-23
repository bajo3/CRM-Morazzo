import { formatCurrencyFromCents } from "@crm/shared";

import { QuickActionCard } from "../../components/ui/quick-action-card";
import { StatusBadge } from "../../components/ui/status-badge";
import { TopHeader } from "../../components/layout/top-header";

const metrics = [
  { label: "Presupuestos del mes", value: "18" },
  { label: "Trabajos pendientes", value: "7" },
  { label: "Trabajos listos", value: "3" },
  { label: "Cobros pendientes", value: formatCurrencyFromCents(245000) },
  { label: "Stock bajo", value: "2 alertas" },
  { label: "Caja de hoy", value: formatCurrencyFromCents(132500) },
];

const upcoming = [
  { client: "Lucia Fernandez", job: "Mampara + instalacion", date: "24/04", status: "Agendado" },
  { client: "Estudio Norte", job: "Puerta blindex", date: "25/04", status: "A coordinar" },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <TopHeader
        title="Dashboard"
        description="Vista operativa del dia para seguir ventas, trabajos, cobros y entregas sin perder foco."
        action={<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">Nuevo presupuesto</button>}
      />

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
            {upcoming.map((item) => (
              <div key={`${item.client}-${item.job}`} className="flex flex-col gap-2 rounded-xl border border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium text-ink">{item.client}</p>
                  <p className="text-sm text-stone-600">{item.job}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-stone-600">{item.date}</p>
                  <StatusBadge tone={item.status === "Agendado" ? "success" : "warning"}>{item.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <QuickActionCard
            title="Alta rapida"
            description="Arranca por cliente y presupuesto sin abrir pantallas complejas."
            action={<button className="rounded-xl border border-accent px-4 py-2 text-sm font-semibold text-accent">Crear cliente</button>}
          />
          <QuickActionCard
            title="Smoke flow"
            description="El recorrido obligatorio queda definido para validar cliente, presupuesto, PDF, orden, pago y caja."
            action={<button className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">Ver recorrido</button>}
          />
        </div>
      </section>
    </div>
  );
}

