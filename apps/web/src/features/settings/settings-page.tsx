import { formatCurrencyFromCents } from "@crm/shared";

import { DataTable } from "../../components/ui/data-table";
import { TopHeader } from "../../components/layout/top-header";

const glassRows = [
  { name: "Float", thickness: "4 mm", color: "Transparente", price: formatCurrencyFromCents(28500) },
  { name: "Laminado", thickness: "3+3 mm", color: "Transparente", price: formatCurrencyFromCents(41200) },
  { name: "Blindex", thickness: "10 mm", color: "Transparente", price: formatCurrencyFromCents(83900) },
];

const extraRows = [
  { name: "Canteado", mode: "por m2", price: formatCurrencyFromCents(4200) },
  { name: "Perforaciones", mode: "por unidad", price: formatCurrencyFromCents(2500) },
  { name: "Flete", mode: "fijo", price: formatCurrencyFromCents(18000) },
];

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <TopHeader
        title="Configuracion de precios"
        description="Base simple para vidrio y extras. Esta configuracion alimenta la calculadora y los presupuestos."
        action={<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">Agregar precio</button>}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Tipos de vidrio</h3>
          <DataTable
            columns={[
              { key: "name", header: "Vidrio", render: (row) => row.name },
              { key: "thickness", header: "Espesor", render: (row) => row.thickness },
              { key: "color", header: "Color", render: (row) => row.color },
              { key: "price", header: "Precio por m2", render: (row) => <span className="font-semibold">{row.price}</span> },
            ]}
            rows={glassRows}
            emptyTitle="Sin tipos de vidrio"
            emptyDescription="Carga al menos un vidrio para habilitar la calculadora."
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Extras</h3>
          <DataTable
            columns={[
              { key: "name", header: "Extra", render: (row) => row.name },
              { key: "mode", header: "Modo", render: (row) => row.mode },
              { key: "price", header: "Precio", render: (row) => <span className="font-semibold">{row.price}</span> },
            ]}
            rows={extraRows}
            emptyTitle="Sin extras"
            emptyDescription="Carga extras opcionales para canteado, flete o instalacion."
          />
        </div>
      </section>
    </div>
  );
}

