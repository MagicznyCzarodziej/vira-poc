import { compareItemIdsNewestFirst, itemNeedsDecision, liveItems } from "../domain/index.ts";
import { useDocument } from "../store/index.ts";
import { CardView } from "./CardView.tsx";
import { Composer, NewCardTriggers } from "./Composer.tsx";

export function BoardView() {
  const items = useDocument((state) => state.items);
  const actionPoints = useDocument((state) => state.actionPoints);
  const resolutionContext = { actionPoints };
  const openComposer = useDocument((state) => state.openComposer);
  const cards = liveItems(items).sort(compareItemIdsNewestFirst);
  const columns = [
    { needs: true, title: "Needs decision", className: "needs", key: "needs_decision" },
    { needs: false, title: "Answered", className: "answered", key: "answered" },
  ];
  return (
    <>
      {columns.map((column) => {
        const columnItems = cards.filter((item) => itemNeedsDecision(item, resolutionContext) === column.needs);
        return (
          <section className="column" data-column={column.key} key={column.key}>
            <div className={`column-header ${column.className}`}>
              <span className="title-row"><span className="dot" />{column.title}</span>
            </div>
            <div className="column-body">
              {column.needs && (openComposer ? <Composer /> : <NewCardTriggers />)}
              {columnItems.length > 0 && (
                <div className="list-cards">
                  {columnItems.map((item) => <CardView key={item.id} item={item} surface="list" />)}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
