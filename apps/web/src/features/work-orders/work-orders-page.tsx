import { workOrderStatuses } from "@crm/shared";
import { useEffect, useState } from "react";

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

function getStatusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "installed" || status === "delivered") {
    return "success";
  }
  if (status === "ready") {
    return "info";
  }
  if (status === "cutting" || status === "in_progress") {
    return "warning";
  }
  return "neutral";
}

export function WorkOrdersPage() {
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderDetail | null>(null);
  const [statusValue, setStatusValue] = useState<string>("pending");
  const [promisedDate, setPromisedDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Cargando órdenes.");

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    apiFetch<ApiResponse<WorkOrderDetail>>(`/work-orders/${selectedId}`)
      .then((response) => {
        setSelectedOrder(response.data);
        setStatusValue(response.data.status);
        setPromisedDate(response.data.promisedDate ?? "");
        setInternalNotes(response.data.internalNotes ?? "");
      })
      .catch(() => {
        setSelectedOrder(null);
      });
  }, [selectedId]);

  async function loadOrders(preferredId?: string | null) {
    setIsLoading(true);

    try {
      const response = await apiFetch<ApiResponse<WorkOrderRow[]>>("/work-orders");
      setRows(response.data);
      setSelectedId(preferredId ?? response.data[0]?.id ?? null);
      setMessage(response.data.length > 0 ? "Órdenes listas para seguimiento." : "Todavía no hay órdenes.");
    } catch {
      setMessage("No se pudieron cargar las órdenes.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickStatusChange(row: WorkOrderRow, status: string) {
    try {
      await apiFetch(`/work-orders/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadOrders(row.id);
      setMessage("Estado actualizado.");
    } catch {
      setMessage("No se pudo actualizar el estado.");
    }
  }

  async function handleSaveDetail() {
    if (!selectedOrder) {
      return;
    }

    try {
      await apiFetch(`/work-orders/${selectedOrder.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: statusValue,
          promisedDate: promisedDate || null,
          internalNotes: internalNotes || null,
        }),
      });
      await loadOrders(selectedOrder.id);
      setMessage("Orden actualizada.");
    } catch {
      setMessage("No se pudo guardar la orden.");
    }
  }

  async function handleDelete(order: WorkOrderRow) {
    const confirmed = window.confirm(`¿Querés eliminar la orden ${order.workOrderNumber}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/work-orders/${order.id}`, {
        method: "DELETE",
      });
      await loadOrders(selectedId === order.id ? null : selectedId);
      setMessage("Orden eliminada.");
    } catch {
      setMessage("No se pudo eliminar. Si tiene pagos o agenda, queda bloqueada.");
    }
  }

  const activeCount = rows.filter((row) => row.status === "pending" || row.status === "cutting" || row.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <TopHeader title="Órdenes de trabajo" description="Origen desde presupuesto aprobado, estado claro y edición corta." />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Órdenes activas" value={String(activeCount)} />
        <MetricCard label="Totales" value={String(rows.length)} />
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
                  <button type="button" onClick={() => setSelectedId(row.id)} className="text-left font-semibold text-ink">
                    {row.workOrderNumber}
                  </button>
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
                    {workOrderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {toSpanishLabel(status, workOrderStatusLabels)}
                      </option>
                    ))}
                  </select>
                ),
              },
              { key: "promisedDate", header: "Promesa", render: (row) => row.promisedDate ?? "-" },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <button type="button" onClick={() => void handleDelete(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                    Eliminar
                  </button>
                ),
              },
            ]}
            rows={rows}
            emptyTitle="Sin órdenes"
            emptyDescription="Aprobar un presupuesto crea la orden de trabajo."
          />

          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
            {selectedOrder ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Detalle</p>
                    <h3 className="mt-1 text-2xl font-semibold text-ink">{selectedOrder.workOrderNumber}</h3>
                    <p className="mt-2 text-sm text-stone-600">{selectedOrder.clientName}</p>
                  </div>
                  <StatusBadge tone={getStatusTone(selectedOrder.status)}>
                    {toSpanishLabel(selectedOrder.status, workOrderStatusLabels)}
                  </StatusBadge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="Origen" value={selectedOrder.quoteId ? "Desde presupuesto" : "Carga manual"} />
                  <InfoPill label="Creada" value={new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")} />
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Ítems</p>
                  <div className="mt-3 space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="font-semibold text-ink">{item.description}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          {item.glassLabel} · {item.widthMm} x {item.heightMm} mm · {item.quantity} unidad/es
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField label="Estado">
                    <select
                      value={statusValue}
                      onChange={(event) => setStatusValue(event.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      {workOrderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {toSpanishLabel(status, workOrderStatusLabels)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Fecha promesa">
                    <TextInput type="date" value={promisedDate} onChange={(event) => setPromisedDate(event.target.value)} />
                  </FormField>
                  <FormField label="Notas internas">
                    <TextArea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
                  </FormField>
                </div>

                <button type="button" onClick={() => void handleSaveDetail()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white">
                  Guardar cambios
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-stone-600">
                Seleccioná una orden para ver el detalle.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
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
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
