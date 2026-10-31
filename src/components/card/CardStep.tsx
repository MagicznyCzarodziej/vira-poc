import {
  fieldRevAtHistoryEvent,
  formatDecisionDate,
  getAnswerText,
  getProblemText,
  isStepArchived,
  itemActiveSteps,
  stepFullyResolved,
  stepVisibleAtHistoryEvent,
  type Card,
  type HistoryEvent,
  type Step,
} from "../../domain/index.ts";
import { useDocument, type EditTarget, type Surface } from "../../store/index.ts";
import { IconTrash } from "../Icons.tsx";
import { RichText } from "../text/RichText.tsx";
import { refPickModeActive } from "../text/bindRefPickFromCard.ts";
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
}) {
  const editInitial = useDocument((state) => state.editInitial);
  const focusNonce = useDocument((state) => state.focusNonce);
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
  const empty = !answerText?.trim();
  const answered = historyEventIndex != null ? !empty : stepFullyResolved(step);
  const showRemove = !readOnly && !isStepArchived(step) && itemActiveSteps(item).length > 1;
  const edit = (field: "problem" | "answer") => (event: { target: EventTarget | null }) => {
    if (refPickModeActive() || readOnly || ignoresEdit(event)) return;
    start({ id: item.id, field, step: index, surface: surface as Surface });
  };

  return (
    <div className={`timeline-step${answered ? " answered" : ""}`} id={`${prefix}step-${item.id}-${index}`}>
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
              onEnterCommit={(value) => useDocument.getState().commitEdit(value, {
                id: item.id,
                field: "answer",
                step: index,
                surface: surface as Surface,
              })}
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
          className={`answer-block${step.answerTentative ? " answer-marked" : ""}`}
          id={`${prefix}answer-${item.id}-${index}`}
          data-ref-pick={readOnly ? undefined : "answer"}
          data-id={item.id}
          data-step={index}
        >
          <div className="answer-inner">
            {editingHere("answer", index) ? (
              <AutoTextarea
                key={`a-${focusNonce}`}
                className="inline-input inline-input-answer"
                initial={editInitial}
                dataset={{ "ref-item-id": item.id, "ref-field": "answer", "ref-step": String(index) }}
                onTag={(tag) => useDocument.getState().addTag(item.id, tag)}
                onCancel={() => useDocument.getState().cancelEdit()}
                onCommit={(value) => useDocument.getState().commitEdit(value)}
              />
            ) : (
              <span
                className={`answer-text${readOnly ? "" : " editable"}`}
                data-editable={readOnly ? undefined : "answer"}
                data-id={item.id}
                data-step={index}
                onClick={edit("answer")}
              >
                <RichText text={answerText ?? ""} />
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
