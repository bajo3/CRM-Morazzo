import {
  calculateQuoteItem,
  calculateQuoteTotals,
  formatQuoteNumber,
  formatWorkOrderNumber,
  toAreaBasisPoints,
  type CashExpenseCategory,
  type CashIncomeCategory,
  type ExtraPricingMode,
  type PaymentMethod,
  type QuoteStatus,
  type QuoteExtraInput,
  type ScheduleStatus,
  type WorkOrderStatus,
} from "@crm/shared";

export type DemoClientSeed = {
  id: string;
  name: string;
  phone: string;
  address: string;
  jobSite: string;
  notes: string;
};

export type DemoGlassSeed = {
  id: string;
  name: string;
  thicknessMm: number;
  color: string;
  pricePerM2Cents: number;
};

export type DemoExtraSeed = {
  id: string;
  name: string;
  pricingMode: ExtraPricingMode;
  unitPriceCents: number;
};

export type DemoTemplateSeed = {
  id: string;
  name: string;
  description: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultQuantity: number;
  defaultGlassLabel: string;
};

export type DemoQuoteSeed = {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: QuoteStatus;
  issueDate: string;
  validUntil: string;
  notes: string;
  internalNotes: string;
  subtotalCents: number;
  extrasTotalCents: number;
  totalCents: number;
};

export type DemoQuoteItemSeed = {
  id: string;
  quoteId: string;
  glassTypeId: string;
  description: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitPricePerM2Cents: number;
  areaM2: number;
  subtotalCents: number;
  extrasTotalCents: number;
  totalCents: number;
  extraBreakdown: QuoteExtraInput[];
};

export type DemoWorkOrderSeed = {
  id: string;
  workOrderNumber: string;
  quoteId: string;
  clientId: string;
  status: WorkOrderStatus;
  promisedDate: string;
  internalNotes: string;
};

export type DemoWorkOrderItemSeed = {
  id: string;
  workOrderId: string;
  description: string;
  glassLabel: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
};

export type DemoPaymentSeed = {
  id: string;
  clientId: string;
  quoteId: string;
  workOrderId: string | null;
  amountCents: number;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type DemoCashMovementSeed = {
  id: string;
  type: "income" | "expense";
  incomeCategory: CashIncomeCategory | null;
  expenseCategory: CashExpenseCategory | null;
  clientId: string | null;
  quoteId: string | null;
  paymentId: string | null;
  amountCents: number;
  notes: string;
};

export type DemoStockSheetSeed = {
  id: string;
  glassTypeId: string;
  typeLabel: string;
  thicknessMm: number;
  color: string;
  widthMm: number;
  heightMm: number;
  sheetCount: number;
  location: string;
  notes: string;
};

export type DemoStockMovementSeed = {
  id: string;
  stockSheetId: string;
  type: "in" | "use" | "breakage" | "manual_adjustment";
  quantity: number;
  notes: string;
};

export type DemoScheduleSeed = {
  id: string;
  clientId: string;
  workOrderId: string;
  status: ScheduleStatus;
  address: string;
  scheduledDate: string;
  timeLabel: string;
  jobType: string;
  notes: string;
};

export const demoClients: DemoClientSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452001",
    name: "Lucia Fernandez",
    phone: "11-5555-1201",
    address: "Av. Rivadavia 1234",
    jobSite: "Caballito",
    notes: "Cliente frecuente de espejos y mamparas",
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452002",
    name: "Estudio Norte",
    phone: "11-5555-1202",
    address: "Del Libertador 4550",
    jobSite: "Nunez obra",
    notes: "Piden puerta blindex y panos fijos",
  },
];

export const demoGlassTypes: DemoGlassSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452101",
    name: "Float",
    thicknessMm: 4,
    color: "Transparente",
    pricePerM2Cents: 28500,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452102",
    name: "Laminado",
    thicknessMm: 6,
    color: "Transparente",
    pricePerM2Cents: 41200,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452103",
    name: "Blindex",
    thicknessMm: 10,
    color: "Transparente",
    pricePerM2Cents: 83900,
  },
];

export const demoServiceExtras: DemoExtraSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452201",
    name: "Canteado",
    pricingMode: "per_m2",
    unitPriceCents: 4200,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452202",
    name: "Perforaciones",
    pricingMode: "per_unit",
    unitPriceCents: 2500,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452203",
    name: "Flete",
    pricingMode: "fixed",
    unitPriceCents: 18000,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452204",
    name: "Instalacion",
    pricingMode: "fixed",
    unitPriceCents: 35000,
  },
];

