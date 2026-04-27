import {
  calculateQuoteItem,
  calculateQuoteTotals,
  createQuoteSchema,
  formatCurrencyFromCents,
} from "@crm/shared";
import { useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { TableSkeleton } from "../../components/ui/skeleton";
import { StatusBadge } from "../../components/ui/status-badge";
import { ApiError, apiFetch, getApiBaseUrl } from "../../lib/api";
import { quoteStatusLabels, toSpanishLabel } from "../../lib/labels";
import { queryClient } from "../../lib/query-client";
import { queryKeys, useClients, useGlassTypes, useQuotes, useServiceExtras } from "../../lib/queries";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type ServiceExtraRow = {
  id: string;
  name: string;
  pricingMode: "per_unit" | "per_m2" | "fixed";
  unitPriceCents: number;
  isActive: boolean;
};

type QuoteRow = {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: string;
  issueDate: string;
  totalCents: number;
  clientName: string;
};

type QuoteDetail = {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  clientAddress: string | null;
  status: string;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  internalNotes: string | null;
  subtotalCents: number;
  extrasTotalCents: number;
  totalCents: number;
  items: Array<{
    id: string;
    glassTypeId: string | null;
    description: string;
    widthMm: number;
    heightMm: number;
    quantity: number;
    unitPricePerM2Cents: number;
    totalCents: number;
    extraBreakdown: Array<{
      extraId?: string;
      label: string;
      pricingMode: "per_unit" | "per_m2" | "fixed";
      unitPriceCents: number;
      totalCents?: number;
    }>;
  }>;
};

type QuoteItemForm = {
  description: string;
  glassTypeId: string;
  widthMm: string;
  heightMm: string;
  quantity: string;
  pricePerM2Cents: string;
  selectedExtraIds: string[];
};

const createEmptyItem = (): QuoteItemForm => ({
  description: "",
  glassTypeId: "",
  widthMm: "1200",
  heightMm: "1900",
  quantity: "1",
  pricePerM2Cents: "",
  selectedExtraIds: [],
});

const createEmptyForm = () => ({
  clientId: "",
  issueDate: getDateInputValue(),
  validUntil: getDateInputValue(7),
  notes: "",
  internalNotes: "",
  items: [createEmptyItem()],
});

function getDateInputValue(offsetDays = 0) {
  const current = new Date();
  current.setDate(current.getDate() + offsetDays);
  return current.toISOString().slice(0, 10);
}

function getStatusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "paid") {
    return "success";
  }
  if (status === "approved" || status === "delivered") {
    return "info";
  }
  if (status === "rejected") {
    return "danger";
  }
  if (status === "sent" || status === "in_progress" || status === "finished") {
    return "warning";
  }
  return "neutral";
}

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "in_progress", label: "En curso" },
  { key: "finished", label: "Finalizados" },
] as const;

type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"];

function matchesFilter(status: string, filter: StatusFilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "draft" || status === "sent";
  if (filter === "approved") return status === "approved";
  if (filter === "in_progress") return status === "in_progress";
  if (filter === "finished") return status === "finished" || status === "delivered" || status === "paid";
  return true;
}

