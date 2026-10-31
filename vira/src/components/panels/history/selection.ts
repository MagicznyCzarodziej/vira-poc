import {
  cardNumber,
  collectCardHistoryEvents,
  issueRefStaleReason,
  stepFieldHeadRev,
  stepFieldRevisions,
  type Card,
  type FieldName,
  type IssueRef,
} from "../../../domain/index.ts";

export function selectHistory(input: {
  parsed: IssueRef | null;
  item: Card | undefined;
  items: Record<string, Card>;
  viewRev: number | null;
  showOlder: boolean;
  eventIndex: number | null;
}) {
  const { parsed, item, items, viewRev, showOlder, eventIndex } = input;
  const open = !!(parsed && item);
  const num = item ? cardNumber(item.id) : "";
  const events = item && parsed?.stepIndex == null ? collectCardHistoryEvents(item) : [];
  const field: FieldName = parsed?.focusAnswer ? "answer" : "problem";
  const step = parsed?.stepIndex != null ? item?.steps[parsed.stepIndex] : undefined;
  const revisions = step ? [...stepFieldRevisions(step, field)].sort((a, b) => a.rev - b.rev) : [];
  const head = step ? stepFieldHeadRev(step, field) : null;
  const active = viewRev ?? parsed?.revision ?? head;
  const floor = parsed?.revision ?? null;
  const hiddenOlder = floor == null ? 0 : revisions.filter((entry) => entry.rev < floor).length;
  const visible = showOlder || floor == null ? revisions : revisions.filter((entry) => entry.rev >= floor);
  const reason = parsed ? issueRefStaleReason(items, parsed) : null;
  const historyEvent = eventIndex != null ? events[eventIndex] : undefined;
  const highlight = !parsed
    ? null
    : parsed.stepIndex == null
      ? {
          stepIndex: historyEvent?.stepIndex ?? null,
          focusAnswer: historyEvent?.field === "answer",
          displayRevision: historyEvent?.rev ?? null,
          historyEventIndex: eventIndex,
        }
      : {
          stepIndex: parsed.stepIndex,
          focusAnswer: parsed.focusAnswer,
          displayRevision: active,
          historyEventIndex: null,
        };
  return { open, num, events, field, step, head, active, floor, hiddenOlder, visible, reason, highlight };
}
