import {
  fieldRevAtHistoryEvent,
  formatDecisionDate,
  getAnswerText,
  getProblemText,
  isStepArchived,
  itemActiveSteps,
  stepActionPointRefIds,
  stepHasVisibleAnswerContent,
  stepFlaggedByActionPoints,
  stepFullyResolved,
  stepVisibleAtHistoryEvent,
  type Card,
  type HistoryEvent,
  type Step,
  type StepResolutionContext,
} from "../../domain/index.ts";
import { useDocument, type EditTarget, type Surface } from "../../store/index.ts";
import { IconActionPoint, IconTrash } from "../Icons.tsx";
import { ActionPointRefStack } from "../text/ActionPointRefStack.tsx";
import { RichText } from "../text/RichText.tsx";
import { refPickModeActive } from "../text/bindRefPickFromCard.ts";
import { shouldSuppressListCardClick } from "../canvas/listCardDrag.ts";
import { AutoTextarea } from "./AutoTextarea.tsx";

function ignoresEdit(event: { target: EventTarget | null }): boolean {
  return event.target instanceof Element && !!event.target.closest("button, [data-action], textarea, input");
}

export function CardStep({
  item,
  step,
  index,
  surface,
  prefix,
  readOnly,
  historyEventIndex,
  events,
  editingHere,
  start,
  canvasEditTarget,
}: {
  item: Card;
  step: Step;
  index: number;
  surface: Surface | "panel";
  prefix: string;
  readOnly: boolean;
  historyEventIndex: number | null;
  events: HistoryEvent[] | null;
  editingHere: (field: EditTarget["field"], step?: number) => boolean;
  start: (target: EditTarget) => void;
  canvasEditTarget: (field: "problem" | "answer") => EditTarget;
}) {
  const editInitial = useDocument((state) => state.editInitial);
  const focusNonce = useDocument((state) => state.focusNonce);
  const actionPoints = useDocument((state) => state.actionPoints);
  const resolutionContext: StepResolutionContext = { actionPoints };
  if (!readOnly && isStepArchived(step)) return null;
  if (events && historyEventIndex != null && !stepVisibleAtHistoryEvent(events, index, historyEventIndex)) return null;
  const problemText = events && historyEventIndex != null
    ? getProblemText(step, fieldRevAtHistoryEvent(events, index, "problem", historyEventIndex))
    : getProblemText(step);
  const answerRev = events && historyEventIndex != null
    ? fieldRevAtHistoryEvent(events, index, "answer", historyEventIndex)
    : null;
  const answerText = events && historyEventIndex != null
    ? (answerRev != null ? getAnswerText(step, answerRev) : null)
    : getAnswerText(step, null, { live: !readOnly });
  const empty = !stepHasVisibleAnswerContent(step, answerText);
  const refOnlyDecision = !empty && !answerText?.trim();
  const answered = historyEventIndex != null ? !empty : stepFullyResolved(step, resolutionContext);
  const flaggedByActionPoints = stepFlaggedByActionPoints(step, resolutionContext);
  const hasQuestion = Boolean(problemText.trim());
  const showProblemRow = hasQuestion || editingHere("problem", index);
  const showRemove = !readOnly && !isStepArchived(step) && itemActiveSteps(item).length > 1 && hasQuestion;
  const canvasEditViaGesture = surface === "canvas";
  const edit = (field: "problem" | "answer") => (event: { target: EventTarget | null }) => {
    if (canvasEditViaGesture) return;
    if (shouldSuppressListCardClick() || refPickModeActive() || readOnly || ignoresEdit(event)) return;
    start(canvasEditTarget(field));
  };

  return (
    <div className={`timeline-step${answered ? " answered" : ""}${!hasQuestion && !empty ? " decision-only" : ""}`} id={`${prefix}step-${item.id}-${index}`}>
      {showProblemRow && (
      <div className="problem-row">
        {showRemove && (
          <button type="button" className="field-remove-btn field-remove-btn--problem" data-action="remove-step" aria-label="Archive question" onClick={() => useDocument.getState().archiveQuestionAt(item.id, index)}>
            <IconTrash />
          </button>
        )}
        {editingHere("problem", index) ? (
          <div className="problem">
            <AutoTextarea
              key={`p-${focusNonce}`}
              className="inline-input inline-input-problem"
              initial={editInitial}
              dataset={{ "ref-item-id": item.id, "ref-field": "problem", "ref-step": String(index) }}
              onTag={(tag) => useDocument.getState().addTag(item.id, tag)}
              onCancel={() => useDocument.getState().cancelEdit()}
              onCommit={(value) => useDocument.getState().commitEdit(value)}
              onEnterCommit={(value) => useDocument.getState().commitEdit(value, canvasEditTarget("answer"))}
            />
          </div>
        ) : (
          <div
            className={`problem${readOnly ? "" : " editable"}`}
            data-editable={readOnly ? undefined : "problem"}
            data-ref-pick={readOnly ? undefined : "problem"}
            data-id={item.id}
            data-step={index}
            onClick={edit("problem")}
          >
            <RichText text={problemText} />
          </div>
        )}
      </div>
      )}
      {empty ? (
        editingHere("answer", index) ? (
          <div className="answer-block" id={`${prefix}answer-${item.id}-${index}`}>
            <AutoTextarea
              key={`a-${focusNonce}`}
              className="inline-input inline-input-answer"
              initial={editInitial}
              dataset={{ "ref-item-id": item.id, "ref-field": "answer", "ref-step": String(index) }}
              onTag={(tag) => useDocument.getState().addTag(item.id, tag)}
              onCancel={() => useDocument.getState().cancelEdit()}
              onCommit={(value) => useDocument.getState().commitEdit(value)}
            />
          </div>
        ) : (
          <div
            className={`answer-block${readOnly ? "" : " editable"} empty`}
            id={`${prefix}answer-${item.id}-${index}`}
            data-editable={readOnly ? undefined : "answer"}
            data-ref-pick={readOnly ? undefined : "answer"}
            data-id={item.id}
            data-step={index}
            onClick={edit("answer")}
          >
            {readOnly ? "" : "Add decision"}
          </div>
        )
      ) : (
        <div
          className={`answer-block${step.answerTentative || flaggedByActionPoints ? " answer-marked" : ""}${refOnlyDecision ? " decision-ref-only" : ""}`}
          id={`${prefix}answer-${item.id}-${index}`}
          data-ref-pick={readOnly ? undefined : "answer"}
          data-editable={readOnly || !refOnlyDecision ? undefined : "answer"}
          data-id={item.id}
          data-step={index}
          onClick={readOnly || !refOnlyDecision ? undefined : edit("answer")}
        >
          <div className="answer-inner">
            {editingHere("answer", index) ? (
              <div className="answer-text answer-text--editing">
                <AutoTextarea
                  key={`a-${focusNonce}`}
                  className="inline-input inline-input-answer"
                  initial={editInitial}
                  dataset={{ "ref-item-id": item.id, "ref-field": "answer", "ref-step": String(index) }}
                  onTag={(tag) => useDocument.getState().addTag(item.id, tag)}
                  onCancel={() => useDocument.getState().cancelEdit()}
                  onCommit={(value) => useDocument.getState().commitEdit(value)}
                />
                <ActionPointRefStack refIds={stepActionPointRefIds(step)} allowUnlink={!readOnly} />
              </div>
            ) : (
              <span
                className={`answer-text${readOnly ? "" : " editable"}`}
                data-editable={readOnly ? undefined : "answer"}
                data-id={item.id}
                data-step={index}
                onClick={edit("answer")}
              >
                {refOnlyDecision && (
                  <span className="decision-ref-only-hint">Add decision text…</span>
                )}
                <RichText
                  text={answerText ?? ""}
                  actionPointRefIds={stepActionPointRefIds(step)}
                  allowActionPointUnlink={!readOnly}
                />
              </span>
            )}
            <div className="answer-meta">
              {!readOnly && (
                <div className="answer-meta-actions">
                  {!empty && (
                    <button type="button" className="field-remove-btn" data-action="clear-answer" aria-label="Archive answer" onClick={() => useDocument.getState().archiveAnswer(item.id, index)}>
                      <IconTrash />
                    </button>
                  )}
                  <button
                    type="button"
                    className="field-remove-btn field-remove-btn--action-point"
                    data-action="add-action-point"
                    aria-label="Add action point"
                    title="Add action to do (linked in this decision)"
                    onClick={() => {
                      if (shouldSuppressListCardClick()) return;
                      useDocument.getState().addActionPointToDecision(item.id, index, surface as Surface);
                    }}
                  >
                    <IconActionPoint />
                  </button>
                  <button
                    type="button"
                    className="answer-mark-btn"
                    data-action="toggle-answer-tentative"
                    aria-pressed={step.answerTentative}
                    aria-label={step.answerTentative ? "Clear tentative mark" : "Mark answer as tentative"}
                    title="Still needs specify, refine, or further thought"
                    onClick={() => useDocument.getState().toggleTentative(item.id, index)}
                  >
                    <span className="answer-mark-icon" aria-hidden="true">⚑</span>
                  </button>
                </div>
              )}
              {step.decidedAt && <time className="decision-date" dateTime={step.decidedAt}>{formatDecisionDate(step.decidedAt)}</time>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
