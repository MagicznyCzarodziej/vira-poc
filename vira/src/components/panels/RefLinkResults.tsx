import { tagStyle, truncateLabel } from "../../domain/index.ts";
import type { RefLinkGroup } from "../../domain/index.ts";

type RefLinkResultsProps = {
  rows: RefLinkGroup[] | null;
  onPick: (token: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onFilterId: (num: string) => void;
};

export function RefLinkResults({
  rows,
  onPick,
  selectedTags,
  onToggleTag,
  onFilterId,
}: RefLinkResultsProps) {
  return (
    <div className="issue-ref-panel-body ref-link-picker-body" id="ref-link-picker-results">
      {rows == null ? null : rows.length
        ? rows.map((group) => (
          <div className="ref-link-picker-group" key={group.id}>
            <div className="ref-link-picker-group-head">
              <button
                type="button"
                className="ref-link-picker-card-id"
                data-action="ref-picker-filter-id"
                data-ref-query={`!${group.num}`}
                onClick={() => onFilterId(group.num)}
              >
                !{group.num}
              </button>
              {group.editing ? <span className="ref-link-picker-editing-badge">This card</span> : null}
              {group.tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className="tag ref-link-picker-tag-btn"
                  style={tagStyle(tag)}
                  data-action="ref-picker-toggle-tag"
                  data-tag={tag}
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => onToggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {group.rows.map((row) => (
              <button
                type="button"
                key={row.token}
                className="ref-link-picker-row"
                data-action="pick-ref-target"
                data-ref-token={row.token}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onPick(row.token);
                }}
              >
                <div className="ref-link-picker-row-meta">
                  <span className="ref-link-picker-id">{row.idLabel}</span>
                  <span className="ref-link-picker-kind">{row.kind === "card" ? "Whole card" : row.kind === "question" ? "Question" : "Answer"}</span>
                </div>
                <div className="ref-link-picker-preview">
                  {row.question.trim() ? <div className="ref-link-picker-preview-q">{truncateLabel(row.question, 200)}</div> : null}
                  {row.kind === "question" ? null : row.answer?.trim()
                    ? <div className="ref-link-picker-preview-a">{truncateLabel(row.answer, 220)}</div>
                    : <div className="ref-link-picker-preview-a is-empty">No answer yet</div>}
                </div>
              </button>
            ))}
          </div>
        ))
        : <p className="ref-link-picker-empty">No matches — try another tag, kind filter, or search.</p>}
    </div>
  );
}
