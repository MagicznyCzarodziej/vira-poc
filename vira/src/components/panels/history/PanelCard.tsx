import {
  cardNumber,
  cardStatusClass,
  fieldRevAtHistoryEvent,
  formatDecisionDate,
  getAnswerText,
  getProblemText,
  stepActionPointRefIds,
  stepFieldHeadRev,
  stepFullyResolved,
  stepVisibleAtHistoryEvent,
  tagStyle,
  type Card,
  type FieldName,
  type HistoryEvent,
} from "../../../domain/index.ts";
import { useDocument } from "../../../store/index.ts";
import { RichText } from "../../text/RichText.tsx";

export function PanelCard({
  item,
  highlight,
  events,
}: {
  item: Card;
  highlight: { stepIndex: number | null; focusAnswer: boolean; displayRevision: number | null; historyEventIndex: number | null };
  events: HistoryEvent[];
}) {
  const actionPoints = useDocument((state) => state.actionPoints);
  const num = cardNumber(item.id);
  const history = highlight.historyEventIndex != null;
  return (
    <article
      className={`card ${cardStatusClass(item, { actionPoints })}${highlight.stepIndex == null ? " highlight" : ""} card-readonly`}
      data-id={item.id}
      id={`panel-card-${item.id}`}
    >
      <div className="card-top">
        <div className="card-main">
          <div className="card-header">
            <div className="tags-row" aria-label={`Decision !${num}`}>
              <button type="button" className="card-id" data-action="open-card-history" data-id={item.id} aria-label={`Open card history for !${num}`}>!{num}</button>
              {item.tags.length > 0 && (
                <span className="tags-row-tags">
                  {item.tags.map((tag) => <span className="tag" style={tagStyle(tag)} key={tag}>{tag}</span>)}
                </span>
              )}
            </div>
          </div>
          <div className="timeline">
            {item.steps.map((step, index) => {
              if (history && highlight.historyEventIndex != null && !stepVisibleAtHistoryEvent(events, index, highlight.historyEventIndex)) return null;
              const refStep = highlight.stepIndex === index;
              const refField: FieldName = highlight.focusAnswer ? "answer" : "problem";
              const headRev = refStep ? stepFieldHeadRev(step, refField) : null;
              const pinRev = refStep ? highlight.displayRevision : null;
              const viewingSnapshot = refStep && pinRev != null && headRev != null && pinRev !== headRev;
              const bar = refStep ? (viewingSnapshot ? " panel-ref-target panel-ref-target--snapshot" : " panel-ref-target panel-ref-target--current") : "";
              let problemText: string;
              let answerText: string | null;
              if (history && highlight.historyEventIndex != null) {
                const problemRev = fieldRevAtHistoryEvent(events, index, "problem", highlight.historyEventIndex);
                problemText = problemRev != null ? getProblemText(step, problemRev) : getProblemText(step);
                const answerRev = fieldRevAtHistoryEvent(events, index, "answer", highlight.historyEventIndex);
                answerText = answerRev != null ? getAnswerText(step, answerRev) : null;
              } else {
                problemText = refStep && !highlight.focusAnswer && pinRev != null ? getProblemText(step, pinRev) : getProblemText(step);
                answerText = refStep && highlight.focusAnswer && pinRev != null
                  ? getAnswerText(step, pinRev, { live: false })
                  : getAnswerText(step, null, { live: false });
              }
              const empty = !answerText?.trim();
              const showAsAnswered = history
                ? !empty
                : stepFullyResolved(step, { actionPoints }) || (!empty && pinRev != null && highlight.focusAnswer);
              return (
                <div className={`timeline-step${showAsAnswered ? " answered" : ""}`} id={`panel-step-${item.id}-${index}`} key={index}>
                  <div className="problem-row">
                    <div className={`problem${refStep && !highlight.focusAnswer ? bar : ""}`}>
                      <RichText text={problemText} />
                    </div>
                  </div>
                  {empty ? (
                    <div className={`answer-block empty${refStep && highlight.focusAnswer ? bar : ""}`} id={`panel-answer-${item.id}-${index}`} />
                  ) : (
                    <div className={`answer-block${step.answerTentative ? " answer-marked" : ""}${refStep && highlight.focusAnswer ? bar : ""}`} id={`panel-answer-${item.id}-${index}`}>
                      <div className="answer-inner">
                        <span className="answer-text">
                          <RichText text={answerText ?? ""} actionPointRefIds={stepActionPointRefIds(step)} />
                        </span>
                        {step.decidedAt && (
                          <div className="answer-meta">
                            <time className="decision-date" dateTime={step.decidedAt}>{formatDecisionDate(step.decidedAt)}</time>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
