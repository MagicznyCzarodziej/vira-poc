import { compareItemIdsNewestFirst, itemHasCanvasPlacement, liveActionPointIds, liveItems } from "../domain/index.ts";
import { useDocument } from "../store/index.ts";
import { ActionPointView } from "./action/ActionPointView.tsx";
import { CardView } from "./CardView.tsx";
import { CanvasWorkspace } from "./canvas/CanvasWorkspace.tsx";
import { Composer, NewCardTriggers } from "./Composer.tsx";

export function ListView() {
  const items = useDocument((state) => state.items);
  const actionPoints = useDocument((state) => state.actionPoints);
  const placements = useDocument((state) => state.canvasPlacements);
  const apPlacements = useDocument((state) => state.actionPointPlacements);
  const notOnCanvas = useDocument((state) => state.listFilterNotOnCanvas);
  const openComposer = useDocument((state) => state.openComposer);
  const setListFilter = useDocument((state) => state.setListFilter);
  const cards = liveItems(items)
    .sort(compareItemIdsNewestFirst)
    .filter((item) => !notOnCanvas || !itemHasCanvasPlacement(placements, items, item.id));
  const actions = liveActionPointIds(actionPoints).filter((id) => !notOnCanvas || !apPlacements[id]);

  return (
    <section className="workspace-view">
      <div className="workspace-list">
        <section className="list-view list-view--actions">
          <div className="list-header">
            <span className="list-header-title">Actions</span>
          </div>
          <div className="list-body">
            <button
              type="button"
              className="add-trigger"
              data-action="add-action-point"
              onClick={() => useDocument.getState().createStandaloneActionPoint()}
            >
              New action
            </button>
            {actions.length > 0 ? (
              <div className="list-action-points">
                {actions.map((id) => (
                  <ActionPointView key={id} actionPoint={actionPoints[id]!} surface="list" draggableToCanvas />
                ))}
              </div>
            ) : (
              <p className="list-empty-hint">No actions yet — create one or add from a decision.</p>
            )}
          </div>
        </section>
        <section className="list-view">
          <div className="list-header">
            <span className="list-header-title">Decisions</span>
            <div className="list-filter-toggle" role="group" aria-label="List filter">
              <button type="button" className="list-filter-chip" data-action="set-list-filter" aria-pressed={!notOnCanvas} onClick={() => setListFilter(false)}>All</button>
              <button type="button" className="list-filter-chip" data-action="set-list-filter" aria-pressed={notOnCanvas} onClick={() => setListFilter(true)}>Not on canvas</button>
            </div>
          </div>
          <div className="list-body">
            {openComposer ? <Composer /> : <NewCardTriggers />}
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
