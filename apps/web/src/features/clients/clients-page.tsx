import { createClientSchema, type Client } from "@crm/shared";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { TableSkeleton } from "../../components/ui/skeleton";
import { ApiError, apiFetch } from "../../lib/api";
import { queryClient } from "../../lib/query-client";
import { queryKeys, useClients } from "../../lib/queries";

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
  const { data: clients = [], isLoading, isError } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.phone ?? "").toLowerCase().includes(q) ||
        (client.jobSite ?? "").toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const feedbackText = isError
    ? "No se pudieron cargar los clientes."
    : isLoading
      ? "Cargando…"
      : searchQuery
        ? `${filteredClients.length} resultado/s`
        : clients.length > 0
          ? `${clients.length} clientes.`
          : "Sin clientes todavía.";

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateForm() {
    setEditingClientId(null);
    setForm(initialForm);
    setFormError(null);
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
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createClientSchema.safeParse({
      name: form.name,
      phone: form.phone || null,
      address: form.address || null,
      jobSite: form.jobSite || null,
      notes: form.notes || null,
    });

    if (!parsed.success) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingClientId) {
        const response = await apiFetch<ApiResponse<Client>>(`/clients/${editingClientId}`, {
          method: "PUT",
          body: JSON.stringify(parsed.data),
        });
        setSelectedClientId(response.data.id);
      } else {
        const response = await apiFetch<ApiResponse<Client>>("/clients", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        });
        setSelectedClientId(response.data.id);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      setShowForm(false);
      setEditingClientId(null);
    } catch {
      setFormError("No se pudo guardar el cliente. Revisá los datos.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(
      `¿Eliminar a ${client.name}?\n\nSi tiene presupuestos, pagos u órdenes, el sistema va a bloquear el borrado con un mensaje claro. Si no tiene historial, se elimina definitivamente.`,
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/clients/${client.id}`, { method: "DELETE" });
      if (selectedClientId === client.id) setSelectedClientId(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "No se pudo eliminar el cliente.";
      window.alert(msg);
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Clientes"
        description="Base de clientes para arrancar el flujo desde el mostrador."
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
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por nombre, teléfono u obra…"
              className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-stone-600"
              >
                Limpiar
              </button>
            ) : null}
          </div>

          <div
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-panel ${
              isError
                ? "border-rose-200 bg-rose-50 font-medium text-rose-700"
                : "border-line bg-white text-stone-600"
            }`}
          >
            {feedbackText}
          </div>

          {isLoading ? <LoadingRows /> : null}
          {!isLoading ? (
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Cliente",
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() => setSelectedClientId(row.id)}
                      className={`text-left font-semibold transition ${selectedClientId === row.id ? "text-accent" : "text-ink hover:text-accent"}`}
                    >
                      {row.name}
                    </button>
                  ),
                },
                { key: "phone", header: "Teléfono", render: (row) => row.phone ?? "-" },
                { key: "jobSite", header: "Obra / zona", render: (row) => row.jobSite ?? "-" },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(row)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={filteredClients}
              emptyTitle={searchQuery ? "Sin resultados" : "Sin clientes"}
              emptyDescription={
                searchQuery ? "Probá con otro nombre o teléfono." : "Creá el primer cliente para arrancar el flujo."
              }
            />
          ) : null}
        </div>

        <aside className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
          {selectedClient ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Ficha</p>
                  <h3 className="mt-1 text-xl font-semibold text-ink">{selectedClient.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => openEditForm(selectedClient)}
                  className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                >
                  Editar
                </button>
              </div>

              <div className="space-y-2">
                <InfoRow label="Teléfono" value={selectedClient.phone ?? "-"} />
                <InfoRow label="Dirección" value={selectedClient.address ?? "-"} />
                <InfoRow label="Obra / zona" value={selectedClient.jobSite ?? "-"} />
                {selectedClient.notes ? <InfoRow label="Notas" value={selectedClient.notes} multiline /> : null}
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Acciones rápidas</p>
                <div className="space-y-2">
                  <Link
                    to="/presupuestos"
                    className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Nuevo presupuesto
                  </Link>
                  <Link
                    to="/agenda"
                    className="flex w-full items-center justify-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    Agendar visita / entrega
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center">
              <p className="text-sm text-stone-400">Seleccioná un cliente para ver la ficha.</p>
            </div>
          )}
        </aside>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                  {editingClientId ? "Edición" : "Alta rápida"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">
                  {editingClientId ? "Editar cliente" : "Nuevo cliente"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Nombre *">
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

              {formError ? <p className="text-sm font-medium text-rose-700">{formError}</p> : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Guardando…" : editingClientId ? "Guardar cambios" : "Crear cliente"}
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
  return <TableSkeleton rows={5} cols={4} />;
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-stone-50 px-4 py-2.5">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</span>
      <span className={`text-sm text-ink ${multiline ? "leading-6" : ""}`}>{value}</span>
    </div>
  );
}
