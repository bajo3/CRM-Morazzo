import { stockMovementTypes } from "@crm/shared";
import { useEffect, useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiFetch } from "../../lib/api";
import { stockMovementLabels, toSpanishLabel } from "../../lib/labels";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type GlassTypeRow = {
  id: string;
  name: string;
  thicknessMm: number;
  color: string;
  pricePerM2Cents: number;
  isActive: boolean;
};

type StockSheetRow = {
  id: string;
  glassTypeId: string | null;
  typeLabel: string;
  thicknessMm: number;
  color: string;
  widthMm: number;
  heightMm: number;
  sheetCount: number;
  location: string | null;
  notes?: string | null;
  glassName: string | null;
};

type StockMovementRow = {
  id: string;
  stockSheetId: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  typeLabel: string;
  location: string | null;
};

type StockSummary = {
  totalSheets: number;
  lowStockCount: number;
  lowStock: StockSheetRow[];
};

const initialSheetForm = {
  glassTypeId: "",
  typeLabel: "",
  thicknessMm: "",
  color: "",
  widthMm: "",
  heightMm: "",
  sheetCount: "0",
  location: "",
  notes: "",
};

const initialMovementForm = {
  stockSheetId: "",
  type: "use",
  quantity: "1",
  notes: "",
};

export function StockPage() {
  const [glassTypes, setGlassTypes] = useState<GlassTypeRow[]>([]);
  const [sheets, setSheets] = useState<StockSheetRow[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [sheetForm, setSheetForm] = useState(initialSheetForm);
  const [movementForm, setMovementForm] = useState(initialMovementForm);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [showSheetForm, setShowSheetForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("Cargando stock.");

  const lowStockIds = useMemo(() => new Set(summary?.lowStock.map((item) => item.id) ?? []), [summary]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);

    try {
      const [glassResponse, sheetsResponse, movementsResponse, summaryResponse] = await Promise.all([
        apiFetch<ApiResponse<GlassTypeRow[]>>("/settings/glass-types"),
        apiFetch<ApiResponse<StockSheetRow[]>>("/stock/sheets"),
        apiFetch<ApiResponse<StockMovementRow[]>>("/stock/movements"),
        apiFetch<ApiResponse<StockSummary>>("/stock/summary"),
      ]);

      setGlassTypes(glassResponse.data.filter((row) => row.isActive));
      setSheets(sheetsResponse.data);
      setMovements(movementsResponse.data);
      setSummary(summaryResponse.data);
      setFeedback("Stock listo para operar.");
    } catch {
      setFeedback("No se pudo cargar el stock.");
    } finally {
      setIsLoading(false);
    }
  }

  function openSheetForm(sheet?: StockSheetRow) {
    if (sheet) {
      setEditingSheetId(sheet.id);
      setSheetForm({
        glassTypeId: sheet.glassTypeId ?? "",
        typeLabel: sheet.typeLabel,
        thicknessMm: String(sheet.thicknessMm),
        color: sheet.color,
        widthMm: String(sheet.widthMm),
        heightMm: String(sheet.heightMm),
        sheetCount: String(sheet.sheetCount),
        location: sheet.location ?? "",
        notes: sheet.notes ?? "",
      });
    } else {
      setEditingSheetId(null);
      setSheetForm(initialSheetForm);
    }

    setShowSheetForm(true);
  }

  function openMovementForm(movement?: StockMovementRow) {
    if (movement) {
      setEditingMovementId(movement.id);
      setMovementForm({
        stockSheetId: movement.stockSheetId,
        type: movement.type,
        quantity: String(movement.quantity),
        notes: movement.notes ?? "",
      });
    } else {
      setEditingMovementId(null);
      setMovementForm({
        ...initialMovementForm,
        stockSheetId: sheets[0]?.id ?? "",
      });
    }

    setShowMovementForm(true);
  }

  async function handleSheetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingSheetId ? `/stock/sheets/${editingSheetId}` : "/stock/sheets", {
        method: editingSheetId ? "PUT" : "POST",
        body: JSON.stringify({
          glassTypeId: sheetForm.glassTypeId || null,
          typeLabel: sheetForm.typeLabel,
          thicknessMm: Number(sheetForm.thicknessMm),
          color: sheetForm.color,
          widthMm: Number(sheetForm.widthMm),
          heightMm: Number(sheetForm.heightMm),
          sheetCount: Number(sheetForm.sheetCount),
          location: sheetForm.location || null,
          notes: sheetForm.notes || null,
        }),
      });

      await loadData();
      setShowSheetForm(false);
      setFeedback(editingSheetId ? "Hoja actualizada." : "Hoja creada.");
    } catch {
      setFeedback("No se pudo guardar la hoja.");
    }
  }

  async function handleMovementSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingMovementId ? `/stock/movements/${editingMovementId}` : "/stock/movements", {
        method: editingMovementId ? "PUT" : "POST",
        body: JSON.stringify({
          stockSheetId: movementForm.stockSheetId,
          type: movementForm.type,
          quantity: Number(movementForm.quantity),
          notes: movementForm.notes || null,
        }),
      });

      await loadData();
      setShowMovementForm(false);
      setFeedback(editingMovementId ? "Movimiento actualizado." : "Movimiento registrado.");
    } catch {
      setFeedback("No se pudo guardar el movimiento.");
    }
  }

  async function handleDeleteSheet(sheet: StockSheetRow) {
    const confirmed = window.confirm(`¿Querés eliminar la hoja ${sheet.typeLabel}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/stock/sheets/${sheet.id}`, {
        method: "DELETE",
      });
      await loadData();
      setFeedback("Hoja eliminada.");
    } catch {
      setFeedback("No se pudo eliminar la hoja. Si tiene movimientos, queda bloqueada.");
    }
  }

  async function handleDeleteMovement(movement: StockMovementRow) {
    const confirmed = window.confirm(`¿Querés eliminar el movimiento de ${movement.typeLabel}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/stock/movements/${movement.id}`, {
        method: "DELETE",
      });
      await loadData();
      setFeedback("Movimiento eliminado.");
    } catch {
      setFeedback("No se pudo eliminar el movimiento.");
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Stock"
        description="Hojas, movimientos y alerta de bajo stock con una operación simple."
        action={
          <div className="flex gap-3">
            <button type="button" onClick={() => openMovementForm()} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
              Nuevo movimiento
            </button>
            <button type="button" onClick={() => openSheetForm()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
              Nueva hoja
            </button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Hojas totales" value={String(summary?.totalSheets ?? 0)} />
        <MetricCard label="Stock bajo" value={String(summary?.lowStockCount ?? 0)} />
        <div className="rounded-2xl border border-line bg-white p-5 text-sm text-stone-600 shadow-panel">{feedback}</div>
      </section>

      {isLoading ? <LoadingRows /> : null}
      {!isLoading ? (
        <section className="space-y-6">
          <DataTable
            columns={[
              { key: "typeLabel", header: "Hoja", render: (row) => <span className="font-semibold text-ink">{row.typeLabel}</span> },
              { key: "size", header: "Medidas", render: (row) => `${row.widthMm} x ${row.heightMm} mm` },
              { key: "thickness", header: "Espesor", render: (row) => `${row.thicknessMm} mm` },
              {
                key: "sheetCount",
                header: "Stock",
                render: (row) => (
                  <StatusBadge tone={lowStockIds.has(row.id) ? "warning" : "success"}>{String(row.sheetCount)}</StatusBadge>
                ),
              },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openSheetForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                      Editar
                    </button>
                    <button type="button" onClick={() => void handleDeleteSheet(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      Eliminar
                    </button>
                  </div>
                ),
              },
            ]}
            rows={sheets}
            emptyTitle="Sin hojas"
            emptyDescription="Cargá hojas para controlar stock simple."
          />

          <DataTable
            columns={[
              { key: "createdAt", header: "Fecha", render: (row) => new Date(row.createdAt).toLocaleDateString("es-AR") },
              { key: "typeLabel", header: "Hoja", render: (row) => row.typeLabel },
              { key: "type", header: "Tipo", render: (row) => toSpanishLabel(row.type, stockMovementLabels) },
              { key: "quantity", header: "Cantidad", render: (row) => String(row.quantity) },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openMovementForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                      Editar
                    </button>
                    <button type="button" onClick={() => void handleDeleteMovement(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      Eliminar
                    </button>
                  </div>
                ),
              },
            ]}
            rows={movements}
            emptyTitle="Sin movimientos"
            emptyDescription="Registrá ingresos, uso, rotura o ajustes."
          />
        </section>
      ) : null}

      {showSheetForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleSheetSubmit} className="w-full max-w-3xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingSheetId ? "Edición" : "Alta"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingSheetId ? "Editar hoja" : "Nueva hoja"}</h3>
              </div>
              <button type="button" onClick={() => setShowSheetForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <FormField label="Tipo de vidrio">
                <select
                  value={sheetForm.glassTypeId}
                  onChange={(event) => setSheetForm((current) => ({ ...current, glassTypeId: event.target.value }))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Sin vínculo</option>
                  {glassTypes.map((glass) => (
                    <option key={glass.id} value={glass.id}>
                      {glass.name} {glass.thicknessMm} mm {glass.color}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Etiqueta">
                <TextInput value={sheetForm.typeLabel} onChange={(event) => setSheetForm((current) => ({ ...current, typeLabel: event.target.value }))} />
              </FormField>
              <FormField label="Espesor (mm)">
                <TextInput value={sheetForm.thicknessMm} onChange={(event) => setSheetForm((current) => ({ ...current, thicknessMm: event.target.value }))} />
              </FormField>
              <FormField label="Color">
                <TextInput value={sheetForm.color} onChange={(event) => setSheetForm((current) => ({ ...current, color: event.target.value }))} />
              </FormField>
              <FormField label="Ancho (mm)">
                <TextInput value={sheetForm.widthMm} onChange={(event) => setSheetForm((current) => ({ ...current, widthMm: event.target.value }))} />
              </FormField>
              <FormField label="Alto (mm)">
                <TextInput value={sheetForm.heightMm} onChange={(event) => setSheetForm((current) => ({ ...current, heightMm: event.target.value }))} />
              </FormField>
              <FormField label="Cantidad actual">
                <TextInput value={sheetForm.sheetCount} onChange={(event) => setSheetForm((current) => ({ ...current, sheetCount: event.target.value }))} />
              </FormField>
              <FormField label="Ubicación">
                <TextInput value={sheetForm.location} onChange={(event) => setSheetForm((current) => ({ ...current, location: event.target.value }))} />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Observaciones">
                <TextArea value={sheetForm.notes} onChange={(event) => setSheetForm((current) => ({ ...current, notes: event.target.value }))} />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowSheetForm(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
                Cancelar
              </button>
              <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
                {editingSheetId ? "Guardar cambios" : "Guardar hoja"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showMovementForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleMovementSubmit} className="w-full max-w-xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingMovementId ? "Edición" : "Alta"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingMovementId ? "Editar movimiento" : "Nuevo movimiento"}</h3>
              </div>
              <button type="button" onClick={() => setShowMovementForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Hoja">
                <select
                  value={movementForm.stockSheetId}
                  onChange={(event) => setMovementForm((current) => ({ ...current, stockSheetId: event.target.value }))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Seleccionar hoja</option>
                  {sheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.typeLabel} · {sheet.widthMm}x{sheet.heightMm}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tipo">
                  <select
                    value={movementForm.type}
                    onChange={(event) => setMovementForm((current) => ({ ...current, type: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {stockMovementTypes.map((type) => (
                      <option key={type} value={type}>
                        {toSpanishLabel(type, stockMovementLabels)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Cantidad">
                  <TextInput value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} />
                </FormField>
              </div>
              <FormField label="Observación">
                <TextArea value={movementForm.notes} onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))} />
              </FormField>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowMovementForm(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
                  {editingMovementId ? "Guardar cambios" : "Guardar movimiento"}
                </button>
              </div>
            </div>
          </form>
        </div>
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
