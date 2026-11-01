import { allKnownTags, normalizeTagName, tagStyle } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";

export function ListTagFilter() {
  const items = useDocument((state) => state.items);
  const listFilterTag = useDocument((state) => state.listFilterTag);
  const setListFilterTag = useDocument((state) => state.setListFilterTag);
  const tags = allKnownTags(items);

  if (tags.length === 0) return null;

  const activeTag = listFilterTag;

  return (
    <div className="list-sidebar-tags">
      <div className="list-sidebar-tags-row">
        <span className="list-sidebar-filter-label">Tag</span>
        <div className="list-tag-filter-scroll" role="group" aria-label="Filter decisions by tag">
          <button
            type="button"
            className="list-tag-filter-chip"
            data-action="clear-list-tag-filter"
            aria-pressed={!activeTag}
            onClick={() => setListFilterTag(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="list-tag-filter-chip tag"
              data-action="set-list-tag-filter"
              aria-pressed={normalizeTagName(activeTag) === normalizeTagName(tag)}
              style={tagStyle(tag)}
              onClick={() => setListFilterTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
