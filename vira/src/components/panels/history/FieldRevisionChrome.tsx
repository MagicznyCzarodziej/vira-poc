import {
  diffWordsOps,
  formatDecisionDate,
  formatIssueRefToken,
  revisionFieldText,
  stepFieldRevisions,
  type FieldName,
  type IssueRef,
  type StaleReason,
  type Step,
} from "../../../domain/index.ts";

function staleNotice(reason: StaleReason | null): string {
  if (reason === "missing") return "This decision is no longer in the workspace.";
  if (reason === "card-archived") return "This card is archived. Latest revision below is the archived snapshot — history is read-only.";
  if (reason === "step-archived") return "This question is archived. Latest revision below is the archived snapshot.";
  if (reason === "answer-archived") return "This answer is archived. Latest revision below is the archived snapshot.";
  if (reason === "revision") return "This link pins an older revision — bar on the referenced field is yellow for that snapshot, gray at latest; use “Diff linked → current” below.";
  return "";
}

function shiftRev(visible: { rev: number }[], active: number, delta: number, setViewRev: (rev: number) => void) {
  const nums = visible.map((entry) => entry.rev);
  const index = nums.indexOf(active);
  if (index === -1) return;
  const next = nums[index + delta];
  if (next != null) setViewRev(next);
}

export function TimelineChrome({ at }: { at: string }) {
  return (
    <>
      {at
        ? <time className="revision-timeline-date" dateTime={at}>{formatDecisionDate(at)}</time>
        : <span className="revision-timeline-date" aria-hidden="true" />}
      <span className="revision-timeline-node">
        <span className="revision-timeline-stem-top" aria-hidden="true" />
        <span className="revision-timeline-marker" aria-hidden="true" />
        <span className="revision-timeline-stem-bottom" aria-hidden="true" />
      </span>
    </>
  );
}

function WordDiff({ oldText, newText }: { oldText: string; newText: string }) {
  if (oldText === newText) return <span className="diff-same">{newText || "(empty)"}</span>;
  return diffWordsOps(oldText, newText).map((op, index) => {
    if (op.type === "delete") return <del className="diff-del" key={index}>{op.text}</del>;
    if (op.type === "insert") return <ins className="diff-ins" key={index}>{op.text}</ins>;
    return <span key={index}>{op.text}</span>;
  });
}

export function FieldRevisionChrome({
  parsed,
  step,
  field,
  head,
  active,
  reason,
  visible,
  hiddenOlder,
  showOlder,
  diffOpen,
  onToggleDiff,
  onToggleOlder,
  onSelect,
}: {
  parsed: IssueRef;
  step: Step;
  field: FieldName;
  head: number;
  active: number;
  reason: StaleReason | null;
  visible: ReturnType<typeof stepFieldRevisions>;
  hiddenOlder: number;
  showOlder: boolean;
  diffOpen: boolean;
  onToggleDiff: () => void;
  onToggleOlder: () => void;
  onSelect: (rev: number) => void;
}) {
  const notice = staleNotice(reason);
  const all = stepFieldRevisions(step, field);
  const headArchived = !!all.find((entry) => entry.rev === head)?.archived;
  const activeArchived = !!all.find((entry) => entry.rev === active)?.archived;
  const nums = visible.map((entry) => entry.rev);
  const index = nums.indexOf(active);
  const showDiff = parsed.revision != null && parsed.revision !== head;
  const onPrev = () => shiftRev(visible, active, -1, onSelect);
  const onNext = () => shiftRev(visible, active, 1, onSelect);
  return (
    <div className="issue-ref-panel-ref-meta">
      {all.length > 1 ? (
        <div className="issue-ref-panel-rev-stepper">
          <button type="button" className="issue-ref-panel-rev-btn" data-action="panel-rev-prev" aria-label="Previous revision" disabled={index <= 0} onClick={onPrev}>←</button>
          <span className="issue-ref-panel-rev-label">
            {active === head
              ? `Latest · v${active}${headArchived ? " · archived" : ""}`
              : `Viewing v${active} · latest v${head}${headArchived ? " (archived)" : ""}`}
          </span>
          <button type="button" className="issue-ref-panel-rev-btn" data-action="panel-rev-next" aria-label="Next revision" disabled={index === -1 || index >= nums.length - 1} onClick={onNext}>→</button>
        </div>
      ) : (
        <div className="issue-ref-panel-view-rev">Revision v{active}{activeArchived ? " · archived" : ""}</div>
      )}
      {notice && <p className="issue-ref-panel-stale">{notice}</p>}
      {reason === "revision" && (
        <button type="button" className="issue-ref-preview-upgrade" data-action="upgrade-issue-ref" data-issue-ref={formatIssueRefToken(parsed)}>
          Update link to current
        </button>
      )}
      {showDiff && (
        <div className="issue-ref-panel-diff-controls">
          <button type="button" className="issue-ref-panel-diff-toggle" data-action="toggle-panel-diff" aria-pressed={diffOpen} onClick={onToggleDiff}>
            {diffOpen ? "Hide diff" : "Diff linked → current"}
          </button>
        </div>
      )}
      {showDiff && diffOpen && (
        <div className="issue-ref-panel-diff-body">
          <p className="issue-ref-panel-diff-caption">Linked v{parsed.revision} → current v{head}</p>
          <WordDiff oldText={revisionFieldText(step, field, parsed.revision)} newText={revisionFieldText(step, field, head)} />
        </div>
      )}
      {all.length >= 1 && <p className="issue-ref-panel-revisions-title">Revisions</p>}
      {hiddenOlder > 0 && (
        <button type="button" className="issue-ref-panel-revisions-toggle" data-action="toggle-panel-older-revisions" aria-pressed={showOlder} onClick={onToggleOlder}>
          {showOlder ? "Hide earlier revisions" : `Show ${hiddenOlder} earlier revision${hiddenOlder === 1 ? "" : "s"}`}
        </button>
      )}
      <div className="issue-ref-panel-revisions issue-ref-preview-revisions">
        <div className="revision-timeline">
          {visible.map((entry) => (
            <button
              type="button"
              key={entry.rev}
              className={`revision-timeline-item${entry.rev === active ? " is-active" : ""}${entry.rev === parsed.revision ? " is-linked-rev" : ""}`}
              data-action="panel-rev-select"
              data-rev={entry.rev}
              data-field={field}
              onClick={() => onSelect(entry.rev)}
            >
              <TimelineChrome at={entry.at} />
              <span className="revision-timeline-content">
                <div className="issue-ref-preview-revision-meta">
                  v{entry.rev}
                  {entry.rev === parsed.revision ? <span className="rev-linked-badge">linked</span> : null}
                  {entry.tentative ? " · tentative" : ""}
                  {entry.archived ? " · archived" : ""}
                  {entry.rev === head ? " · current" : ""}
                </div>
                {entry.archived ? "(removed)" : entry.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
