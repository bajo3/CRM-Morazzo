import type { QuoteStatus, ScheduleStatus, WorkOrderStatus } from "./enums";

const quoteTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "approved", "rejected"],
  sent: ["approved", "rejected"],
  approved: ["in_progress", "paid"],
  rejected: [],
  in_progress: ["finished"],
  finished: ["delivered"],
  delivered: ["paid"],
  paid: [],
};

const workOrderTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  pending: ["cutting", "in_progress"],
  cutting: ["in_progress"],
  in_progress: ["ready"],
  ready: ["delivered", "installed"],
  delivered: [],
  installed: [],
};

const scheduleTransitions: Record<ScheduleStatus, ScheduleStatus[]> = {
  to_schedule: ["scheduled", "rescheduled"],
  scheduled: ["completed", "rescheduled"],
  completed: [],
  rescheduled: ["scheduled"],
};

export function canTransitionQuoteStatus(from: QuoteStatus, to: QuoteStatus): boolean {
  return quoteTransitions[from].includes(to);
}

export function canTransitionWorkOrderStatus(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return workOrderTransitions[from].includes(to);
}

export function canTransitionScheduleStatus(from: ScheduleStatus, to: ScheduleStatus): boolean {
  return scheduleTransitions[from].includes(to);
}

