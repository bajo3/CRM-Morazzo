import { useQuery } from "@tanstack/react-query";
import type { Client } from "@crm/shared";

import { apiFetch } from "./api";

type ApiResponse<T> = { ok: boolean; data: T };

// ─── Query keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  clients: ["clients"] as const,
  quotes: ["quotes"] as const,
  quoteDetail: (id: string) => ["quotes", id] as const,
  payments: ["payments"] as const,
  cashSummary: ["cash", "summary"] as const,
  cashMovements: ["cash", "movements"] as const,
  glassTypes: ["settings", "glass-types"] as const,
  serviceExtras: ["settings", "service-extras"] as const,
  stockSheets: ["stock", "sheets"] as const,
  stockMovements: ["stock", "movements"] as const,
  stockSummary: ["stock", "summary"] as const,
  workOrders: ["work-orders"] as const,
  workOrderDetail: (id: string) => ["work-orders", id] as const,
  schedule: ["schedule"] as const,
  dashboardSummary: ["dashboard", "summary"] as const,
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchClients() {
  const res = await apiFetch<ApiResponse<Client[]>>("/clients");
  return res.data;
}

type QuoteRow = {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: string;
  issueDate: string;
  totalCents: number;
  clientName: string;
};

async function fetchQuotes() {
  const res = await apiFetch<ApiResponse<QuoteRow[]>>("/quotes");
  return res.data;
}

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

async function fetchPayments() {
  const res = await apiFetch<ApiResponse<PaymentRow[]>>("/payments");
  return res.data;
}

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

async function fetchCashSummary() {
  const res = await apiFetch<ApiResponse<CashSummary>>("/cash/summary");
  return res.data;
}

async function fetchCashMovements() {
  const res = await apiFetch<ApiResponse<CashMovementRow[]>>("/cash/movements");
  return res.data;
}

type GlassTypeRow = {
  id: string;
  name: string;
  thicknessMm: number;
  color: string;
  pricePerM2Cents: number;
  isActive: boolean;
};

async function fetchGlassTypes() {
  const res = await apiFetch<ApiResponse<GlassTypeRow[]>>("/settings/glass-types");
  return res.data;
}

type ServiceExtraRow = {
  id: string;
  name: string;
  pricingMode: "per_unit" | "per_m2" | "fixed";
  unitPriceCents: number;
  isActive: boolean;
};

async function fetchServiceExtras() {
  const res = await apiFetch<ApiResponse<ServiceExtraRow[]>>("/settings/service-extras");
  return res.data;
}

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

async function fetchStockSheets() {
  const res = await apiFetch<ApiResponse<StockSheetRow[]>>("/stock/sheets");
  return res.data;
}

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

async function fetchStockMovements() {
  const res = await apiFetch<ApiResponse<StockMovementRow[]>>("/stock/movements");
  return res.data;
}

type StockSummary = {
  totalSheets: number;
  lowStockCount: number;
  lowStock: StockSheetRow[];
};

async function fetchStockSummary() {
  const res = await apiFetch<ApiResponse<StockSummary>>("/stock/summary");
  return res.data;
}

type WorkOrderRow = {
  id: string;
  workOrderNumber: string;
  quoteId: string | null;
  clientId: string;
  status: string;
  promisedDate: string | null;
  clientName: string;
};

async function fetchWorkOrders() {
  const res = await apiFetch<ApiResponse<WorkOrderRow[]>>("/work-orders");
  return res.data;
}

type ScheduleRow = {
  id: string;
  clientId: string;
  workOrderId: string | null;
  status: string;
  scheduledDate: string;
  timeLabel: string | null;
  address: string;
  jobType: string;
  notes: string | null;
  clientName: string;
  workOrderNumber: string | null;
};

async function fetchSchedule() {
  const res = await apiFetch<ApiResponse<ScheduleRow[]>>("/schedule");
  return res.data;
}

type DashboardSummary = {
  pendingQuotes: number;
  approvedQuotes: number;
  pendingOrders: number;
  readyOrders: number;
  overdueOrders: number;
  pendingPaymentsCents: number;
  lowStockCount: number;
  todayCashCents: number;
  upcoming: Array<{
    id: string;
    scheduledDate: string;
    timeLabel: string | null;
    address: string;
    jobType: string;
    status: string;
    clientName: string | null;
  }>;
};

async function fetchDashboardSummary() {
  const res = await apiFetch<ApiResponse<DashboardSummary>>("/dashboard/summary");
  return res.data;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useClients() {
  return useQuery({ queryKey: queryKeys.clients, queryFn: fetchClients, staleTime: 2 * 60_000 });
}

export function useQuotes() {
  return useQuery({ queryKey: queryKeys.quotes, queryFn: fetchQuotes });
}

export function usePayments() {
  return useQuery({ queryKey: queryKeys.payments, queryFn: fetchPayments });
}

export function useCashSummary() {
  return useQuery({ queryKey: queryKeys.cashSummary, queryFn: fetchCashSummary, staleTime: 30_000 });
}

export function useCashMovements() {
  return useQuery({ queryKey: queryKeys.cashMovements, queryFn: fetchCashMovements, staleTime: 30_000 });
}

export function useGlassTypes() {
  return useQuery({ queryKey: queryKeys.glassTypes, queryFn: fetchGlassTypes, staleTime: 5 * 60_000 });
}

export function useServiceExtras() {
  return useQuery({ queryKey: queryKeys.serviceExtras, queryFn: fetchServiceExtras, staleTime: 5 * 60_000 });
}

export function useStockSheets() {
  return useQuery({ queryKey: queryKeys.stockSheets, queryFn: fetchStockSheets });
}

export function useStockMovements() {
  return useQuery({ queryKey: queryKeys.stockMovements, queryFn: fetchStockMovements });
}

export function useStockSummary() {
  return useQuery({ queryKey: queryKeys.stockSummary, queryFn: fetchStockSummary });
}

export function useWorkOrders() {
  return useQuery({ queryKey: queryKeys.workOrders, queryFn: fetchWorkOrders });
}

export function useSchedule() {
  return useQuery({ queryKey: queryKeys.schedule, queryFn: fetchSchedule });
}

export function useDashboardSummary() {
  return useQuery({ queryKey: queryKeys.dashboardSummary, queryFn: fetchDashboardSummary, staleTime: 30_000 });
}
