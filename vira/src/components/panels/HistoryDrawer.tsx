import { useEffect, useState } from "react";
import {
  collectCardHistoryEvents,
  parseIssueRef,
  stepFieldHeadRev,
  type Card,
  type HistoryEvent,
} from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { usePanels } from "../../store/usePanels.ts";
import { bindIssueRefActions } from "./history/issueRefActions.ts";
import { FieldRevisionChrome, TimelineChrome } from "./history/FieldRevisionChrome.tsx";
import { PanelCard } from "./history/PanelCard.tsx";
import { selectHistory } from "./history/selection.ts";

export function HistoryDrawer() {
  const refId = usePanels((state) => state.drawerRefId);
  const items = useDocument((state) => state.items);
  const parsed = refId ? parseIssueRef(refId) : null;
  const item = parsed ? items[parsed.itemId] : undefined;
  const [viewRev, setViewRev] = useState<number | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [eventIndex, setEventIndex] = useState<number | null>(null);

  useEffect(() => {
    setViewRev(null);
    setDiffOpen(false);
    setShowOlder(false);
    const next = refId ? parseIssueRef(refId) : null;
    const card = next ? useDocument.getState().items[next.itemId] : undefined;
    if (next?.stepIndex == null && card) {
      const events = collectCardHistoryEvents(card);
      setEventIndex(events.length ? events.length - 1 : null);
    } else {
      setEventIndex(null);
    }
  }, [refId]);

  useEffect(() => {
    if (!refId) return;
    const next = parseIssueRef(refId);
    if (!next || !items[next.itemId]) usePanels.getState().closeDrawer();
  }, [refId, items]);

  useEffect(() => bindIssueRefActions(), []);

  const {
    open,
    num,
    events,
    field,
    step,
    head,
    active,
    floor,
    hiddenOlder,
    visible,
    reason,
    highlight,
  } = selectHistory({ parsed, item, items, viewRev, showOlder, eventIndex });

  return (
    <aside
      className="issue-ref-panel"
      hidden={!open}
      role="complementary"
      aria-labelledby="issue-ref-panel-title"
      aria-label={open ? `Decision ${num}` : undefined}
    >
      <div className="issue-ref-panel-toolbar">
        <span className="issue-ref-panel-title" id="issue-ref-panel-title">{open ? `!${num}` : ""}</span>
        <button type="button" className="issue-ref-panel-close" data-action="close-issue-drawer" aria-label="Close">×</button>
      </div>
      <div className="issue-ref-panel-body">
        {open && item && parsed && (
          <>
            {item.archivedAt && <p className="issue-ref-preview-a issue-ref-preview-pending">This card is archived — shown for reference history.</p>}
            {parsed.stepIndex == null ? (
              events.length > 0 && (
                <div className="issue-ref-panel-ref-meta issue-ref-panel-card-history">
                  <p className="issue-ref-panel-revisions-title">Card history</p>
                  <div className="revision-timeline issue-ref-panel-card-history-timeline">
                    {events.map((event, index) => (
                      <HistoryEventButton
                        key={`${event.field}-${event.stepIndex}-${event.rev}-${index}`}
                        item={item}
                        event={event}
                        index={index}
                        active={eventIndex === index}
                        onSelect={() => setEventIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : step && head != null && active != null && (
              <FieldRevisionChrome
                parsed={parsed}
                step={step}
                field={field}
                head={head}
                active={active}
                reason={reason}
                visible={visible}
                hiddenOlder={hiddenOlder}
                showOlder={showOlder}
                diffOpen={diffOpen}
                onToggleDiff={() => setDiffOpen((openDiff) => !openDiff)}
                onToggleOlder={() => {
                  if (showOlder && floor != null && active < floor) setViewRev(floor);
                  setShowOlder((openOlder) => !openOlder);
                }}
                onSelect={(rev) => setViewRev(rev)}
              />
            )}
            {highlight && <PanelCard item={item} highlight={highlight} events={events} />}
          </>
        )}
      </div>
    </aside>
  );
}

function HistoryEventButton({
  item,
  event,
  index,
  active,
  onSelect,
}: {
  item: Card;
  event: HistoryEvent;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const step = item.steps[event.stepIndex];
  const head = step ? stepFieldHeadRev(step, event.field) : null;
  return (
    <button
      type="button"
      className={`revision-timeline-item${active ? " is-active" : ""}`}
      data-action="panel-rev-select"
      data-card-history="1"
      data-event-index={index}
      data-rev={event.rev}
      data-field={event.field}
      data-step={event.stepIndex}
      data-history-at={event.at}
      onClick={onSelect}
    >
      <TimelineChrome at={event.at} />
      <span className="revision-timeline-content">
        <div className="issue-ref-preview-revision-meta">
          v{event.rev} · {event.label}
          {event.tentative ? " · tentative" : ""}
          {event.archived ? " · archived" : ""}
          {event.rev === head ? " · current" : ""}
        </div>
        {event.archived ? "(removed)" : event.text}
      </span>
    </button>
  );
}
