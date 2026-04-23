import { scheduleStatuses, type Client } from "@crm/shared";
import { useEffect, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { apiFetch } from "../../lib/api";
import { scheduleStatusLabels, toSpanishLabel } from "../../lib/labels";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type WorkOrderRow = {
  id: string;
  workOrderNumber: string;
  clientName: string;
};

type ScheduleRow = {
  id: string;
  clientId: string;
  workOrderId: string | null;
  status: string;
  scheduledDate: string;
  timeLabel: string | null;
  address: string;
  jobType: string;
  notes: string | null;
  clientName: string;
  workOrderNumber: string | null;
};

const initialForm = {
  clientId: "",
  workOrderId: "",
  status: "to_schedule",
  scheduledDate: "",
  timeLabel: "",
  address: "",
  jobType: "",
  notes: "",
};

export function SchedulePage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("Cargando agenda.");

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setIsLoading(true);

    try {
      const [scheduleResponse, clientsResponse, workOrdersResponse] = await Promise.all([
        apiFetch<ApiResponse<ScheduleRow[]>>("/schedule"),
        apiFetch<ApiResponse<Client[]>>("/clients"),
        apiFetch<ApiResponse<WorkOrderRow[]>>("/work-orders"),
      ]);

      setRows(scheduleResponse.data);
      setClients(clientsResponse.data);
      setWorkOrders(workOrdersResponse.data);
      setFeedback(scheduleResponse.data.length > 0 ? "Agenda lista para operar." : "Todavía no hay agenda cargada.");
    } catch {
      setFeedback("No se pudo cargar la agenda.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...initialForm,
      clientId: clients[0]?.id ?? "",
    });
    setShowForm(true);
  }

  function openEditForm(row: ScheduleRow) {
    setEditingId(row.id);
    setForm({
      clientId: row.clientId,
      workOrderId: row.workOrderId ?? "",
      status: row.status,
      scheduledDate: row.scheduledDate,
      timeLabel: row.timeLabel ?? "",
      address: row.address,
      jobType: row.jobType,
      notes: row.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleStatusChange(row: ScheduleRow, status: string) {
    try {
      await apiFetch(`/schedule/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadPage();
      setFeedback("Estado de agenda actualizado.");
    } catch {
      setFeedback("No se pudo cambiar el estado.");
    }
  }

  async function handleDelete(row: ScheduleRow) {
    const confirmed = window.confirm(`¿Querés eliminar la agenda de ${row.clientName}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/schedule/${row.id}`, {
        method: "DELETE",
      });
      await loadPage();
      setFeedback("Agenda eliminada.");
    } catch {
      setFeedback("No se pudo eliminar la agenda.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingId ? `/schedule/${editingId}` : "/schedule", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          clientId: form.clientId,
          workOrderId: form.workOrderId || null,
          status: form.status,
          scheduledDate: form.scheduledDate,
          timeLabel: form.timeLabel || null,
          address: form.address,
          jobType: form.jobType,
          notes: form.notes || null,
        }),
      });

      await loadPage();
      setShowForm(false);
      setFeedback(editingId ? "Agenda actualizada." : "Agenda creada.");
    } catch {
      setFeedback("No se pudo guardar la agenda.");
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Agenda"
        description="Agenda corta y práctica para coordinar rápido entregas y colocaciones."
        action={
          <button type="button" onClick={openCreateForm} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Nueva agenda
          </button>
        }
      />

      <div className="rounded-2xl border border-line bg-white p-4 text-sm text-stone-600 shadow-panel">{feedback}</div>

      {isLoading ? <LoadingRows /> : null}
      {!isLoading ? (
        <DataTable
          columns={[
            { key: "scheduledDate", header: "Fecha", render: (row) => `${row.scheduledDate} ${row.timeLabel ?? ""}`.trim() },
            { key: "clientName", header: "Cliente", render: (row) => row.clientName },
            { key: "jobType", header: "Trabajo", render: (row) => row.jobType },
            {
              key: "status",
              header: "Estado",
              render: (row) => (
                <select
                  value={row.status}
                  onChange={(event) => void handleStatusChange(row, event.target.value)}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {scheduleStatuses.map((status) => (
                    <option key={status} value={status}>
                      {toSpanishLabel(status, scheduleStatusLabels)}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: "actions",
              header: "Acciones",
              render: (row) => (
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEditForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                    Editar
                  </button>
                  <button type="button" onClick={() => void handleDelete(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                    Eliminar
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          emptyTitle="Sin agenda"
          emptyDescription="Creá la primera coordinación para organizar el día."
        />
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingId ? "Edición" : "Alta rápida"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingId ? "Editar agenda" : "Nueva agenda"}</h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Cliente">
                  <select
                    value={form.clientId}
                    onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Orden de trabajo">
                  <select
                    value={form.workOrderId}
                    onChange={(event) => setForm((current) => ({ ...current, workOrderId: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Sin orden vinculada</option>
                    {workOrders.map((workOrder) => (
                      <option key={workOrder.id} value={workOrder.id}>
                        {workOrder.workOrderNumber} · {workOrder.clientName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Fecha">
                  <TextInput type="date" value={form.scheduledDate} onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))} />
                </FormField>
                <FormField label="Horario">
                  <TextInput value={form.timeLabel} onChange={(event) => setForm((current) => ({ ...current, timeLabel: event.target.value }))} />
                </FormField>
                <FormField label="Estado">
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {scheduleStatuses.map((status) => (
                      <option key={status} value={status}>
                        {toSpanishLabel(status, scheduleStatusLabels)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Dirección">
                <TextInput value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
              </FormField>
              <FormField label="Trabajo">
                <TextInput value={form.jobType} onChange={(event) => setForm((current) => ({ ...current, jobType: event.target.value }))} />
              </FormField>
              <FormField label="Observación">
                <TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </FormField>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
                  {editingId ? "Guardar cambios" : "Guardar agenda"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
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
