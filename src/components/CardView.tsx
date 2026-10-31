import {
  cardNumber,
  cardStatusClass,
  type Card,
} from "../domain/index.ts";
import { collectCardHistoryEvents } from "../domain/history.ts";
import { useDocument, type EditTarget, type Surface } from "../store/useDocument.ts";
import { refPickModeActive } from "./text/bindRefPickFromCard.ts";
import { armEditHandoff } from "./card/AutoTextarea.tsx";
import { CardStep } from "./card/CardStep.tsx";
import { CardTags } from "./card/CardTags.tsx";
import { FollowupField } from "./card/FollowupField.tsx";
import { IconTrash } from "./Icons.tsx";

export function CardView({
  item,
  surface,
  draggableToCanvas = false,
  historyEventIndex = null,
}: {
  item: Card;
  surface: Surface | "panel";
  draggableToCanvas?: boolean;
  historyEventIndex?: number | null;
}) {
  const placements = useDocument((state) => state.canvasPlacements);
  const editing = useDocument((state) => state.editing);
  const editInitial = useDocument((state) => state.editInitial);
  const draft = useDocument((state) => state.followupDrafts[item.id] ?? "");
  const onCanvas = !!placements[item.id];
  const readOnly = surface === "panel";
  const events = historyEventIndex != null ? collectCardHistoryEvents(item) : null;
  const prefix = surface === "panel" ? "panel-" : surface === "canvas" ? "canvas-" : "";

  const editingHere = (field: EditTarget["field"], step = 0) =>
    !readOnly && editing?.id === item.id && editing.surface === surface && editing.field === field && editing.step === step;

  const start = (target: EditTarget) => {
    if (refPickModeActive()) return;
    const current = useDocument.getState().editing;
    if (current && (current.id !== target.id || current.field !== target.field || current.step !== target.step || current.surface !== target.surface)) {
      armEditHandoff(true);
      const active = document.activeElement;
      const value = active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement ? active.value : useDocument.getState().editInitial;
      useDocument.getState().commitEdit(value, target);
      armEditHandoff(false);
      return;
    }
    useDocument.getState().beginEdit(target);
  };

  const steps = item.steps.map((step, index) => (
    <CardStep
      key={index}
      item={item}
      step={step}
      index={index}
      surface={surface}
      prefix={prefix}
      readOnly={readOnly}
      historyEventIndex={historyEventIndex ?? null}
      events={events}
      editingHere={editingHere}
      start={start}
    />
  ));

  const blocked = draggableToCanvas && onCanvas;
  return (
    <article
      className={`card ${cardStatusClass(item)}${readOnly ? " card-readonly" : ""}${blocked ? " canvas-list-drag-blocked" : ""}`}
      data-id={item.id}
      id={`${prefix}card-${item.id}`}
      draggable={draggableToCanvas && !onCanvas}
      data-canvas-drag-id={draggableToCanvas && !onCanvas ? item.id : undefined}
      onDragStart={(event) => {
        if (event.target instanceof Element && event.target.closest("button, [data-action]")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "copyMove";
      }}
    >
      <div className="card-top">
        <div className="card-main">
          <div className="card-header">
            <div className="tags-row" aria-label={`Decision !${cardNumber(item.id)}`}>
              <button
                type="button"
                className="card-id"
                data-action="open-card-history"
                data-id={item.id}
                aria-label={`Open card history for !${cardNumber(item.id)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  window.dispatchEvent(new CustomEvent("vira:open-drawer", { detail: { refId: item.id } }));
                }}
              >
                !{cardNumber(item.id)}
              </button>
              <CardTags
                item={item}
                readOnly={readOnly}
                editing={editingHere("tags")}
                editInitial={editInitial}
                onStart={() => start({ id: item.id, field: "tags", step: 0, surface: surface as Surface })}
              />
            </div>
            {surface === "canvas" ? (
              <button type="button" className="btn-delete btn-delete--dismiss" data-action="remove-from-canvas" aria-label="Remove from canvas" onClick={() => useDocument.getState().removeFromCanvas(item.id)}>
                <span className="icon-dismiss" aria-hidden="true">×</span>
              </button>
            ) : (
              <button type="button" className="btn-delete btn-delete--archive" data-action="delete" aria-label="Archive card" onClick={() => useDocument.getState().archiveCardById(item.id)}>
                <IconTrash />
              </button>
            )}
          </div>
          <div className="timeline">{steps}</div>
          {!readOnly && (
            <div className="followup-slot">
              <div className="followup-slot-inner">
                <FollowupField itemId={item.id} surface={surface as Surface} draft={draft} />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
