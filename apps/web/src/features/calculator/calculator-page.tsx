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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<ApiResponse<GlassTypeRow[]>>("/settings/glass-types")
      .then((response) => {
        const activeRows = response.data.filter((row) => row.isActive);
        setGlassTypes(activeRows);
        if (activeRows[0]) {
          setSelectedGlassId(activeRows[0].id);
          setPricePerM2Cents(activeRows[0].pricePerM2Cents);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const result = useMemo(
    () =>
      calculateQuoteItem({
        widthMm: widthMm || 1,
        heightMm: heightMm || 1,
        quantity: quantity || 1,
        pricePerM2Cents,
        extras: [],
      }),
    [heightMm, pricePerM2Cents, quantity, widthMm],
  );

  function handleGlassChange(glassId: string) {
    const glass = glassTypes.find((item) => item.id === glassId);
    setSelectedGlassId(glassId);
    if (glass) {
      setPricePerM2Cents(glass.pricePerM2Cents);
    }
  }

  return (
    <div className="space-y-6">
      <TopHeader
        title="Calculadora rápida"
        description="Cotizá al vuelo. Elegí el producto, ingresá medidas y el total se calcula solo."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-panel">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Selector de producto - ocupa todo el ancho */}
              <FormField label="Producto / Tipo de vidrio">
                <select
                  value={selectedGlassId}
                  onChange={(event) => handleGlassChange(event.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {glassTypes.length === 0 ? (
                    <option value="">Sin productos en catálogo</option>
                  ) : null}
                  {glassTypes.map((glass) => (
                    <option key={glass.id} value={glass.id}>
                      {glass.name} {glass.thicknessMm} mm {glass.color} — {formatCurrencyFromCents(glass.pricePerM2Cents)}/m2
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Ancho (mm)">
                  <TextInput
                    type="number"
                    value={widthMm}
                    onChange={(event) => setWidthMm(Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Alto (mm)">
                  <TextInput
                    type="number"
                    value={heightMm}
                    onChange={(event) => setHeightMm(Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Cantidad">
                  <TextInput
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                  />
                </FormField>
              </div>

              {/* Precio editable — separado visualmente */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <FormField label="Precio por m2 ($) — editable">
                  <TextInput
                    type="number"
                    value={pricePerM2Cents}
                    onChange={(event) => setPricePerM2Cents(Number(event.target.value))}
                  />
                </FormField>
                <p className="mt-2 text-xs text-stone-500">
                  Se llena automáticamente al elegir el producto. Podés modificarlo para ajustar el precio.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-[#233235] p-6 text-white shadow-panel">
          <h3 className="text-base font-semibold text-stone-300">Resultado</h3>
          <div className="mt-5 space-y-4">
            <ResultRow label="Área por pieza" value={formatAreaM2(result.areaM2)} />
            <ResultRow label="Área total" value={formatAreaM2(result.totalAreaM2)} />
            <div className="mt-6 rounded-xl bg-white/10 p-5">
              <p className="text-sm text-stone-300">Total</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                {formatCurrencyFromCents(result.totalCents)}
              </p>
              {result.extrasTotalCents > 0 ? (
                <p className="mt-2 text-xs text-stone-400">
                  Vidrio: {formatCurrencyFromCents(result.baseSubtotalCents)} + extras: {formatCurrencyFromCents(result.extrasTotalCents)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
