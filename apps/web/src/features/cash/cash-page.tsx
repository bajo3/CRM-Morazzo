import { formatCurrencyFromCents, paymentMethods } from "@crm/shared";
import { useEffect, useState } from "react";

import { TopHeader } from "../../components/layout/top-header";
import { DataTable } from "../../components/ui/data-table";
import { FormField, TextArea, TextInput } from "../../components/ui/form-field";
import { StatusBadge } from "../../components/ui/status-badge";
import { apiFetch } from "../../lib/api";
import { cashCategoryLabels, paymentMethodLabels, toSpanishLabel } from "../../lib/labels";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type QuoteRow = {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  status: string;
  totalCents: number;
};

type PaymentRow = {
  id: string;
  clientId: string;
  clientName: string;
  quoteId: string | null;
  quoteNumber: string | null;
  workOrderId: string | null;
  workOrderNumber: string | null;
  amountCents: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
};

type CashMovementRow = {
  id: string;
  type: string;
  amountCents: number;
  movementDate: string;
  category: string | null;
  paymentId: string | null;
  clientName?: string | null;
  quoteNumber?: string | null;
  concept: string;
  notes: string | null;
  isEditable?: boolean;
};

type CashSummary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  recent: CashMovementRow[];
};

const initialPaymentForm = {
  quoteId: "",
  amountCents: "",
  paymentMethod: "cash",
  notes: "",
};

const initialMovementForm = {
  type: "expense",
  concept: "",
  category: "misc",
  amountCents: "",
  movementDate: "",
  notes: "",
};

