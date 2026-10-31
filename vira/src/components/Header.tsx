import { useDocument } from "../store/useDocument.ts";

export function Header() {
  const viewMode = useDocument((state) => state.viewMode);
  const showAllDates = useDocument((state) => state.showAllDates);
  const setView = useDocument((state) => state.setView);
  const toggleDates = useDocument((state) => state.toggleDates);
  const addRandom = useDocument((state) => state.addRandom);
  const clearAll = useDocument((state) => state.clearAll);

  return (
    <header>
      <h1>Vira</h1>
      <div className="header-right">
        <nav className="view-tabs" aria-label="View">
          <button type="button" className={`view-tab${viewMode === "board" ? " active" : ""}`} data-view="board" onClick={() => setView("board")}>Board</button>
          <button type="button" className={`view-tab${viewMode === "list" ? " active" : ""}`} data-view="list" onClick={() => setView("list")}>List</button>
        </nav>
        <button type="button" className={`view-tab dates-toggle${showAllDates ? " active" : ""}`} data-action="toggle-dates" aria-pressed={showAllDates} onClick={toggleDates}>Dates</button>
        <div className="header-proto-actions" aria-label="PoC data">
          <button type="button" className="header-proto-btn" data-action="add-random-cards" onClick={addRandom}>Random cards</button>
          <button
            type="button"
            className="header-proto-btn header-proto-btn--danger"
            data-action="remove-all-cards"
            onClick={() => {
              if (!Object.keys(useDocument.getState().items).length) return;
              if (window.confirm("Remove all decisions and canvas placements?")) clearAll();
            }}
          >
            Clear all
          </button>
        </div>
        <span className="badge-proto">PoC · saved locally</span>
      </div>
    </header>
  );
}
