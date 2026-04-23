import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { formatCurrencyFromCents } from "@crm/shared";

type QuotePdfData = {
  quoteNumber: string;
  issueDate: string;
  validUntil: string | null;
  clientName: string;
  clientPhone: string | null;
  clientAddress: string | null;
  notes: string | null;
  totalCents: number;
  items: Array<{
    description: string;
    widthMm: number;
    heightMm: number;
    quantity: number;
    totalCents: number;
  }>;
};

export async function buildQuotePdf(data: QuotePdfData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.12, 0.15, 0.13);
  const muted = rgb(0.42, 0.45, 0.43);
  const accent = rgb(0.16, 0.37, 0.38);

  let y = 790;
  page.drawText("Vidrieria F. Morazzo", { x: 50, y, size: 22, font: bold, color: dark });
  y -= 24;
  page.drawText("Presupuesto", { x: 50, y, size: 11, font, color: muted });

  page.drawRectangle({ x: 380, y: 760, width: 165, height: 54, color: rgb(0.94, 0.96, 0.95) });
  page.drawText(`Nro: ${data.quoteNumber}`, { x: 392, y: 794, size: 10, font: bold, color: dark });
  page.drawText(`Fecha: ${data.issueDate}`, { x: 392, y: 779, size: 10, font, color: dark });
  page.drawText(`Validez: ${data.validUntil ?? "-"}`, { x: 392, y: 764, size: 10, font, color: dark });

  y = 725;
  page.drawText("Cliente", { x: 50, y, size: 11, font: bold, color: accent });
  y -= 18;
  page.drawText(data.clientName, { x: 50, y, size: 12, font: bold, color: dark });
  y -= 15;
  page.drawText(`Telefono: ${data.clientPhone ?? "-"}`, { x: 50, y, size: 10, font, color: dark });
  y -= 14;
  page.drawText(`Direccion: ${data.clientAddress ?? "-"}`, { x: 50, y, size: 10, font, color: dark });

  y -= 36;
  page.drawText("Detalle", { x: 50, y, size: 11, font: bold, color: accent });
  y -= 18;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.86, 0.86, 0.84) });
  y -= 20;

  page.drawText("Descripcion", { x: 50, y, size: 10, font: bold, color: muted });
  page.drawText("Medidas", { x: 280, y, size: 10, font: bold, color: muted });
  page.drawText("Cant.", { x: 390, y, size: 10, font: bold, color: muted });
  page.drawText("Total", { x: 470, y, size: 10, font: bold, color: muted });

  y -= 14;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.88) });
  y -= 18;

  for (const item of data.items) {
    page.drawText(item.description.slice(0, 34), { x: 50, y, size: 10, font, color: dark });
    page.drawText(`${item.widthMm} x ${item.heightMm} mm`, { x: 280, y, size: 10, font, color: dark });
    page.drawText(String(item.quantity), { x: 400, y, size: 10, font, color: dark });
    page.drawText(formatCurrencyFromCents(item.totalCents), { x: 470, y, size: 10, font: bold, color: dark });
    y -= 18;
  }

  if (data.notes) {
    y -= 16;
    page.drawText("Observaciones", { x: 50, y, size: 11, font: bold, color: accent });
    y -= 18;
    page.drawText(data.notes.slice(0, 110), { x: 50, y, size: 10, font, color: dark });
  }

  page.drawRectangle({ x: 360, y: 90, width: 185, height: 70, color: rgb(0.15, 0.2, 0.21) });
  page.drawText("Total", { x: 378, y: 132, size: 11, font, color: rgb(0.9, 0.92, 0.91) });
  page.drawText(formatCurrencyFromCents(data.totalCents), { x: 378, y: 105, size: 24, font: bold, color: rgb(1, 1, 1) });

  return pdf.save();
}

