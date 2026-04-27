import { workOrderStatuses } from "@crm/shared";
import { useEffect, useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiFetch } from "../../lib/api";
import { toSpanishLabel, workOrderStatusLabels } from "../../lib/labels";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type WorkOrderRow = {
  id: string;
  workOrderNumber: string;
  quoteId: string | null;
  clientId: string;
  status: string;
  promisedDate: string | null;
  clientName: string;
};

type WorkOrderDetail = {
  id: string;
  workOrderNumber: string;
  quoteId: string | null;
  clientId: string;
  clientName: string;
  status: string;
  promisedDate: string | null;
  internalNotes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    description: string;
    glassLabel: string;
    widthMm: number;
    heightMm: number;
    quantity: number;
  }>;
};

const TODAY = new Date().toISOString().slice(0, 10);

function isOverdue(row: WorkOrderRow): boolean {
  return (
    Boolean(row.promisedDate) &&
    row.promisedDate! < TODAY &&
    row.status !== "delivered" &&
    row.status !== "installed"
  );
}

function getStatusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "installed" || status === "delivered") return "success";
  if (status === "ready") return "info";
  if (status === "cutting" || status === "in_progress") return "warning";
  return "neutral";
}

export function WorkOrdersPage() {
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("pending");
  const [promisedDate, setPromisedDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Cargando órdenes.");

  useEffect(() => {
    setIsLoading(true);
    apiFetch<ApiResponse<WorkOrderRow[]>>("/work-orders")
      .then((response) => {
        setRows(response.data);
        const first = response.data[0]?.id ?? null;
        setSelectedId(first);
        setMessage(response.data.length > 0 ? "Órdenes listas." : "Sin órdenes todavía.");
      })
      .catch(() => setMessage("No se pudieron cargar las órdenes."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedOrder(null);
      return;
    }

    setIsDetailLoading(true);
    apiFetch<ApiResponse<WorkOrderDetail>>(`/work-orders/${selectedId}`)
      .then((response) => {
        setSelectedOrder(response.data);
        setStatusValue(response.data.status);
        setPromisedDate(response.data.promisedDate ?? "");
        setInternalNotes(response.data.internalNotes ?? "");
      })
      .catch(() => setSelectedOrder(null))
      .finally(() => setIsDetailLoading(false));
  }, [selectedId]);

  function selectOrder(id: string) {
    if (id === selectedId) {
      // Same ID: force re-fetch by resetting first
      setSelectedId(null);
      requestAnimationFrame(() => setSelectedId(id));
    } else {
      setSelectedId(id);
    }
  }

  async function handleQuickStatusChange(row: WorkOrderRow, status: string) {
    // Optimistic update: update list immediately
    setRows((current) => current.map((r) => (r.id === row.id ? { ...r, status } : r)));

    try {
      await apiFetch(`/work-orders/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      // If this order is open in the detail panel, sync it too
      if (selectedId === row.id && selectedOrder) {
        setSelectedOrder((current) => (current ? { ...current, status } : null));
        setStatusValue(status);
      }
      setMessage("Estado actualizado.");
    } catch {
      // Revert optimistic update
      setRows((current) => current.map((r) => (r.id === row.id ? { ...r, status: row.status } : r)));
      setMessage("No se pudo actualizar el estado.");
    }
  }

  async function handleSaveDetail() {
    if (!selectedOrder) return;

    try {
      await apiFetch(`/work-orders/${selectedOrder.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: statusValue,
          promisedDate: promisedDate || null,
          internalNotes: internalNotes || null,
        }),
      });
      // Update list row
      setRows((current) =>
        current.map((r) =>
          r.id === selectedOrder.id
            ? { ...r, status: statusValue, promisedDate: promisedDate || null }
            : r,
        ),
      );
      // Update detail state
      setSelectedOrder((current) =>
        current
          ? { ...current, status: statusValue, promisedDate: promisedDate || null, internalNotes: internalNotes || null }
          : null,
      );
      setMessage("Orden actualizada.");
    } catch {
      setMessage("No se pudo guardar la orden.");
    }
  }

  async function handleDelete(order: WorkOrderRow) {
    const confirmed = window.confirm(
      `¿Eliminar la orden ${order.workOrderNumber}?\n\nSi tiene pagos o agenda vinculada, el sistema va a bloquear el borrado.`,
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/work-orders/${order.id}`, { method: "DELETE" });
      setRows((current) => current.filter((r) => r.id !== order.id));
      if (selectedId === order.id) {
        setSelectedId(null);
        setSelectedOrder(null);
      }
      setMessage("Orden eliminada.");
    } catch {
      setMessage("No se pudo eliminar. Si tiene pagos o agenda, queda bloqueada.");
    }
  }

  const activeCount = useMemo(
    () => rows.filter((r) => r.status === "pending" || r.status === "cutting" || r.status === "in_progress").length,
    [rows],
  );
  const overdueCount = useMemo(() => rows.filter(isOverdue).length, [rows]);
  const readyCount = useMemo(() => rows.filter((r) => r.status === "ready").length, [rows]);

  return (
    <div className="space-y-6">
      <TopHeader title="Órdenes de trabajo" description="Estado claro, fecha prometida y cambio rápido desde la lista." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="En proceso" value={String(activeCount)} />
        <MetricCard label="Atrasadas" value={String(overdueCount)} tone={overdueCount > 0 ? "danger" : "neutral"} />
        <MetricCard label="Listas p/ entregar" value={String(readyCount)} tone={readyCount > 0 ? "info" : "neutral"} />
        <div className="rounded-2xl border border-line bg-white p-5 text-sm text-stone-600 shadow-panel">{message}</div>
      </section>

      {isLoading ? <LoadingRows /> : null}
      {!isLoading ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
          <DataTable
            columns={[
              {
                key: "workOrderNumber",
                header: "Orden",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectOrder(row.id)}
                      className={`text-left font-semibold transition ${selectedId === row.id ? "text-accent" : "text-ink hover:text-accent"}`}
                    >
                      {row.workOrderNumber}
                    </button>
                    {isOverdue(row) ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                        atrasada
                      </span>
                    ) : null}
                  </div>
                ),
              },
              { key: "clientName", header: "Cliente", render: (row) => row.clientName },
              {
                key: "status",
                header: "Estado",
                render: (row) => (
                  <select
                    value={row.status}
                    onChange={(event) => void handleQuickStatusChange(row, event.target.value)}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {workOrderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {toSpanishLabel(s, workOrderStatusLabels)}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: "promisedDate",
                header: "Fecha promesa",
                render: (row) => {
                  if (!row.promisedDate) return <span className="text-stone-400">—</span>;
                  const overdue = isOverdue(row);
                  return (
                    <span className={`text-sm font-medium ${overdue ? "text-rose-600" : "text-stone-700"}`}>
                      {row.promisedDate}
                      {overdue ? " ⚠" : ""}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                header: "",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Eliminar
                  </button>
                ),
              },
            ]}
            rows={rows}
            emptyTitle="Sin órdenes"
            emptyDescription="Aprobar un presupuesto genera la orden automáticamente."
          />

          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
            {isDetailLoading ? <LoadingRows /> : null}
            {!isDetailLoading && selectedOrder ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Detalle</p>
                    <h3 className="mt-1 text-2xl font-semibold text-ink">{selectedOrder.workOrderNumber}</h3>
                    <p className="mt-1 text-sm text-stone-600">{selectedOrder.clientName}</p>
                  </div>
                  <StatusBadge tone={getStatusTone(selectedOrder.status)}>
                    {toSpanishLabel(selectedOrder.status, workOrderStatusLabels)}
                  </StatusBadge>
                </div>

                {selectedOrder.promisedDate &&
                selectedOrder.promisedDate < TODAY &&
                selectedOrder.status !== "delivered" &&
                selectedOrder.status !== "installed" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
                    Fecha prometida vencida: {selectedOrder.promisedDate}
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  <InfoPill label="Origen" value={selectedOrder.quoteId ? "Desde presupuesto" : "Carga manual"} />
                  <InfoPill label="Creada" value={new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")} />
                </div>

                {selectedOrder.items.length > 0 ? (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Ítems</p>
                    <div className="mt-3 space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <p className="font-semibold text-ink">{item.description}</p>
                          <p className="mt-0.5 text-sm text-stone-500">
                            {item.glassLabel} · {item.widthMm} × {item.heightMm} mm · {item.quantity} u.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4 border-t border-stone-100 pt-4">
                  <FormField label="Estado">
                    <select
                      value={statusValue}
                      onChange={(event) => setStatusValue(event.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      {workOrderStatuses.map((s) => (
                        <option key={s} value={s}>
                          {toSpanishLabel(s, workOrderStatusLabels)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Fecha prometida">
                    <TextInput
                      type="date"
                      value={promisedDate}
                      onChange={(event) => setPromisedDate(event.target.value)}
                    />
                  </FormField>
                  <FormField label="Notas internas">
                    <TextArea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
                  </FormField>
                  <button
                    type="button"
                    onClick={() => void handleSaveDetail()}
                    className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : null}
            {!isDetailLoading && !selectedOrder ? (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <p className="text-sm text-stone-400">Seleccioná una orden para ver el detalle.</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "info" | "danger";
}) {
  const bg: Record<string, string> = {
    neutral: "bg-white border-line",
    info: "bg-sky-50 border-sky-200",
    danger: "bg-rose-50 border-rose-200",
  };
  const valueColor: Record<string, string> = {
    neutral: "text-ink",
    info: "text-sky-700",
    danger: "text-rose-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-panel ${bg[tone]}`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${valueColor[tone]}`}>{value}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-panel">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-stone-100" />
      ))}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