export function QuotesPage() {
  const { data: quotes = [], isLoading: isListLoading } = useQuotes();
  const { data: allClients = [] } = useClients();
  const { data: allGlassTypes = [] } = useGlassTypes();
  const { data: allServiceExtras = [] } = useServiceExtras();

  const clients = allClients;
  const glassTypes = allGlassTypes.filter((g) => g.isActive);
  const serviceExtras = allServiceExtras.filter((e) => e.isActive);

  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [form, setForm] = useState(createEmptyForm());
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredQuotes = useMemo(
    () => quotes.filter((q) => matchesFilter(q.status, statusFilter)),
    [quotes, statusFilter],
  );

  function selectQuote(id: string) {
    if (id === selectedQuoteId) return;
    setSelectedQuoteId(id);
    setSelectedQuote(null);
    apiFetch<ApiResponse<QuoteDetail>>(`/quotes/${id}`)
      .then((res) => setSelectedQuote(res.data))
      .catch(() => setSelectedQuote(null));
  }

  const calculatedItems = useMemo(
    () =>
      form.items
        .map((item) => {
          const widthMm = Number(item.widthMm);
          const heightMm = Number(item.heightMm);
          const quantity = Number(item.quantity);
          const pricePerM2Cents = Number(item.pricePerM2Cents);

          if (!widthMm || !heightMm || !quantity || Number.isNaN(pricePerM2Cents)) {
            return null;
          }

          return calculateQuoteItem({
            widthMm,
            heightMm,
            quantity,
            pricePerM2Cents,
            extras: item.selectedExtraIds
              .map((extraId) => serviceExtras.find((extra) => extra.id === extraId))
              .filter((extra): extra is ServiceExtraRow => Boolean(extra))
              .map((extra) => ({
                extraId: extra.id,
                label: extra.name,
                pricingMode: extra.pricingMode,
                unitPriceCents: extra.unitPriceCents,
              })),
          });
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [form.items, serviceExtras],
  );

  const totals = useMemo(
    () => (calculatedItems.length > 0 ? calculateQuoteTotals(calculatedItems) : null),
    [calculatedItems],
  );
  const isDetailLoading = Boolean(selectedQuoteId && selectedQuote?.id !== selectedQuoteId);

  function updateItem(index: number, field: keyof QuoteItemForm, value: string | string[]) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  }

  function handleGlassChange(index: number, glassTypeId: string) {
    const selectedGlass = glassTypes.find((glassType) => glassType.id === glassTypeId);

    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              glassTypeId,
              pricePerM2Cents: selectedGlass ? String(selectedGlass.pricePerM2Cents) : "",
              description:
                item.description || !selectedGlass
                  ? item.description
                  : `${selectedGlass.name} ${selectedGlass.thicknessMm} mm ${selectedGlass.color}`.trim(),
            }
          : item,
      ),
    }));
  }

  function openCreateForm() {
    setEditingQuoteId(null);
    setForm({
      ...createEmptyForm(),
      clientId: clients[0]?.id ?? "",
    });
    setErrorMessage(null);
    setShowForm(true);
  }

  function openEditForm() {
    if (!selectedQuote) return;
    setEditingQuoteId(selectedQuote.id);
    setForm({
      clientId: selectedQuote.clientId,
      issueDate: selectedQuote.issueDate,
      validUntil: selectedQuote.validUntil ?? "",
      notes: selectedQuote.notes ?? "",
      internalNotes: selectedQuote.internalNotes ?? "",
      items: selectedQuote.items.map((item) => ({
        description: item.description,
        glassTypeId: item.glassTypeId ?? "",
        widthMm: String(item.widthMm),
        heightMm: String(item.heightMm),
        quantity: String(item.quantity),
        pricePerM2Cents: String(item.unitPricePerM2Cents),
        selectedExtraIds: item.extraBreakdown.map((extra) => extra.extraId).filter((extraId): extraId is string => Boolean(extraId)),
      })),
    });
    setErrorMessage(null);
    setShowForm(true);
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createQuoteSchema.safeParse({
      clientId: form.clientId,
      issueDate: form.issueDate,
      validUntil: form.validUntil || null,
      notes: form.notes || null,
      internalNotes: form.internalNotes || null,
      items: form.items.map((item) => ({
        description: item.description,
        glassTypeId: item.glassTypeId || null,
        widthMm: Number(item.widthMm),
        heightMm: Number(item.heightMm),
        quantity: Number(item.quantity),
        pricePerM2Cents: Number(item.pricePerM2Cents),
        extras: item.selectedExtraIds
          .map((extraId) => serviceExtras.find((extra) => extra.id === extraId))
          .filter((extra): extra is ServiceExtraRow => Boolean(extra))
          .map((extra) => ({
            extraId: extra.id,
            label: extra.name,
            pricingMode: extra.pricingMode,
            unitPriceCents: extra.unitPriceCents,
          })),
      })),
    });

    if (!parsed.success) {
      setErrorMessage("Revisá cliente, medidas, cantidad y precios antes de guardar.");
      return;
    }

    setIsSaving(true);

    try {
      const path = editingQuoteId ? `/quotes/${editingQuoteId}` : "/quotes";
      const method = editingQuoteId ? "PUT" : "POST";
      const response = await apiFetch<ApiResponse<QuoteDetail>>(path, {
        method,
        body: JSON.stringify(parsed.data),
      });

      const saved = response.data;
      setSelectedQuote(saved);
      setSelectedQuoteId(saved.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      setShowForm(false);
      setEditingQuoteId(null);
    } catch {
      setErrorMessage("No se pudo guardar el presupuesto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprove(quoteId: string) {
    try {
      await apiFetch(`/quotes/${quoteId}/approve`, { method: "POST" });
      const detail = await apiFetch<ApiResponse<QuoteDetail>>(`/quotes/${quoteId}`);
      setSelectedQuote(detail.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    } catch {
      setErrorMessage("No se pudo aprobar el presupuesto.");
    }
  }

  async function handleDelete(quote: QuoteRow) {
    const confirmed = window.confirm(`¿Eliminar el presupuesto ${quote.quoteNumber}?`);
    if (!confirmed) return;

    try {
      await apiFetch(`/quotes/${quote.id}`, { method: "DELETE" });
      if (selectedQuoteId === quote.id) {
        setSelectedQuoteId(null);
        setSelectedQuote(null);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No se pudo eliminar. Si tiene pagos u orden, queda bloqueado.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Presupuestos"
        description="Alta, edición, PDF y aprobación con el flujo más corto posible."
        action={
          <button type="button" onClick={openCreateForm} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
            Nuevo presupuesto
          </button>
        }
      />

      {/* Filtro por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => {
          const count = filter.key === "all" ? quotes.length : quotes.filter((q) => matchesFilter(q.status, filter.key)).length;
          const isActive = statusFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#233235] text-white shadow-sm"
                  : "border border-line bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              {filter.label}
              <span className={`ml-2 text-xs ${isActive ? "text-stone-300" : "text-stone-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-3">
          {isListLoading ? <TableSkeleton rows={5} cols={4} /> : null}
          {!isListLoading ? (
            <DataTable
              columns={[
                {
                  key: "quoteNumber",
                  header: "Número",
                  render: (row) => (
                    <button type="button" onClick={() => selectQuote(row.id)} className="text-left font-semibold text-ink hover:text-accent">
                      {row.quoteNumber}
                    </button>
                  ),
                },
                { key: "clientName", header: "Cliente", render: (row) => row.clientName },
                {
                  key: "status",
                  header: "Estado",
                  render: (row) => <StatusBadge tone={getStatusTone(row.status)}>{toSpanishLabel(row.status, quoteStatusLabels)}</StatusBadge>,
                },
                { key: "total", header: "Total", render: (row) => formatCurrencyFromCents(row.totalCents) },
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
              rows={filteredQuotes}
              emptyTitle={statusFilter !== "all" ? "Sin presupuestos en este estado" : "Sin presupuestos"}
              emptyDescription={statusFilter !== "all" ? "Cambiá el filtro para ver otros." : "Creá el primero y validá el flujo comercial."}
            />
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
          {isDetailLoading ? <TableSkeleton rows={3} cols={2} /> : null}
          {!isDetailLoading && selectedQuote ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Detalle</p>
                  <h3 className="mt-1 text-2xl font-semibold text-ink">{selectedQuote.quoteNumber}</h3>
                  <p className="mt-2 text-sm text-stone-600">{selectedQuote.clientName}</p>
                </div>
                <StatusBadge tone={getStatusTone(selectedQuote.status)}>
                  {toSpanishLabel(selectedQuote.status, quoteStatusLabels)}
                </StatusBadge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <InfoPill label="Emisión" value={selectedQuote.issueDate} />
                <InfoPill label="Validez" value={selectedQuote.validUntil ?? "-"} />
                <InfoPill label="Subtotal" value={formatCurrencyFromCents(selectedQuote.subtotalCents)} />
                <InfoPill label="Total" value={formatCurrencyFromCents(selectedQuote.totalCents)} />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Ítems</p>
                <div className="mt-3 space-y-3">
                  {selectedQuote.items.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{item.description}</p>
                          <p className="mt-1 text-sm text-stone-600">
                            {item.widthMm} x {item.heightMm} mm · {item.quantity} unidad/es
                          </p>
                        </div>
                        <p className="font-semibold text-ink">{formatCurrencyFromCents(item.totalCents)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <a
                  href={`${getApiBaseUrl()}/quotes/${selectedQuote.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-stone-300 px-4 py-3 text-center text-sm font-semibold text-stone-700"
                >
                  Ver PDF
                </a>
                <button
                  type="button"
                  onClick={() => void openEditForm()}
                  disabled={!(selectedQuote.status === "draft" || selectedQuote.status === "sent")}
                  className="rounded-xl border border-accent px-4 py-3 text-sm font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleApprove(selectedQuote.id)}
                  disabled={!(selectedQuote.status === "draft" || selectedQuote.status === "sent")}
                  className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
                >
                  Aprobar y generar orden
                </button>
              </div>
            </div>
          ) : null}
          {!isDetailLoading && !selectedQuote ? (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-stone-600">
              Seleccioná un presupuesto para ver el detalle.
            </div>
          ) : null}
        </div>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1c2526]/55 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingQuoteId ? "Edición" : "Alta"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingQuoteId ? "Editar presupuesto" : "Nuevo presupuesto"}</h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
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
                <FormField label="Fecha emisión">
                  <TextInput type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} />
                </FormField>
                <FormField label="Válido hasta">
                  <TextInput type="date" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} />
                </FormField>
              </div>

              {form.items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">Ítem {index + 1}</p>
                    <button type="button" onClick={() => removeItem(index)} className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Quitar
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Descripción">
                      <TextInput value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                    </FormField>
                    <FormField label="Tipo de vidrio">
                      <select
                        value={item.glassTypeId}
                        onChange={(event) => handleGlassChange(index, event.target.value)}
                        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="">Seleccionar vidrio</option>
                        {glassTypes.map((glassType) => (
                          <option key={glassType.id} value={glassType.id}>
                            {glassType.name} {glassType.thicknessMm} mm {glassType.color}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Ancho (mm)">
                      <TextInput value={item.widthMm} onChange={(event) => updateItem(index, "widthMm", event.target.value)} />
                    </FormField>
                    <FormField label="Alto (mm)">
                      <TextInput value={item.heightMm} onChange={(event) => updateItem(index, "heightMm", event.target.value)} />
                    </FormField>
                    <FormField label="Cantidad">
                      <TextInput value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                    </FormField>
                    <FormField label="Precio por m2 ($)">
                      <TextInput value={item.pricePerM2Cents} onChange={(event) => updateItem(index, "pricePerM2Cents", event.target.value)} />
                    </FormField>
                  </div>

                  {serviceExtras.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-ink">Extras</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {serviceExtras.map((extra) => (
                          <label key={extra.id} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2">
                            <span className="text-sm text-stone-700">
                              {extra.name} · {formatCurrencyFromCents(extra.unitPriceCents)}
                            </span>
                            <input
                              type="checkbox"
                              checked={item.selectedExtraIds.includes(extra.id)}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "selectedExtraIds",
                                  event.target.checked
                                    ? [...item.selectedExtraIds, extra.id]
                                    : item.selectedExtraIds.filter((extraId) => extraId !== extra.id),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}

              <button type="button" onClick={addItem} className="w-full rounded-xl border border-dashed border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700">
                Agregar ítem
              </button>

              <div className="grid gap-4 xl:grid-cols-[1fr,0.85fr]">
                <div className="space-y-4">
                  <FormField label="Notas visibles para el cliente">
                    <TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                  </FormField>
                  <FormField label="Notas internas">
                    <TextArea value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} />
                  </FormField>
                </div>
                <div className="rounded-2xl bg-[#233235] p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-300">Vista rápida</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-stone-200">Ítems: {form.items.length}</p>
                    <p className="text-sm text-stone-200">Subtotal: {totals ? formatCurrencyFromCents(totals.subtotalCents) : "-"}</p>
                    <p className="text-sm text-stone-200">Extras: {totals ? formatCurrencyFromCents(totals.extrasTotalCents) : "-"}</p>
                    <p className="text-2xl font-semibold">Total: {totals ? formatCurrencyFromCents(totals.totalCents) : "-"}</p>
                  </div>
                </div>
              </div>

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
                  {isSaving ? "Guardando..." : editingQuoteId ? "Guardar cambios" : "Crear presupuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
