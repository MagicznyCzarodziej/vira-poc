import { useEffect, useRef, useState } from "react";
import { liveItems, tagStyle } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { usePanels } from "../../store/usePanels.ts";
import { capturePickerSession, insertRefToken } from "./insertRefLink.ts";
import { RefLinkResults } from "./RefLinkResults.tsx";
import { refLinkRows, type RefLinkKind } from "./refLinkRows.ts";

export function RefLinkPicker() {
  const picker = usePanels((state) => state.picker);
  const closePicker = usePanels((state) => state.closePicker);
  const items = useDocument((state) => state.items);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [kind, setKind] = useState<RefLinkKind>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail) return;
      const next = capturePickerSession(detail);
      if (!next) return;
      setQuery("");
      setTags([]);
      setKind("all");
      usePanels.getState().openPicker(next);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !usePanels.getState().picker) return;
      event.preventDefault();
      usePanels.getState().closePicker();
    };
    window.addEventListener("vira:open-ref-picker", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("vira:open-ref-picker", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!picker) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [picker]);

  const counts = new Map<string, number>();
  for (const item of liveItems(items)) {
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tagEntries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const q = query.trim();
  const hasFilters = tags.length > 0 || kind !== "all" || q.length > 0;
  const groups = picker ? refLinkRows(items, query, kind, tags, picker.itemId) : [];
  const rowCount = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const filterBits: string[] = [];
  if (tags.length) filterBits.push(tags.join(" + "));
  if (kind !== "all") filterBits.push(kind);
  if (q) filterBits.push(`“${q}”`);
  const filterNote = filterBits.length ? ` · ${filterBits.join(" · ")}` : "";
  const summary = rowCount
    ? `${rowCount} target${rowCount === 1 ? "" : "s"}${filterNote}`
    : `No matches${filterNote} — loosen filters or search.`;

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  return (
    <aside className="issue-ref-panel ref-link-picker-panel" hidden={picker == null} role="complementary" aria-labelledby="ref-link-picker-title">
      <div className="issue-ref-panel-toolbar">
        <div className="ref-link-picker-heading">
          <span className="issue-ref-panel-title" id="ref-link-picker-title">Link to decision</span>
          <p className="ref-link-picker-selection" id="ref-link-picker-selection">{picker ? `Selected: “${picker.label}”` : ""}</p>
        </div>
        <button type="button" className="issue-ref-panel-close" data-action="close-ref-link-picker" aria-label="Close" onClick={closePicker}>×</button>
      </div>
      <div className="ref-link-picker-search-wrap">
        <input
          ref={searchRef}
          type="search"
          className="ref-link-picker-search"
          id="ref-link-picker-search"
          placeholder="Search words, !id, !id/a1 (answer), tags…"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            closePicker();
          }}
        />
      </div>
      <div className="ref-link-picker-filters">
        <span className="ref-link-picker-filter-label">Filter by tag</span>
        <div className="ref-link-picker-tag-strip" id="ref-link-picker-tag-strip">
          {tagEntries.length
            ? tagEntries.map(([tag, count]) => (
              <button
                type="button"
                key={tag}
                className="tag ref-link-picker-tag-btn"
                style={tagStyle(tag)}
                data-action="ref-picker-toggle-tag"
                data-tag={tag}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag} ({count})
              </button>
            ))
            : <span className="ref-link-picker-empty" style={{ margin: 0, textAlign: "left", fontSize: "0.75rem" }}>No tags yet</span>}
        </div>
        <div className="ref-link-picker-kind-strip">
          {([
            ["all", "All"],
            ["answer", "Answers"],
            ["question", "Questions"],
            ["card", "Whole cards"],
          ] as const).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className="ref-link-picker-chip-btn"
              data-action="ref-picker-kind"
              data-kind={value}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ref-link-picker-filter-actions">
          <span className="ref-link-picker-filter-label" style={{ margin: 0 }}>Click tags in results too</span>
          <button
            type="button"
            className="ref-link-picker-clear-filters"
            data-action="ref-picker-clear-filters"
            hidden={!hasFilters}
            onClick={() => {
              setTags([]);
              setKind("all");
              setQuery("");
              searchRef.current?.focus();
            }}
          >
            Clear filters
          </button>
        </div>
      </div>
      <div className="ref-link-picker-results-meta" id="ref-link-picker-results-meta">{picker ? summary : ""}</div>
      <RefLinkResults
        rows={picker ? groups : null}
        onPick={insertRefToken}
        selectedTags={tags}
        onToggleTag={toggleTag}
        onFilterId={(num) => {
          setQuery(`!${num}`);
          searchRef.current?.focus();
        }}
      />
    </aside>
  );
}
