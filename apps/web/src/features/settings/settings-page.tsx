import { extraPricingModes, formatCurrencyFromCents } from "@crm/shared";
import { useEffect, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiFetch } from "../../lib/api";
import { pricingModeLabels, toSpanishLabel } from "../../lib/labels";

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

type ServiceExtraRow = {
  id: string;
  name: string;
  pricingMode: string;
  unitPriceCents: number;
  isActive: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  description: string;
  defaultWidthMm: number | null;
  defaultHeightMm: number | null;
  defaultQuantity: number;
  defaultGlassLabel: string | null;
};

const initialGlassForm = {
  name: "",
  thicknessMm: "",
  color: "",
  pricePerM2Cents: "",
};

const initialExtraForm = {
  name: "",
  pricingMode: "per_m2",
  unitPriceCents: "",
};

const initialTemplateForm = {
  name: "",
  description: "",
  defaultWidthMm: "",
  defaultHeightMm: "",
  defaultQuantity: "1",
  defaultGlassLabel: "",
};

export function SettingsPage() {
  const [glassRows, setGlassRows] = useState<GlassTypeRow[]>([]);
  const [extraRows, setExtraRows] = useState<ServiceExtraRow[]>([]);
  const [templateRows, setTemplateRows] = useState<TemplateRow[]>([]);
  const [glassForm, setGlassForm] = useState(initialGlassForm);
  const [extraForm, setExtraForm] = useState(initialExtraForm);
  const [templateForm, setTemplateForm] = useState(initialTemplateForm);
  const [editingGlassId, setEditingGlassId] = useState<string | null>(null);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showGlassForm, setShowGlassForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [message, setMessage] = useState("Cargando catálogos.");

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    try {
      const [glassResponse, extraResponse, templateResponse] = await Promise.all([
        apiFetch<ApiResponse<GlassTypeRow[]>>("/settings/glass-types"),
        apiFetch<ApiResponse<ServiceExtraRow[]>>("/settings/service-extras"),
        apiFetch<ApiResponse<TemplateRow[]>>("/settings/templates"),
      ]);

      setGlassRows(glassResponse.data);
      setExtraRows(extraResponse.data);
      setTemplateRows(templateResponse.data);
      setMessage("Catálogos listos para editar.");
    } catch {
      setMessage("No se pudieron cargar los catálogos.");
    }
  }

  function openGlassForm(row?: GlassTypeRow) {
    if (row) {
      setEditingGlassId(row.id);
      setGlassForm({
        name: row.name,
        thicknessMm: String(row.thicknessMm),
        color: row.color,
        pricePerM2Cents: String(row.pricePerM2Cents),
      });
    } else {
      setEditingGlassId(null);
      setGlassForm(initialGlassForm);
    }

    setShowGlassForm(true);
  }

  function openExtraForm(row?: ServiceExtraRow) {
    if (row) {
      setEditingExtraId(row.id);
      setExtraForm({
        name: row.name,
        pricingMode: row.pricingMode,
        unitPriceCents: String(row.unitPriceCents),
      });
    } else {
      setEditingExtraId(null);
      setExtraForm(initialExtraForm);
    }

    setShowExtraForm(true);
  }

  function openTemplateForm(row?: TemplateRow) {
    if (row) {
      setEditingTemplateId(row.id);
      setTemplateForm({
        name: row.name,
        description: row.description,
        defaultWidthMm: row.defaultWidthMm ? String(row.defaultWidthMm) : "",
        defaultHeightMm: row.defaultHeightMm ? String(row.defaultHeightMm) : "",
        defaultQuantity: String(row.defaultQuantity),
        defaultGlassLabel: row.defaultGlassLabel ?? "",
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm(initialTemplateForm);
    }

    setShowTemplateForm(true);
  }

  async function handleGlassSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingGlassId ? `/settings/glass-types/${editingGlassId}` : "/settings/glass-types", {
        method: editingGlassId ? "PUT" : "POST",
        body: JSON.stringify({
          name: glassForm.name,
          thicknessMm: Number(glassForm.thicknessMm),
          color: glassForm.color,
          pricePerM2Cents: Number(glassForm.pricePerM2Cents),
        }),
      });
      await loadPage();
      setShowGlassForm(false);
      setMessage(editingGlassId ? "Tipo de vidrio actualizado." : "Tipo de vidrio creado.");
    } catch {
      setMessage("No se pudo guardar el tipo de vidrio.");
    }
  }

  async function handleExtraSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingExtraId ? `/settings/service-extras/${editingExtraId}` : "/settings/service-extras", {
        method: editingExtraId ? "PUT" : "POST",
        body: JSON.stringify({
          name: extraForm.name,
          pricingMode: extraForm.pricingMode,
          unitPriceCents: Number(extraForm.unitPriceCents),
        }),
      });
      await loadPage();
      setShowExtraForm(false);
      setMessage(editingExtraId ? "Extra actualizado." : "Extra creado.");
    } catch {
      setMessage("No se pudo guardar el extra.");
    }
  }

  async function handleTemplateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingTemplateId ? `/settings/templates/${editingTemplateId}` : "/settings/templates", {
        method: editingTemplateId ? "PUT" : "POST",
        body: JSON.stringify({
          name: templateForm.name,
          description: templateForm.description,
          defaultWidthMm: templateForm.defaultWidthMm ? Number(templateForm.defaultWidthMm) : null,
          defaultHeightMm: templateForm.defaultHeightMm ? Number(templateForm.defaultHeightMm) : null,
          defaultQuantity: Number(templateForm.defaultQuantity),
          defaultGlassLabel: templateForm.defaultGlassLabel || null,
        }),
      });
      await loadPage();
      setShowTemplateForm(false);
      setMessage(editingTemplateId ? "Plantilla actualizada." : "Plantilla creada.");
    } catch {
      setMessage("No se pudo guardar la plantilla.");
    }
  }

  async function handleDelete(path: string, successMessage: string, blockedMessage: string) {
    try {
      await apiFetch(path, {
        method: "DELETE",
      });
      await loadPage();
      setMessage(successMessage);
    } catch {
      setMessage(blockedMessage);
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Precios y plantillas"
        description="Lista de precios simple para vidrio, extras y plantillas reutilizables."
      />

      <div className="rounded-2xl border border-line bg-white p-4 text-sm text-stone-600 shadow-panel">{message}</div>

      <section className="space-y-6">
        <CatalogCard
          title="Tipos de vidrio"
          actionLabel="Nuevo vidrio"
          onAction={() => openGlassForm()}
          table={
            <DataTable
              columns={[
                { key: "name", header: "Vidrio", render: (row) => row.name },
                { key: "thickness", header: "Espesor", render: (row) => `${row.thicknessMm} mm` },
                { key: "color", header: "Color", render: (row) => row.color },
                { key: "price", header: "Precio", render: (row) => formatCurrencyFromCents(row.pricePerM2Cents) },
                {
                  key: "status",
                  header: "Estado",
                  render: (row) => <StatusBadge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Activo" : "Oculto"}</StatusBadge>,
                },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openGlassForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            `/settings/glass-types/${row.id}`,
                            "Tipo de vidrio eliminado u ocultado.",
                            "No se pudo borrar el tipo de vidrio.",
                          )
                        }
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={glassRows}
              emptyTitle="Sin tipos de vidrio"
              emptyDescription="Cargá al menos un tipo de vidrio para cotizar."
            />
          }
        />

        <CatalogCard
          title="Extras"
          actionLabel="Nuevo extra"
          onAction={() => openExtraForm()}
          table={
            <DataTable
              columns={[
                { key: "name", header: "Extra", render: (row) => row.name },
                { key: "mode", header: "Modo", render: (row) => toSpanishLabel(row.pricingMode, pricingModeLabels) },
                { key: "price", header: "Precio", render: (row) => formatCurrencyFromCents(row.unitPriceCents) },
                {
                  key: "status",
                  header: "Estado",
                  render: (row) => <StatusBadge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Activo" : "Oculto"}</StatusBadge>,
                },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openExtraForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            `/settings/service-extras/${row.id}`,
                            "Extra eliminado u ocultado.",
                            "No se pudo eliminar el extra.",
                          )
                        }
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={extraRows}
              emptyTitle="Sin extras"
              emptyDescription="Cargá extras para presupuestos y configuraciones."
            />
          }
        />

        <CatalogCard
          title="Plantillas"
          actionLabel="Nueva plantilla"
          onAction={() => openTemplateForm()}
          table={
            <DataTable
              columns={[
                { key: "name", header: "Plantilla", render: (row) => row.name },
                { key: "description", header: "Descripción", render: (row) => row.description },
                {
                  key: "measures",
                  header: "Medidas",
                  render: (row) => `${row.defaultWidthMm ?? "-"} x ${row.defaultHeightMm ?? "-"} mm`,
                },
                { key: "quantity", header: "Cant.", render: (row) => String(row.defaultQuantity) },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openTemplateForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            `/settings/templates/${row.id}`,
                            "Plantilla eliminada.",
                            "No se pudo eliminar la plantilla.",
                          )
                        }
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={templateRows}
              emptyTitle="Sin plantillas"
              emptyDescription="Guardá medidas y descripciones frecuentes."
            />
          }
        />
      </section>

      {showGlassForm ? (
        <ModalShell title={editingGlassId ? "Editar vidrio" : "Nuevo vidrio"} onClose={() => setShowGlassForm(false)}>
          <form onSubmit={handleGlassSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Nombre">
                <TextInput value={glassForm.name} onChange={(event) => setGlassForm((current) => ({ ...current, name: event.target.value }))} />
              </FormField>
              <FormField label="Color">
                <TextInput value={glassForm.color} onChange={(event) => setGlassForm((current) => ({ ...current, color: event.target.value }))} />
              </FormField>
              <FormField label="Espesor (mm)">
                <TextInput value={glassForm.thicknessMm} onChange={(event) => setGlassForm((current) => ({ ...current, thicknessMm: event.target.value }))} />
              </FormField>
              <FormField label="Precio por m2">
                <TextInput value={glassForm.pricePerM2Cents} onChange={(event) => setGlassForm((current) => ({ ...current, pricePerM2Cents: event.target.value }))} />
              </FormField>
            </div>
            <ModalActions onCancel={() => setShowGlassForm(false)} submitLabel={editingGlassId ? "Guardar cambios" : "Guardar vidrio"} />
          </form>
        </ModalShell>
      ) : null}

      {showExtraForm ? (
        <ModalShell title={editingExtraId ? "Editar extra" : "Nuevo extra"} onClose={() => setShowExtraForm(false)}>
          <form onSubmit={handleExtraSubmit} className="space-y-4">
            <FormField label="Nombre">
              <TextInput value={extraForm.name} onChange={(event) => setExtraForm((current) => ({ ...current, name: event.target.value }))} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Modo">
                <select
                  value={extraForm.pricingMode}
                  onChange={(event) => setExtraForm((current) => ({ ...current, pricingMode: event.target.value }))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {extraPricingModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {toSpanishLabel(mode, pricingModeLabels)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Precio">
                <TextInput value={extraForm.unitPriceCents} onChange={(event) => setExtraForm((current) => ({ ...current, unitPriceCents: event.target.value }))} />
              </FormField>
            </div>
            <ModalActions onCancel={() => setShowExtraForm(false)} submitLabel={editingExtraId ? "Guardar cambios" : "Guardar extra"} />
          </form>
        </ModalShell>
      ) : null}

      {showTemplateForm ? (
        <ModalShell title={editingTemplateId ? "Editar plantilla" : "Nueva plantilla"} onClose={() => setShowTemplateForm(false)}>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <FormField label="Nombre">
              <TextInput value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} />
            </FormField>
            <FormField label="Descripción">
              <TextArea value={templateForm.description} onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Ancho (mm)">
                <TextInput value={templateForm.defaultWidthMm} onChange={(event) => setTemplateForm((current) => ({ ...current, defaultWidthMm: event.target.value }))} />
              </FormField>
              <FormField label="Alto (mm)">
                <TextInput value={templateForm.defaultHeightMm} onChange={(event) => setTemplateForm((current) => ({ ...current, defaultHeightMm: event.target.value }))} />
              </FormField>
              <FormField label="Cantidad">
                <TextInput value={templateForm.defaultQuantity} onChange={(event) => setTemplateForm((current) => ({ ...current, defaultQuantity: event.target.value }))} />
              </FormField>
              <FormField label="Vidrio sugerido">
                <TextInput value={templateForm.defaultGlassLabel} onChange={(event) => setTemplateForm((current) => ({ ...current, defaultGlassLabel: event.target.value }))} />
              </FormField>
            </div>
            <ModalActions onCancel={() => setShowTemplateForm(false)} submitLabel={editingTemplateId ? "Guardar cambios" : "Guardar plantilla"} />
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

function CatalogCard({
  title,
  actionLabel,
  onAction,
  table,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  table: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_45px_rgba(92,74,46,0.08)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        <button type="button" onClick={onAction} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
          {actionLabel}
        </button>
      </div>
      {table}
    </section>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Configuración</p>
            <h3 className="mt-1 text-2xl font-semibold text-ink">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
            Cerrar
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
        Cancelar
      </button>
      <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
        {submitLabel}
      </button>
    </div>
  );
}