export const demoTemplates: DemoTemplateSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452301",
    name: "Espejo bano",
    description: "Espejo simple con canteado perimetral",
    defaultWidthMm: 600,
    defaultHeightMm: 800,
    defaultQuantity: 1,
    defaultGlassLabel: "Espejo 4 mm",
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452302",
    name: "Mampara",
    description: "Mampara de vidrio templado con instalacion",
    defaultWidthMm: 1200,
    defaultHeightMm: 1900,
    defaultQuantity: 1,
    defaultGlassLabel: "Blindex 10 mm",
  },
];

const quoteOneItemOneExtras: QuoteExtraInput[] = [
  { extraId: demoServiceExtras[0].id, label: "Canteado", pricingMode: "per_m2", unitPriceCents: 4200 },
  { extraId: demoServiceExtras[3].id, label: "Instalacion", pricingMode: "fixed", unitPriceCents: 35000 },
];

const quoteOneItemTwoExtras: QuoteExtraInput[] = [
  { extraId: demoServiceExtras[1].id, label: "Perforaciones", pricingMode: "per_unit", unitPriceCents: 2500 },
];

const quoteOneItemOne = calculateQuoteItem({
  widthMm: 1200,
  heightMm: 1900,
  quantity: 1,
  pricePerM2Cents: demoGlassTypes[2].pricePerM2Cents,
  extras: quoteOneItemOneExtras,
});

const quoteOneItemTwo = calculateQuoteItem({
  widthMm: 800,
  heightMm: 1200,
  quantity: 2,
  pricePerM2Cents: demoGlassTypes[1].pricePerM2Cents,
  extras: quoteOneItemTwoExtras,
});

const quoteOneTotals = calculateQuoteTotals([quoteOneItemOne, quoteOneItemTwo]);

export const demoQuotes: DemoQuoteSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452401",
    quoteNumber: formatQuoteNumber(1),
    clientId: demoClients[0].id,
    status: "approved",
    issueDate: "2026-04-20",
    validUntil: "2026-04-27",
    notes: "Incluye colocacion en domicilio.",
    internalNotes: "Coordinar con cliente por la tarde.",
    subtotalCents: quoteOneTotals.subtotalCents,
    extrasTotalCents: quoteOneTotals.extrasTotalCents,
    totalCents: quoteOneTotals.totalCents,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452402",
    quoteNumber: formatQuoteNumber(2),
    clientId: demoClients[1].id,
    status: "sent",
    issueDate: "2026-04-22",
    validUntil: "2026-04-29",
    notes: "Presupuesto sujeto a confirmacion de herrajes.",
    internalNotes: "Enviar seguimiento en 48 hs.",
    subtotalCents: 268480,
    extrasTotalCents: 18000,
    totalCents: 286480,
  },
];

export const demoQuoteItems: DemoQuoteItemSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452411",
    quoteId: demoQuotes[0].id,
    glassTypeId: demoGlassTypes[2].id,
    description: "Mampara blindex",
    widthMm: 1200,
    heightMm: 1900,
    quantity: 1,
    unitPricePerM2Cents: demoGlassTypes[2].pricePerM2Cents,
    areaM2: toAreaBasisPoints(quoteOneItemOne.areaM2),
    subtotalCents: quoteOneItemOne.baseSubtotalCents,
    extrasTotalCents: quoteOneItemOne.extrasTotalCents,
    totalCents: quoteOneItemOne.totalCents,
    extraBreakdown: quoteOneItemOneExtras,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452412",
    quoteId: demoQuotes[0].id,
    glassTypeId: demoGlassTypes[1].id,
    description: "Panel lateral laminado",
    widthMm: 800,
    heightMm: 1200,
    quantity: 2,
    unitPricePerM2Cents: demoGlassTypes[1].pricePerM2Cents,
    areaM2: toAreaBasisPoints(quoteOneItemTwo.areaM2),
    subtotalCents: quoteOneItemTwo.baseSubtotalCents,
    extrasTotalCents: quoteOneItemTwo.extrasTotalCents,
    totalCents: quoteOneItemTwo.totalCents,
    extraBreakdown: quoteOneItemTwoExtras,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452413",
    quoteId: demoQuotes[1].id,
    glassTypeId: demoGlassTypes[2].id,
    description: "Puerta blindex",
    widthMm: 900,
    heightMm: 2200,
    quantity: 1,
    unitPricePerM2Cents: demoGlassTypes[2].pricePerM2Cents,
    areaM2: toAreaBasisPoints(calculateQuoteItem({
      widthMm: 900,
      heightMm: 2200,
      quantity: 1,
      pricePerM2Cents: demoGlassTypes[2].pricePerM2Cents,
      extras: [{ extraId: demoServiceExtras[2].id, label: "Flete", pricingMode: "fixed", unitPriceCents: 18000 }],
    }).areaM2),
    subtotalCents: 166122,
    extrasTotalCents: 18000,
    totalCents: 184122,
    extraBreakdown: [{ extraId: demoServiceExtras[2].id, label: "Flete", pricingMode: "fixed", unitPriceCents: 18000 }],
  },
];

