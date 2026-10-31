/** List rows that are already on the canvas (drag attempts shake + reveal canvas copy). */
export const LIST_CANVAS_DRAG_BLOCKED_SELECTOR =
  ".workspace-list .list-cards .card.canvas-list-drag-blocked, "
  + ".workspace-list .list-action-points .action-point-card.canvas-list-drag-blocked";

export const LIST_CANVAS_DRAGGABLE_SELECTOR =
  ".workspace-list .list-cards .card[data-canvas-drag-id], "
  + ".workspace-list .list-action-points .action-point-card[data-canvas-drag-ap-id]";

export function listCanvasRowId(row: HTMLElement): string | undefined {
  return row.dataset.id ?? row.dataset.actionPointId;
}
