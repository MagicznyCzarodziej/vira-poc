import { cardNumber, ensureStepRevisions, stepFieldHeadRev, stepFieldRevisions } from "./steps.ts";
import type { Card, FieldName, Step } from "./types.ts";

export type HistoryEvent = {
  stepIndex: number;
  field: FieldName;
  rev: number;
  at: string;
  text: string;
  label: string;
  tentative: boolean;
  archived: boolean;
};

export function collectCardHistoryEvents(item: Card): HistoryEvent[] {
  const num = cardNumber(item.id);
  const events: HistoryEvent[] = [];
  item.steps.forEach((step, stepIndex) => {
    ensureStepRevisions(step);
    const sn = stepIndex + 1;
    for (const entry of stepFieldRevisions(step, "problem")) {
      events.push({
        stepIndex,
        field: "problem",
        rev: entry.rev,
        at: entry.at || "",
        text: entry.text,
        label: `!${num}/${sn} · question`,
        tentative: !!entry.tentative,
        archived: !!entry.archived,
      });
    }
    for (const entry of stepFieldRevisions(step, "answer")) {
      if (!entry.text?.trim() && entry.rev > 1) continue;
      events.push({
        stepIndex,
        field: "answer",
        rev: entry.rev,
        at: entry.at || "",
        text: entry.text,
        label: `!${num}/a${sn} · answer`,
        tentative: !!entry.tentative,
        archived: !!entry.archived,
      });
    }
  });
  events.sort((a, b) => {
    if (a.at !== b.at) return a.at.localeCompare(b.at);
    if (a.stepIndex !== b.stepIndex) return a.stepIndex - b.stepIndex;
    if (a.field !== b.field) return a.field === "problem" ? -1 : 1;
    return a.rev - b.rev;
  });
  return events;
}

export function firstHistoryEventIndexForStep(events: HistoryEvent[], stepIndex: number): number {
  const index = events.findIndex((event) => event.stepIndex === stepIndex);
  return index === -1 ? Infinity : index;
}

export function stepVisibleAtHistoryEvent(events: HistoryEvent[], stepIndex: number, eventIndex: number): boolean {
  return firstHistoryEventIndexForStep(events, stepIndex) <= eventIndex;
}

export function fieldRevAtHistoryEvent(
  events: HistoryEvent[],
  stepIndex: number,
  field: FieldName,
  eventIndex: number,
): number | null {
  let rev: number | null = null;
  events.forEach((event, index) => {
    if (index > eventIndex) return;
    if (event.stepIndex === stepIndex && event.field === field) rev = event.rev;
  });
  return rev;
}

export function headRev(step: Step, field: FieldName): number {
  return stepFieldHeadRev(step, field);
}