export const demoWorkOrders: DemoWorkOrderSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452501",
    workOrderNumber: formatWorkOrderNumber(1),
    quoteId: demoQuotes[0].id,
    clientId: demoClients[0].id,
    status: "in_progress",
    promisedDate: "2026-04-26",
    internalNotes: "Preparar herrajes y coordinar instalacion.",
  },
];

export const demoWorkOrderItems: DemoWorkOrderItemSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452511",
    workOrderId: demoWorkOrders[0].id,
    description: "Mampara blindex",
    glassLabel: "Blindex 10 mm",
    widthMm: 1200,
    heightMm: 1900,
    quantity: 1,
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452512",
    workOrderId: demoWorkOrders[0].id,
    description: "Panel lateral laminado",
    glassLabel: "Laminado 6 mm",
    widthMm: 800,
    heightMm: 1200,
    quantity: 2,
  },
];

export const demoPayments: DemoPaymentSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452601",
    clientId: demoClients[0].id,
    quoteId: demoQuotes[0].id,
    workOrderId: demoWorkOrders[0].id,
    amountCents: 120000,
    paymentMethod: "bank_transfer",
    notes: "Sena inicial",
  },
];

export const demoCashMovements: DemoCashMovementSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452701",
    type: "income",
    incomeCategory: "deposit",
    expenseCategory: null,
    clientId: demoClients[0].id,
    quoteId: demoQuotes[0].id,
    paymentId: demoPayments[0].id,
    amountCents: 120000,
    notes: "Sena inicial mampara",
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452702",
    type: "expense",
    incomeCategory: null,
    expenseCategory: "glass_purchase",
    clientId: null,
    quoteId: null,
    paymentId: null,
    amountCents: 54000,
    notes: "Compra de hojas laminadas",
  },
];

export const demoStockSheets: DemoStockSheetSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452801",
    glassTypeId: demoGlassTypes[1].id,
    typeLabel: "Laminado",
    thicknessMm: 6,
    color: "Transparente",
    widthMm: 3600,
    heightMm: 2600,
    sheetCount: 4,
    location: "Deposito A",
    notes: "Stock principal",
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452802",
    glassTypeId: demoGlassTypes[2].id,
    typeLabel: "Blindex",
    thicknessMm: 10,
    color: "Transparente",
    widthMm: 3300,
    heightMm: 2500,
    sheetCount: 1,
    location: "Deposito B",
    notes: "Stock bajo para templado",
  },
];

export const demoStockMovements: DemoStockMovementSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452811",
    stockSheetId: demoStockSheets[0].id,
    type: "in",
    quantity: 5,
    notes: "Ingreso proveedor abril",
  },
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452812",
    stockSheetId: demoStockSheets[1].id,
    type: "use",
    quantity: 1,
    notes: "Uso en mampara aprobada",
  },
];

export const demoScheduleEntries: DemoScheduleSeed[] = [
  {
    id: "01964153-5d57-7a55-8f6d-0c54d3452901",
    clientId: demoClients[0].id,
    workOrderId: demoWorkOrders[0].id,
    status: "scheduled",
    address: "Av. Rivadavia 1234",
    scheduledDate: "2026-04-26",
    timeLabel: "15:00",
    jobType: "Colocacion mampara",
    notes: "Llevar herrajes cromados",
  },
];
