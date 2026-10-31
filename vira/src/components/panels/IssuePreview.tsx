import { createPortal } from "react-dom";
import {
  cardNumber,
  getAnswerText,
  getProblemText,
  isIssueRefStale,
  isItemArchived,
  parseIssueRef,
  stepFieldHeadRev,
  truncateLabel,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { useIssueTip } from "./useIssueTip.ts";

export function IssuePreview() {
  const items = useDocument((state) => state.items);
  const { tip, tipRef, onEnter, onLeave } = useIssueTip(items);

  if (!tip) return null;
  const parsed = parseIssueRef(tip.refId);
  const item = parsed ? items[parsed.itemId] : undefined;
  const stale = parsed ? isIssueRefStale(items, parsed) : false;
  const status = item && isItemArchived(item) ? "Archived" : stale ? "Stale link" : "Preview";
  const className = `issue-ref-preview${parsed?.focusAnswer ? " issue-ref-preview-answer-ref" : ""}${stale ? " issue-ref-preview-is-stale" : ""}`;

  let body = <p className="issue-ref-preview-missing">Decision not found</p>;
  if (parsed && item && parsed.focusAnswer && parsed.stepIndex != null) {
    const step = item.steps[parsed.stepIndex];
    body = !step
      ? (
        <>
          <PreviewHead num={cardNumber(item.id)} status={status} />
          <p className="issue-ref-preview-missing">Step not found</p>
        </>
      )
      : (
        <>
          <PreviewHead num={cardNumber(item.id)} status={status} />
          <AnswerSlot step={step} revision={parsed.revision ?? stepFieldHeadRev(step, "answer")} />
          {stale && <p className="issue-ref-preview-stale">Older revision — click to open the panel.</p>}
        </>
      );
  } else if (parsed && item && parsed.stepIndex != null) {
    const step = item.steps[parsed.stepIndex];
    body = !step
      ? (
        <>
          <PreviewHead num={cardNumber(item.id)} status={status} />
          <p className="issue-ref-preview-missing">Step not found</p>
        </>
      )
      : (
        <>
          <PreviewHead num={cardNumber(item.id)} status={status} />
          <QuestionSlot
            question={truncateLabel(getProblemText(step, parsed.revision ?? stepFieldHeadRev(step, "problem")), 160)}
            answer={getAnswerText(step)}
            tentative={!!step.answerTentative}
          />
          {stale && <p className="issue-ref-preview-stale">Older revision — click to open the panel.</p>}
        </>
      );
  } else if (parsed && item) {
    body = (
      <>
        <PreviewHead num={cardNumber(item.id)} status={status} />
        {item.steps.map((step, index) => (
          <QuestionSlot
            key={index}
            question={truncateLabel(getProblemText(step), 160)}
            answer={getAnswerText(step)}
            tentative={!!step.answerTentative}
          />
        ))}
        {stale && <p className="issue-ref-preview-stale">Older revision — click to open the panel.</p>}
      </>
    );
  }

  return createPortal(
    <div ref={tipRef} className={className} role="tooltip" data-ref-id={tip.refId} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {body}
    </div>,
    document.body,
  );
}

function PreviewHead({ num, status }: { num: string; status: string }) {
  return (
    <div className="issue-ref-preview-head">
      <span className="issue-ref-preview-id">!{num}</span>
      <span className="issue-ref-preview-status">{status}</span>
    </div>
  );
}

function QuestionSlot({ question, answer, tentative }: { question: string; answer: string | null; tentative: boolean }) {
  return (
    <div className="issue-ref-preview-step">
      <div className="issue-ref-preview-q">{question}</div>
      {answer ? (
        <div className="issue-ref-preview-a">
          {truncateLabel(answer, 140)}
          {tentative ? <> <span aria-hidden="true">⚑</span></> : null}
        </div>
      ) : (
        <div className="issue-ref-preview-a issue-ref-preview-pending">No decision yet</div>
      )}
    </div>
  );
}

function AnswerSlot({ step, revision }: { step: Parameters<typeof getProblemText>[0]; revision: number }) {
  const question = getProblemText(step).trim();
  const answer = getAnswerText(step, revision);
  return (
    <div className="issue-ref-preview-answer-slot">
      {question ? <div className="issue-ref-preview-q">{truncateLabel(question, 160)}</div> : null}
      {answer ? (
        <div className="issue-ref-preview-a issue-ref-preview-answer-main">{truncateLabel(answer, 220)}</div>
      ) : (
        <div className="issue-ref-preview-a issue-ref-preview-pending issue-ref-preview-answer-main">No decision yet</div>
      )}
    </div>
  );
}
