export const quoteStatusLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
  in_progress: "En curso",
  finished: "Finalizado",
  delivered: "Entregado",
  paid: "Pagado",
};

export const workOrderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  cutting: "En corte",
  in_progress: "En producción",
  ready: "Lista",
  delivered: "Entregada",
  installed: "Colocada",
};

export const scheduleStatusLabels: Record<string, string> = {
  to_schedule: "A coordinar",
  scheduled: "Agendada",
  completed: "Realizada",
  rescheduled: "Reprogramada",
};

export const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  bank_transfer: "Transferencia",
  debit_card: "Tarjeta débito",
  credit_card: "Tarjeta crédito",
  mercado_pago: "Mercado Pago",
  other: "Otro",
};

export const stockMovementLabels: Record<string, string> = {
  in: "Ingreso",
  use: "Uso",
  breakage: "Rotura",
  manual_adjustment: "Ajuste manual",
};

export const cashCategoryLabels: Record<string, string> = {
  deposit: "Seña",
  sale: "Venta",
  final_payment: "Pago final",
  manual_income: "Ingreso manual",
  glass_purchase: "Compra de vidrio",
  hardware: "Herrajes",
  freight: "Flete",
  salaries: "Sueldos",
  misc: "Varios",
};

export const pricingModeLabels: Record<string, string> = {
  per_unit: "Por unidad",
  per_m2: "Por m2",
  fixed: "Fijo",
};

export function toSpanishLabel(value: string, labels: Record<string, string>) {
  return labels[value] ?? value;
}
