import { formatCurrencyFromCents } from "@crm/shared";
import { Link } from "react-router-dom";

import { TopHeader } from "../../components/layout/top-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { StatCardSkeleton } from "../../components/ui/skeleton";
import { useDashboardSummary } from "../../lib/queries";

function scheduleStatusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "rescheduled") return "warning";
  if (status === "scheduled") return "info";
  return "neutral";
}

function scheduleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    to_schedule: "A coordinar",
    scheduled: "Agendada",
    completed: "Realizada",
    rescheduled: "Reprogramada",
  };
  return labels[status] ?? status;
}

const fallbackSummary = {
  pendingQuotes: 0,
  approvedQuotes: 0,
  pendingOrders: 0,
  readyOrders: 0,
  overdueOrders: 0,
  pendingPaymentsCents: 0,
  lowStockCount: 0,
  todayCashCents: 0,
  upcoming: [] as Array<{
    id: string;
    scheduledDate: string;
    timeLabel: string | null;
    address: string;
    jobType: string;
    status: string;
    clientName: string | null;
  }>,
};

export function DashboardPage() {
  const { data: summary = fallbackSummary, isLoading, isError } = useDashboardSummary();

  const hasOverdue = summary.overdueOrders > 0;
  const hasLowStock = summary.lowStockCount > 0;

  return (
    <div className="space-y-6">
      <TopHeader
        title="Tablero"
        description="Vista operativa del día: presupuestos, trabajos, cobros y agenda."
        action={
          <Link to="/presupuestos" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Nuevo presupuesto
          </Link>
        }
      />

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          No se pudo cargar el tablero. Revisá la conexión con la API.
        </div>
      ) : null}

      {/* Alertas urgentes */}
      {!isLoading && (hasOverdue || hasLowStock) ? (
        <div className="flex flex-wrap gap-3">
          {hasOverdue ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
              <span>⚠</span>
              <span>{summary.overdueOrders} {summary.overdueOrders === 1 ? "trabajo atrasado" : "trabajos atrasados"}</span>
              <Link to="/ordenes" className="ml-1 underline underline-offset-2">
                Ver órdenes →
              </Link>
            </div>
          ) : null}
          {hasLowStock ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
              <span>!</span>
              <span>{summary.lowStockCount} {summary.lowStockCount === 1 ? "material con stock bajo" : "materiales con stock bajo"}</span>
              <Link to="/stock" className="ml-1 underline underline-offset-2">
                Ver stock →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Métricas operativas */}
      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </section>
      ) : null}
      <section className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isLoading ? "hidden" : ""}`}>
        <MetricCard
          label="Presupuestos pendientes"
          value={String(summary.pendingQuotes)}
          sublabel="Borrador o enviados"
          href="/presupuestos"
        />
        <MetricCard
          label="Órdenes en proceso"
          value={String(summary.pendingOrders)}
          sublabel="Pendientes, en corte o producción"
          href="/ordenes"
        />
        <MetricCard
          label="Trabajos atrasados"
          value={String(summary.overdueOrders)}
          sublabel="Fecha prometida vencida"
          href="/ordenes"
          tone={hasOverdue ? "danger" : "neutral"}
        />
        <MetricCard
          label="Por cobrar"
          value={formatCurrencyFromCents(summary.pendingPaymentsCents)}
          sublabel="Saldo pendiente de cobro"
          href="/caja"
          tone="info"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        {/* Agenda próxima */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Agenda próxima</h3>
            <Link to="/agenda" className="text-xs font-semibold text-accent hover:underline">
              Ver todo →
            </Link>
          </div>

          {isLoading ? <AgendaSkeleton /> : null}

          {!isLoading && summary.upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-stone-500">
              No hay trabajos agendados para los próximos días.
              <Link to="/agenda" className="mt-2 block text-xs font-semibold text-accent hover:underline">
                Crear agenda →
              </Link>
            </div>
          ) : null}

          {!isLoading && summary.upcoming.length > 0 ? (
            <div className="space-y-2">
              {summary.upcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.jobType}</p>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {item.clientName ? `${item.clientName} · ` : ""}
                      {item.address}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-xs font-medium text-stone-600">
                      {item.scheduledDate}{item.timeLabel ? ` · ${item.timeLabel}` : ""}
                    </p>
                    <StatusBadge tone={scheduleStatusTone(item.status)}>
                      {scheduleStatusLabel(item.status)}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Panel lateral: métricas secundarias + acciones rápidas */}
        <div className="space-y-4">
          {/* Métricas secundarias */}
          <div className="grid grid-cols-2 gap-3">
            <SmallCard
              label="Aprobados"
              value={isLoading ? "—" : String(summary.approvedQuotes)}
              href="/presupuestos"
            />
            <SmallCard
              label="Listos p/ entregar"
              value={isLoading ? "—" : String(summary.readyOrders)}
              href="/ordenes"
            />
            <SmallCard
              label="Stock bajo"
              value={isLoading ? "—" : `${summary.lowStockCount} alertas`}
              href="/stock"
              tone={hasLowStock ? "warning" : "neutral"}
            />
            <SmallCard
              label="Caja hoy"
              value={isLoading ? "—" : formatCurrencyFromCents(summary.todayCashCents)}
              href="/caja"
            />

          </div>

          {/* Acciones rápidas */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-panel">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Acciones rápidas</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/clientes"
                className="flex items-center justify-center rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-accent hover:text-accent"
              >
                Nuevo cliente
              </Link>
              <Link
                to="/presupuestos"
                className="flex items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Nuevo presupuesto
              </Link>
              <Link
                to="/caja"
                className="flex items-center justify-center rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-accent hover:text-accent"
              >
                Registrar pago
              </Link>
              <Link
                to="/agenda"
                className="flex items-center justify-center rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-accent hover:text-accent"
              >
                Ver agenda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sublabel: string;
  href?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const bg: Record<string, string> = {
    neutral: "bg-white border-line",
    info: "bg-sky-50 border-sky-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-rose-50 border-rose-200",
  };
  const valueColor: Record<string, string> = {
    neutral: "text-ink",
    info: "text-sky-700",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-panel ${bg[tone]}`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${valueColor[tone]}`}>{value}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-stone-400">{sublabel}</p>
        {href ? (
          <Link to={href} className="text-xs font-semibold text-stone-400 hover:text-accent">
            Ver →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function SmallCard({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  href?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const bg: Record<string, string> = {
    neutral: "bg-white border-line",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-rose-50 border-rose-200",
  };
  const valueColor: Record<string, string> = {
    neutral: "text-ink",
    warning: "text-amber-700",
    danger: "text-rose-700",
  };

  const content = (
    <div className={`rounded-2xl border p-4 shadow-panel ${bg[tone]}`}>
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold tracking-tight ${valueColor[tone]}`}>{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block transition hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}

function AgendaSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-stone-100" />
      ))}
    </div>
  );
}
