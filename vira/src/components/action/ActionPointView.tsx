import { memo } from "react";
import { actionPointDisplayNum } from "../../domain/index.ts";
import type { ActionPoint } from "../../domain/types.ts";
import { useDocument, type EditTarget, type Surface } from "../../store/index.ts";
import { shouldSuppressListCardClick } from "../canvas/listCardDrag.ts";
import { AutoTextarea } from "../card/AutoTextarea.tsx";
import { IconCircleCheck, IconDismiss, IconUndo } from "../Icons.tsx";
import { RichText } from "../text/RichText.tsx";

export const ActionPointView = memo(function ActionPointView({
  actionPoint,
  surface,
  draggableToCanvas = false,
}: {
  actionPoint: ActionPoint;
  surface: Surface | "panel";
  draggableToCanvas?: boolean;
}) {
  const placements = useDocument((state) => state.actionPointPlacements);
  const editing = useDocument((state) => state.editing);
  const editInitial = useDocument((state) => {
    const e = state.editing;
    if (!e || e.id !== actionPoint.id || e.field !== "actionPoint" || e.surface !== surface) return "";
    return state.editInitial;
  });
  const focusNonce = useDocument((state) => {
    const e = state.editing;
    if (!e || e.id !== actionPoint.id || e.field !== "actionPoint" || e.surface !== surface) return 0;
    return state.focusNonce;
  });
  const onCanvas = !!placements[actionPoint.id];
  const readOnly = surface === "panel";
  const canDragToCanvas = draggableToCanvas && !onCanvas;
  const blocked = draggableToCanvas && onCanvas;
  const editingHere =
    !readOnly
    && editing?.id === actionPoint.id
    && editing.field === "actionPoint"
    && editing.surface === surface;

  const startEdit = () => {
    if (readOnly || shouldSuppressListCardClick()) return;
    useDocument.getState().beginEdit({
      id: actionPoint.id,
      field: "actionPoint",
      step: 0,
      surface: surface as Surface,
    });
  };

  const num = actionPointDisplayNum(actionPoint.id);

  return (
    <article
      className={`action-point-card${actionPoint.done ? " is-done" : ""}${readOnly ? " action-point-readonly" : ""}${blocked ? " canvas-list-drag-blocked" : ""}`}
      data-id={actionPoint.id}
      data-action-point-id={actionPoint.id}
      data-canvas-drag-ap-id={canDragToCanvas ? actionPoint.id : undefined}
      onClickCapture={(event) => {
        if (!canDragToCanvas || !shouldSuppressListCardClick()) return;
        if (event.target instanceof Element && event.target.closest("button, input, label, [data-editable], [data-action]")) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="action-point-top">
        <span className="action-point-id">ap-{num}</span>
      </div>
      <div className="action-point-body">
        {surface !== "canvas" ? (
          <label className="action-point-done">
            <input
              type="checkbox"
              checked={actionPoint.done}
              disabled={readOnly}
              onChange={() => useDocument.getState().toggleActionPointDone(actionPoint.id)}
            />
            <span className="visually-hidden">Done</span>
          </label>
        ) : null}
        {editingHere ? (
          <AutoTextarea
            key={`ap-${focusNonce}`}
            className="inline-input inline-input-action-point"
            initial={editInitial}
            dataset={{ "action-point-id": actionPoint.id }}
            onCancel={() => useDocument.getState().cancelEdit()}
            onCommit={(value) => useDocument.getState().commitEdit(value)}
          />
        ) : (
          <div
            className={`action-point-title${readOnly ? "" : " editable"}`}
            data-editable={readOnly ? undefined : "actionPoint"}
            onClick={startEdit}
          >
            <RichText text={actionPoint.title} />
          </div>
        )}
      </div>
      {surface === "canvas" ? (
        <div className="action-point-canvas-actions" role="group" aria-label="Action controls">
          {actionPoint.done ? (
            <>
              <button
                type="button"
                className="action-point-icon-btn"
                data-action="undo-action-point-done"
                aria-label="Mark action not done"
                title="Undo done"
                onClick={() => useDocument.getState().toggleActionPointDone(actionPoint.id)}
              >
                <IconUndo />
              </button>
              <button
                type="button"
                className="action-point-icon-btn action-point-icon-btn--dismiss"
                data-action="remove-action-point-from-canvas"
                aria-label="Dismiss from canvas"
                title="Dismiss from canvas (keeps action in list)"
                onClick={() => useDocument.getState().removeActionPointFromCanvas(actionPoint.id)}
              >
                <IconDismiss />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="action-point-icon-btn"
              data-action="complete-action-point-on-canvas"
              aria-label="Mark action done"
              title="Mark done"
              onClick={() => useDocument.getState().toggleActionPointDone(actionPoint.id)}
            >
              <IconCircleCheck />
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
});