export function CashPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [manualMovements, setManualMovements] = useState<CashMovementRow[]>([]);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [movementForm, setMovementForm] = useState(initialMovementForm);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("Cargando caja.");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);

    try {
      const [quotesResponse, paymentsResponse, summaryResponse, movementsResponse] = await Promise.all([
        apiFetch<ApiResponse<QuoteRow[]>>("/quotes"),
        apiFetch<ApiResponse<PaymentRow[]>>("/payments"),
        apiFetch<ApiResponse<CashSummary>>("/cash/summary"),
        apiFetch<ApiResponse<CashMovementRow[]>>("/cash/movements"),
      ]);

      setQuotes(quotesResponse.data.filter((quote) => quote.status !== "rejected"));
      setPayments(paymentsResponse.data);
      setSummary(summaryResponse.data);
      setManualMovements(movementsResponse.data.filter((movement) => movement.isEditable));
      setFeedback("Caja lista para operar.");
    } catch {
      setFeedback("No se pudo cargar la caja.");
    } finally {
      setIsLoading(false);
    }
  }

  function openPaymentForm(payment?: PaymentRow) {
    if (payment) {
      setEditingPaymentId(payment.id);
      setPaymentForm({
        quoteId: payment.quoteId ?? "",
        amountCents: String(payment.amountCents),
        paymentMethod: payment.paymentMethod,
        notes: payment.notes ?? "",
      });
    } else {
      setEditingPaymentId(null);
      setPaymentForm({
        ...initialPaymentForm,
        quoteId: quotes[0]?.id ?? "",
      });
    }

    setShowPaymentForm(true);
  }

  function openMovementForm(movement?: CashMovementRow) {
    if (movement) {
      setEditingMovementId(movement.id);
      setMovementForm({
        type: movement.type,
        concept: movement.concept,
        category: movement.category ?? "misc",
        amountCents: String(movement.amountCents),
        movementDate: movement.movementDate.slice(0, 16),
        notes: movement.notes ?? "",
      });
    } else {
      setEditingMovementId(null);
      setMovementForm(initialMovementForm);
    }

    setShowMovementForm(true);
  }

  async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedQuote = quotes.find((quote) => quote.id === paymentForm.quoteId);

    if (!selectedQuote) {
      setFeedback("Seleccioná un presupuesto para registrar el pago.");
      return;
    }

    try {
      await apiFetch(editingPaymentId ? `/payments/${editingPaymentId}` : "/payments", {
        method: editingPaymentId ? "PUT" : "POST",
        body: JSON.stringify({
          clientId: selectedQuote.clientId,
          quoteId: selectedQuote.id,
          amountCents: Number(paymentForm.amountCents),
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes || null,
        }),
      });

      await loadData();
      setShowPaymentForm(false);
      setFeedback(editingPaymentId ? "Pago actualizado." : "Pago registrado.");
    } catch {
      setFeedback("No se pudo guardar el pago.");
    }
  }

  async function handleMovementSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiFetch(editingMovementId ? `/cash/movements/${editingMovementId}` : "/cash/movements", {
        method: editingMovementId ? "PUT" : "POST",
        body: JSON.stringify({
          type: movementForm.type,
          concept: movementForm.concept,
          category: movementForm.category,
          amountCents: Number(movementForm.amountCents),
          movementDate: movementForm.movementDate ? new Date(movementForm.movementDate).toISOString() : null,
          notes: movementForm.notes || null,
        }),
      });

      await loadData();
      setShowMovementForm(false);
      setFeedback(editingMovementId ? "Movimiento de caja actualizado." : "Movimiento de caja registrado.");
    } catch {
      setFeedback("No se pudo guardar el movimiento.");
    }
  }

  async function handleDeletePayment(payment: PaymentRow) {
    const confirmed = window.confirm(`¿Querés eliminar el pago ${payment.quoteNumber ?? ""}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/payments/${payment.id}`, {
        method: "DELETE",
      });
      await loadData();
      setFeedback("Pago eliminado.");
    } catch {
      setFeedback("No se pudo eliminar el pago.");
    }
  }

  async function handleDeleteMovement(movement: CashMovementRow) {
    const confirmed = window.confirm(`¿Querés eliminar el movimiento "${movement.concept}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/cash/movements/${movement.id}`, {
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
        title="Caja"
        description="Caja chica simple: seña, pago, ingreso, egreso y saldo claro."
        action={
          <div className="flex gap-3">
            <button type="button" onClick={() => openMovementForm()} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
              Nuevo movimiento
            </button>
            <button type="button" onClick={() => openPaymentForm()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
              Registrar pago
            </button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Saldo actual" value={formatCurrencyFromCents(summary?.balanceCents ?? 0)} />
        <MetricCard label="Ingresos" value={formatCurrencyFromCents(summary?.incomeCents ?? 0)} />
        <MetricCard label="Egresos" value={formatCurrencyFromCents(summary?.expenseCents ?? 0)} />
        <div className="rounded-2xl border border-line bg-white p-5 text-sm text-stone-600 shadow-panel">{feedback}</div>
      </section>

      {isLoading ? <LoadingRows /> : null}
      {!isLoading ? (
        <section className="space-y-6">
          <DataTable
            columns={[
              { key: "paidAt", header: "Fecha", render: (row) => new Date(row.paidAt).toLocaleDateString("es-AR") },
              { key: "clientName", header: "Cliente", render: (row) => row.clientName },
              { key: "quoteNumber", header: "Presupuesto", render: (row) => row.quoteNumber ?? "-" },
              { key: "amount", header: "Monto", render: (row) => formatCurrencyFromCents(row.amountCents) },
              { key: "method", header: "Medio", render: (row) => toSpanishLabel(row.paymentMethod, paymentMethodLabels) },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openPaymentForm(row)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-stone-700">
                      Editar
                    </button>
                    <button type="button" onClick={() => void handleDeletePayment(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      Eliminar
                    </button>
                  </div>
                ),
              },
            ]}
            rows={payments}
            emptyTitle="Sin pagos"
            emptyDescription="Registrá una seña o un pago final para empezar."
          />

          <DataTable
            columns={[
              { key: "movementDate", header: "Fecha", render: (row) => new Date(row.movementDate).toLocaleDateString("es-AR") },
              {
                key: "type",
                header: "Tipo",
                render: (row) => <StatusBadge tone={row.type === "income" ? "success" : "warning"}>{row.type === "income" ? "Ingreso" : "Egreso"}</StatusBadge>,
              },
              { key: "concept", header: "Concepto", render: (row) => row.concept },
              { key: "category", header: "Categoría", render: (row) => toSpanishLabel(row.category ?? "", cashCategoryLabels) || "-" },
              { key: "amount", header: "Monto", render: (row) => formatCurrencyFromCents(row.amountCents) },
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
            rows={manualMovements}
            emptyTitle="Sin movimientos manuales"
            emptyDescription="Usá esta sección como caja chica para ingresos y egresos rápidos."
          />
        </section>
      ) : null}

      {showPaymentForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2526]/50 p-4 backdrop-blur-sm">
          <form onSubmit={handlePaymentSubmit} className="w-full max-w-xl rounded-[32px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_30px_80px_rgba(31,37,33,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{editingPaymentId ? "Edición" : "Alta"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink">{editingPaymentId ? "Editar pago" : "Registrar pago"}</h3>
              </div>
              <button type="button" onClick={() => setShowPaymentForm(false)} className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-700">
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Presupuesto">
                <select
                  value={paymentForm.quoteId}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, quoteId: event.target.value }))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Seleccionar presupuesto</option>
                  {quotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quoteNumber} · {quote.clientName}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Monto">
                  <TextInput value={paymentForm.amountCents} onChange={(event) => setPaymentForm((current) => ({ ...current, amountCents: event.target.value }))} />
                </FormField>
                <FormField label="Medio de pago">
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {toSpanishLabel(method, paymentMethodLabels)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Observación">
                <TextArea value={paymentForm.notes} onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))} />
              </FormField>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-stone-700">
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white">
                  {editingPaymentId ? "Guardar cambios" : "Guardar pago"}
                </button>
              </div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tipo">
                  <select
                    value={movementForm.type}
                    onChange={(event) =>
                      setMovementForm((current) => ({
                        ...current,
                        type: event.target.value,
                        category: event.target.value === "income" ? "manual_income" : "misc",
                      }))
                    }
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Egreso</option>
                  </select>
                </FormField>
                <FormField label="Categoría">
                  <select
                    value={movementForm.category}
                    onChange={(event) => setMovementForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    {movementForm.type === "income" ? (
                      <>
                        <option value="deposit">Seña</option>
                        <option value="sale">Venta</option>
                        <option value="final_payment">Pago final</option>
                        <option value="manual_income">Ingreso manual</option>
                      </>
                    ) : (
                      <>
                        <option value="glass_purchase">Compra de vidrio</option>
                        <option value="hardware">Herrajes</option>
                        <option value="freight">Flete</option>
                        <option value="salaries">Sueldos</option>
                        <option value="misc">Varios</option>
                      </>
                    )}
                  </select>
                </FormField>
              </div>
              <FormField label="Concepto">
                <TextInput value={movementForm.concept} onChange={(event) => setMovementForm((current) => ({ ...current, concept: event.target.value }))} />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Monto">
                  <TextInput value={movementForm.amountCents} onChange={(event) => setMovementForm((current) => ({ ...current, amountCents: event.target.value }))} />
                </FormField>
                <FormField label="Fecha">
                  <TextInput type="datetime-local" value={movementForm.movementDate} onChange={(event) => setMovementForm((current) => ({ ...current, movementDate: event.target.value }))} />
                </FormField>
              </div>
              <FormField label="Observación opcional">
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
