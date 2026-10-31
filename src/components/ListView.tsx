import { compareItemIdsNewestFirst, liveItems } from "../domain/index.ts";
import { useDocument } from "../store/useDocument.ts";
import { CardView } from "./CardView.tsx";
import { CanvasWorkspace } from "./canvas/CanvasWorkspace.tsx";
import { Composer, NewDecisionButton } from "./Composer.tsx";

export function ListView() {
  const items = useDocument((state) => state.items);
  const placements = useDocument((state) => state.canvasPlacements);
  const notOnCanvas = useDocument((state) => state.listFilterNotOnCanvas);
  const openComposer = useDocument((state) => state.openComposer);
  const setListFilter = useDocument((state) => state.setListFilter);
  const cards = liveItems(items)
    .sort(compareItemIdsNewestFirst)
    .filter((item) => !notOnCanvas || !placements[item.id]);

  return (
    <section className="workspace-view">
      <div className="workspace-list">
        <section className="list-view">
          <div className="list-header">
            <span className="list-header-title">Decisions</span>
            <div className="list-filter-toggle" role="group" aria-label="List filter">
              <button type="button" className="list-filter-chip" data-action="set-list-filter" aria-pressed={!notOnCanvas} onClick={() => setListFilter(false)}>All</button>
              <button type="button" className="list-filter-chip" data-action="set-list-filter" aria-pressed={notOnCanvas} onClick={() => setListFilter(true)}>Not on canvas</button>
            </div>
          </div>
          <div className="list-body">
            {openComposer ? <Composer /> : <NewDecisionButton />}
            {cards.length > 0 ? (
              <div className="list-cards">
                {cards.map((item) => <CardView key={item.id} item={item} surface="list" draggableToCanvas />)}
              </div>
            ) : (
              notOnCanvas
                ? <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>Every decision is on the canvas. Switch to <strong>All</strong> or remove one from the canvas to see it here.</p>
                : <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>No decisions yet</p>
            )}
          </div>
        </section>
      </div>
      <div className="workspace-canvas">
        <CanvasWorkspace />
      </div>
    </section>
  );
}
