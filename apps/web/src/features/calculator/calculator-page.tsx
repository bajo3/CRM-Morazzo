import { calculateQuoteItem, formatAreaM2, formatCurrencyFromCents } from "@crm/shared";
import { useEffect, useMemo, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { FormField, TextInput } from "../../components/ui/form-field";
import { apiFetch } from "../../lib/api";

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

export function CalculatorPage() {
  const [glassTypes, setGlassTypes] = useState<GlassTypeRow[]>([]);
  const [selectedGlassId, setSelectedGlassId] = useState("");
  const [widthMm, setWidthMm] = useState(1200);
  const [heightMm, setHeightMm] = useState(1900);
  const [quantity, setQuantity] = useState(1);
  const [pricePerM2Cents, setPricePerM2Cents] = useState(0);
  const [feedback, setFeedback] = useState("Cargando lista de precios.");

  useEffect(() => {
    apiFetch<ApiResponse<GlassTypeRow[]>>("/settings/glass-types")
      .then((response) => {
        const activeRows = response.data.filter((row) => row.isActive);
        setGlassTypes(activeRows);
        if (activeRows[0]) {
          setSelectedGlassId(activeRows[0].id);
          setPricePerM2Cents(activeRows[0].pricePerM2Cents);
        }
        setFeedback("Calculadora lista para cotizar.");
      })
      .catch(() => {
        setFeedback("No se pudo cargar la lista de precios.");
      });
  }, []);

  const selectedGlass = glassTypes.find((glass) => glass.id === selectedGlassId) ?? null;

  const result = useMemo(
    () =>
      calculateQuoteItem({
        widthMm,
        heightMm,
        quantity,
        pricePerM2Cents,
        extras: [],
      }),
    [heightMm, pricePerM2Cents, quantity, widthMm],
  );

  function handleGlassChange(glassId: string) {
    const glass = glassTypes.find((item) => item.id === glassId);
    setSelectedGlassId(glassId);
    setPricePerM2Cents(glass?.pricePerM2Cents ?? 0);
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Calculadora rápida"
        description="Cotización ágil con precio editable y cambio rápido contra la lista de precios."
      />

      <div className="rounded-2xl border border-line bg-white p-4 text-sm text-stone-600 shadow-panel">{feedback}</div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tipo de vidrio / precio">
              <select
                value={selectedGlassId}
                onChange={(event) => handleGlassChange(event.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {glassTypes.map((glass) => (
                  <option key={glass.id} value={glass.id}>
                    {glass.name} {glass.thicknessMm} mm {glass.color}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Reemplazar por otro precio">
              <select
                value={String(pricePerM2Cents)}
                onChange={(event) => setPricePerM2Cents(Number(event.target.value))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {glassTypes.map((glass) => (
                  <option key={glass.id} value={glass.pricePerM2Cents}>
                    {glass.name} {glass.thicknessMm} mm {glass.color} · {formatCurrencyFromCents(glass.pricePerM2Cents)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Ancho (mm)">
              <TextInput type="number" value={widthMm} onChange={(event) => setWidthMm(Number(event.target.value))} />
            </FormField>
            <FormField label="Alto (mm)">
              <TextInput type="number" value={heightMm} onChange={(event) => setHeightMm(Number(event.target.value))} />
            </FormField>
            <FormField label="Cantidad">
              <TextInput type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </FormField>
            <FormField label="Precio por m2">
              <TextInput type="number" value={pricePerM2Cents} onChange={(event) => setPricePerM2Cents(Number(event.target.value))} />
            </FormField>
          </div>

          {selectedGlass ? (
            <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              Precio base sugerido: <span className="font-semibold">{selectedGlass.name} {selectedGlass.thicknessMm} mm {selectedGlass.color}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-line bg-[#233235] p-5 text-white shadow-panel">
          <h3 className="text-lg font-semibold">Resultado</h3>
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
