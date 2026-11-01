import { useDocument } from "../../store/index.ts";

export function ListFilterToggle() {
  const notOnCanvas = useDocument((state) => state.listFilterNotOnCanvas);
  const setListFilter = useDocument((state) => state.setListFilter);

  return (
    <div className="list-sidebar-filter">
      <span className="list-sidebar-filter-label">Show</span>
      <div className="list-filter-toggle" role="group" aria-label="List filter for actions and decisions">
        <button
          type="button"
          className="list-filter-chip"
          data-action="set-list-filter"
          aria-pressed={!notOnCanvas}
          onClick={() => setListFilter(false)}
        >
          All
        </button>
        <button
          type="button"
          className="list-filter-chip"
          data-action="set-list-filter"
          aria-pressed={notOnCanvas}
          onClick={() => setListFilter(true)}
        >
          Not on canvas
        </button>
      </div>
    </div>
  );
}
