import {
  accordionCollapseKey,
  compareItemIdsNewestFirst,
  isAccordionCollapsed,
  itemHasCanvasPlacement,
  itemMatchesListTagFilter,
  liveActionPointIds,
  liveItems,
} from "../domain/index.ts";
import { useDocument } from "../store/index.ts";
import { ActionPointView } from "./action/ActionPointView.tsx";
import { CardView } from "./CardView.tsx";
import { CanvasWorkspace } from "./canvas/CanvasWorkspace.tsx";
import { Composer, NewCardTriggers } from "./Composer.tsx";
import { IconPanelLeftClose, IconPanelLeftOpen } from "./Icons.tsx";
import { LIST_SIDEBAR_SHORTCUT_LABEL } from "./list/bindListSidebarShortcut.ts";
import { ListFilterToggle } from "./list/ListFilterToggle.tsx";
import { ListTagFilter } from "./list/ListTagFilter.tsx";
import { ListSectionHeader } from "./list/ListSectionHeader.tsx";
import { listSidebarSectionFlexStyle } from "./list/listSidebarLayout.ts";

export function ListView() {
  const items = useDocument((state) => state.items);
  const actionPoints = useDocument((state) => state.actionPoints);
  const placements = useDocument((state) => state.canvasPlacements);
  const apPlacements = useDocument((state) => state.actionPointPlacements);
  const notOnCanvas = useDocument((state) => state.listFilterNotOnCanvas);
  const listFilterTag = useDocument((state) => state.listFilterTag);
  const openComposer = useDocument((state) => state.openComposer);
  const sidebarHidden = useDocument((state) => state.sidebarHidden);
  const setSidebarHidden = useDocument((state) => state.setSidebarHidden);
  const collapsedKeys = useDocument((state) => state.accordionCollapsed);
  const toggleAccordionCollapsed = useDocument((state) => state.toggleAccordionCollapsed);
  const actionsKey = accordionCollapseKey({ kind: "listSection", section: "actions" });
  const decisionsKey = accordionCollapseKey({ kind: "listSection", section: "decisions" });
  const actionsExpanded = !isAccordionCollapsed(collapsedKeys, actionsKey);
  const decisionsExpanded = !isAccordionCollapsed(collapsedKeys, decisionsKey);
  const cards = liveItems(items)
    .sort(compareItemIdsNewestFirst)
    .filter((item) => itemMatchesListTagFilter(item, listFilterTag))
    .filter((item) => !notOnCanvas || !itemHasCanvasPlacement(placements, items, item.id));
  const actions = liveActionPointIds(actionPoints).filter((id) => !notOnCanvas || !apPlacements[id]);

  return (
    <section className={`workspace-view${sidebarHidden ? " is-sidebar-hidden" : ""}`}>
      <div className="workspace-list" hidden={sidebarHidden}>
        <div className="list-sidebar-panel">
          <ListFilterToggle />
          <ListTagFilter />
          <section
            className={`list-view list-view--actions${actionsExpanded ? " is-section-expanded-shell" : " is-section-collapsed-shell"}`}
            style={listSidebarSectionFlexStyle(actionsExpanded, decisionsExpanded, "actions")}
          >
          <ListSectionHeader
            sectionId="actions"
            title="Actions"
            expanded={actionsExpanded}
            onToggle={() => toggleAccordionCollapsed(actionsKey)}
          />
          {actionsExpanded ? (
            <div className="list-body" id="list-section-actions-body">
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
          ) : null}
          </section>
          <section
            className={`list-view list-view--decisions${decisionsExpanded ? " is-section-expanded-shell" : " is-section-collapsed-shell"}`}
            style={listSidebarSectionFlexStyle(actionsExpanded, decisionsExpanded, "decisions")}
          >
          <ListSectionHeader
            sectionId="decisions"
            title="Decisions"
            expanded={decisionsExpanded}
            onToggle={() => toggleAccordionCollapsed(decisionsKey)}
          />
          {decisionsExpanded ? (
            <div className="list-body" id="list-section-decisions-body">
              {openComposer ? <Composer /> : <NewCardTriggers />}
              {cards.length > 0 ? (
                <div className="list-cards">
                  {cards.map((item) => <CardView key={item.id} item={item} surface="list" draggableToCanvas />)}
                </div>
              ) : (
                listFilterTag
                  ? <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>No decisions with tag <strong>{listFilterTag}</strong>{notOnCanvas ? " off the canvas" : ""}.</p>
                  : notOnCanvas
                    ? <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>Every decision is on the canvas. Switch to <strong>All</strong> or remove one from the canvas to see it here.</p>
                    : <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>No decisions yet</p>
              )}
            </div>
          ) : null}
          </section>
        </div>
      </div>
      <div className="workspace-canvas">
        <CanvasWorkspace />
      </div>
      <button
        type="button"
        className={`sidebar-edge-toggle${sidebarHidden ? " is-sidebar-hidden" : " is-sidebar-visible"}`}
        data-action={sidebarHidden ? "show-sidebar" : "hide-sidebar"}
        aria-label={
          sidebarHidden
            ? `Show actions and decisions list (${LIST_SIDEBAR_SHORTCUT_LABEL})`
            : `Hide sidebar (${LIST_SIDEBAR_SHORTCUT_LABEL})`
        }
        title={
          sidebarHidden
            ? `Show sidebar (${LIST_SIDEBAR_SHORTCUT_LABEL})`
            : `Hide sidebar (${LIST_SIDEBAR_SHORTCUT_LABEL})`
        }
        onClick={() => setSidebarHidden(!sidebarHidden)}
      >
        {sidebarHidden ? <IconPanelLeftOpen /> : <IconPanelLeftClose />}
      </button>
    </section>
  );
}
