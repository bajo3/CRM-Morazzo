import { calculateQuoteItem, formatAreaM2, formatCurrencyFromCents } from "@crm/shared";
import { useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { FormField, TextInput } from "../../components/ui/form-field";
import { StatusBadge } from "../../components/ui/status-badge";

const pricePerM2Cents = 83900;

export function CalculatorPage() {
  const [widthMm, setWidthMm] = useState(1200);
  const [heightMm, setHeightMm] = useState(1900);
  const [quantity, setQuantity] = useState(1);
  const [includeCanteado, setIncludeCanteado] = useState(true);
  const [includeInstallation, setIncludeInstallation] = useState(true);

  const result = useMemo(
    () =>
      calculateQuoteItem({
        widthMm,
        heightMm,
        quantity,
        pricePerM2Cents,
        extras: [
          ...(includeCanteado
            ? [{ label: "Canteado", pricingMode: "per_m2" as const, unitPriceCents: 4200 }]
            : []),
          ...(includeInstallation
            ? [{ label: "Instalacion", pricingMode: "fixed" as const, unitPriceCents: 35000 }]
            : []),
        ],
      }),
    [heightMm, includeCanteado, includeInstallation, quantity, widthMm],
  );

  return (
    <div className="space-y-6">
      <TopHeader
        title="Calculadora rapida"
        description="La formula sale de packages/shared y es la misma que debe usar backend y PDF."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Ancho (mm)">
              <TextInput type="number" value={widthMm} onChange={(event) => setWidthMm(Number(event.target.value))} />
            </FormField>
            <FormField label="Alto (mm)">
              <TextInput type="number" value={heightMm} onChange={(event) => setHeightMm(Number(event.target.value))} />
            </FormField>
            <FormField label="Cantidad">
              <TextInput type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </FormField>
            <FormField label="Precio base por m2">
              <TextInput type="text" value={formatCurrencyFromCents(pricePerM2Cents)} readOnly />
            </FormField>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIncludeCanteado((current) => !current)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${includeCanteado ? "border-accent bg-accentSoft text-accent" : "border-line bg-white text-stone-600"}`}
            >
              Canteado
            </button>
            <button
              type="button"
              onClick={() => setIncludeInstallation((current) => !current)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${includeInstallation ? "border-accent bg-accentSoft text-accent" : "border-line bg-white text-stone-600"}`}
            >
              Instalacion
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-[#233235] p-5 text-white shadow-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resultado</h3>
            <StatusBadge tone="info">shared</StatusBadge>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-stone-300">m2 por pieza</p>
              <p className="text-2xl font-semibold">{formatAreaM2(result.areaM2)}</p>
            </div>
            <div>
              <p className="text-sm text-stone-300">m2 total</p>
              <p className="text-2xl font-semibold">{formatAreaM2(result.totalAreaM2)}</p>
            </div>
            <div>
              <p className="text-sm text-stone-300">Subtotal</p>
              <p className="text-2xl font-semibold">{formatCurrencyFromCents(result.baseSubtotalCents)}</p>
            </div>
            <div>
              <p className="text-sm text-stone-300">Extras</p>
              <ul className="mt-2 space-y-2 text-sm text-stone-100">
                {result.extras.map((extra) => (
                  <li key={extra.label} className="flex items-center justify-between">
                    <span>{extra.label}</span>
                    <span>{formatCurrencyFromCents(extra.totalCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm text-stone-300">Total final</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrencyFromCents(result.totalCents)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

