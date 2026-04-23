import { createClientSchema, type Client } from "@crm/shared";
import { useEffect, useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { apiFetch } from "../../lib/api";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

const initialForm = {
  name: "",
  phone: "",
  address: "",
  jobSite: "",
  notes: "",
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("Cargando clientes.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0] ?? null,
    [clients, selectedClientId],
  );

  useEffect(() => {
    void loadClients();
  }, []);

  async function loadClients(preferredId?: string | null) {
    setIsLoading(true);

    try {
      const response = await apiFetch<ApiResponse<Client[]>>("/clients");
      setClients(response.data);
      setSelectedClientId(preferredId ?? response.data[0]?.id ?? null);
      setFeedback(response.data.length > 0 ? "Clientes listos para operar." : "Todavía no hay clientes cargados.");
    } catch {
      setFeedback("No se pudieron cargar los clientes.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setEditingClientId(null);
    setForm(initialForm);
    setErrorMessage(null);
    setShowForm(true);
  }

  function openEditForm(client: Client) {
    setEditingClientId(client.id);
    setForm({
      name: client.name,
      phone: client.phone ?? "",
      address: client.address ?? "",
      jobSite: client.jobSite ?? "",
      notes: client.notes ?? "",
    });
    setErrorMessage(null);
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createClientSchema.safeParse({
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      jobSite: form.jobSite || null,
      notes: form.notes || null,
    });

    if (!parsed.success) {
      setErrorMessage("Revisá nombre, teléfono y observaciones antes de guardar.");
      return;
    }

    setIsSaving(true);

    try {
      const path = editingClientId ? `/clients/${editingClientId}` : "/clients";
      const method = editingClientId ? "PUT" : "POST";
      const response = await apiFetch<ApiResponse<Client>>(path, {
        method,
        body: JSON.stringify(parsed.data),
      });

      await loadClients(response.data.id);
      setFeedback(editingClientId ? "Cliente actualizado." : "Cliente creado.");
      setShowForm(false);
      setEditingClientId(null);
    } catch {
      setErrorMessage("No se pudo guardar el cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(`¿Querés eliminar a ${client.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch<ApiResponse<{ mode: string }>>(`/clients/${client.id}`, {
        method: "DELETE",
      });

      await loadClients(selectedClientId === client.id ? null : selectedClientId);
      setFeedback(
        response.data.mode === "archived"
          ? "El cliente se ocultó porque ya tenía historial."
          : "Cliente eliminado.",
      );
    } catch {
      setFeedback("No se pudo eliminar el cliente.");
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Clientes"
        description="Alta, edición y baja rápida para mostrador, obras y seguimiento comercial."
        action={
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
          >
            Nuevo cliente
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-stone-600 shadow-panel">{feedback}</div>
          {isLoading ? <LoadingRows /> : null}
          {!isLoading ? (
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Cliente",
                  render: (row) => (
                    <button type="button" onClick={() => setSelectedClientId(row.id)} className="text-left font-semibold text-ink">
                      {row.name}
                    </button>
                  ),
                },
                { key: "phone", header: "Teléfono", render: (row) => row.phone ?? "-" },
                { key: "jobSite", header: "Obra / zona", render: (row) => row.jobSite ?? "-" },
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
              rows={clients}
              emptyTitle="Sin clientes"
              emptyDescription="Creá el primer cliente para arrancar el flujo."
            />
          ) : null}
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
          {selectedClient ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Ficha rápida</p>
                  <h3 className="mt-1 text-2xl font-semibold text-ink">{selectedClient.name}</h3>
                  <p className="mt-2 text-sm text-stone-600">Datos simples para vender, cobrar y coordinar.</p>
                </div>
                <button type="button" onClick={() => openEditForm(selectedClient)} className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-stone-700">
                  Editar
                </button>
              </div>

              <InfoCard label="Teléfono" value={selectedClient.phone ?? "-"} />
              <InfoCard label="Dirección" value={selectedClient.address ?? "-"} />
              <InfoCard label="Obra / zona" value={selectedClient.jobSite ?? "-"} />
              <InfoCard label="Observaciones" value={selectedClient.notes ?? "-"} multiline />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-stone-600">
              Seleccioná un cliente para ver la ficha rápida.
            </div>
          )}
        </section>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingClientId ? "Edición" : "Alta rápida"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingClientId ? "Editar cliente" : "Nuevo cliente"}</h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Nombre">
                <TextInput value={form.name} onChange={(event) => updateField("name", event.target.value)} />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Teléfono">
                  <TextInput value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                </FormField>
                <FormField label="Obra / zona">
                  <TextInput value={form.jobSite} onChange={(event) => updateField("jobSite", event.target.value)} />
                </FormField>
              </div>
              <FormField label="Dirección">
                <TextInput value={form.address} onChange={(event) => updateField("address", event.target.value)} />
              </FormField>
              <FormField label="Observaciones">
                <TextArea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </FormField>
              {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Guardando..." : editingClientId ? "Guardar cambios" : "Guardar cliente"}
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

function InfoCard({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className={`mt-2 text-sm text-ink ${multiline ? "leading-6" : ""}`}>{value}</p>
    </div>
  );
}
