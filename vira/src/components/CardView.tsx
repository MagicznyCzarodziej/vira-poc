import {
  cardNumber,
  cardStatusClass,
  getAnswerText,
  getProblemText,
  type Card,
} from "../domain/index.ts";
import { collectCardHistoryEvents } from "../domain/index.ts";
import { useDocument, type EditTarget, type Surface } from "../store/index.ts";
import { sameEditTarget } from "../store/editTarget.ts";
import { refPickModeActive } from "./text/bindRefPickFromCard.ts";
import { armEditHandoff } from "./card/AutoTextarea.tsx";
import { CardStep } from "./card/CardStep.tsx";
import { CardTags } from "./card/CardTags.tsx";
import { FollowupField } from "./card/FollowupField.tsx";
import { shouldSuppressListCardClick } from "./canvas/listCardDrag.ts";
import { IconTrash } from "./Icons.tsx";

function openCardHistory(itemId: string) {
  window.dispatchEvent(new CustomEvent("vira:open-drawer", { detail: { refId: itemId } }));
}

export function CardView({
  item,
  surface,
  draggableToCanvas = false,
  historyEventIndex = null,
  canvasPlacementKey = null,
}: {
  item: Card;
  surface: Surface | "panel";
  draggableToCanvas?: boolean;
  historyEventIndex?: number | null;
  /** Canvas host placement id (may differ from item.id when duplicated on canvas). */
  canvasPlacementKey?: string | null;
}) {
  const actionPoints = useDocument((state) => state.actionPoints);
  const resolutionContext = { actionPoints };
  const editing = useDocument((state) => state.editing);
  const editInitial = useDocument((state) => state.editInitial);
  const draft = useDocument((state) => state.followupDrafts[item.id] ?? "");
  const readOnly = surface === "panel";
  const events = historyEventIndex != null ? collectCardHistoryEvents(item) : null;
  const prefix = surface === "panel" ? "panel-" : surface === "canvas" ? "canvas-" : "";

  const editingHere = (field: EditTarget["field"], step = 0) =>
    !readOnly
    && editing?.id === item.id
    && editing.surface === surface
    && editing.field === field
    && editing.step === step
    && (surface !== "canvas" || (editing.canvasPlacementKey ?? null) === (canvasPlacementKey ?? null));

  const canvasEditTarget = (field: EditTarget["field"], step = 0): EditTarget => ({
    id: item.id,
    field,
    step,
    surface: surface as Surface,
    ...(surface === "canvas" && canvasPlacementKey ? { canvasPlacementKey } : {}),
  });

  const start = (target: EditTarget) => {
    if (refPickModeActive()) return;
    const current = useDocument.getState().editing;
    if (current && !sameEditTarget(current, target)) {
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
      canvasEditTarget={canvasEditTarget}
    />
  ));

  const canDragToCanvas = draggableToCanvas;
  const step0 = item.steps[0];
  const showFollowup = Boolean(
    step0
    && (getProblemText(step0).trim() || getAnswerText(step0, null, { live: true })?.trim()),
  );
  return (
    <article
      className={`card ${cardStatusClass(item, resolutionContext)}${readOnly ? " card-readonly" : ""}`}
      data-id={item.id}
      id={`${prefix}card-${item.id}`}
      data-canvas-drag-id={canDragToCanvas ? item.id : undefined}
      onClickCapture={(event) => {
        if (!canDragToCanvas || !shouldSuppressListCardClick()) return;
        if (event.target instanceof Element && event.target.closest("button, .card-id, .btn-delete, [data-action]")) {
          event.preventDefault();
          event.stopPropagation();
        }
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
                  if (shouldSuppressListCardClick()) return;
                  event.stopPropagation();
                  openCardHistory(item.id);
                }}
              >
                !{cardNumber(item.id)}
              </button>
              <CardTags
                item={item}
                readOnly={readOnly}
                surface={surface}
                editing={editingHere("tags")}
                editInitial={editInitial}
                onStart={() => start(canvasEditTarget("tags"))}
              />
            </div>
            {surface === "canvas" ? (
              <button
                type="button"
                className="btn-delete btn-delete--dismiss"
                data-action="remove-from-canvas"
                aria-label="Remove from canvas"
                onClick={() => {
                  if (shouldSuppressListCardClick()) return;
                  useDocument.getState().removeFromCanvas(canvasPlacementKey ?? item.id);
                }}
              >
                <span className="icon-dismiss" aria-hidden="true">×</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-delete btn-delete--archive"
                data-action="delete"
                aria-label="Archive card"
                onClick={() => {
                  if (shouldSuppressListCardClick()) return;
                  useDocument.getState().archiveCardById(item.id);
                }}
              >
                <IconTrash />
              </button>
            )}
          </div>
          <div className="timeline">{steps}</div>
          {!readOnly && showFollowup && (
            <div className="followup-slot">
              <div className="followup-slot-inner">
                <FollowupField
                  itemId={item.id}
                  surface={surface as Surface}
                  draft={draft}
                  canvasPlacementKey={surface === "canvas" ? canvasPlacementKey : null}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
