import { type RefObject } from "react";
import { useDocument } from "../../store/useDocument.ts";

export function bindCanvasRefLinks(
  root: HTMLElement,
  surfaceRef: RefObject<HTMLDivElement | null>,
  lineRef: RefObject<SVGSVGElement | null>,
): () => void {
  const onOver = (event: MouseEvent) => {
    const target = event.target as Element;
    const ref = target.closest<HTMLElement>("[data-action='goto-issue'][data-issue-ref]");
    const svg = lineRef.current;
    if (ref && svg) {
      const from = target.closest<HTMLElement>("[data-id], [data-canvas-placed]");
      const fromId = from?.dataset.canvasPlaced || from?.dataset.id;
      const parsed = ref.dataset.issueRef?.match(/item-(\d+)/i);
      const targetId = parsed ? `item-${parsed[1]}` : null;
      const state = useDocument.getState();
      if (fromId && targetId && state.canvasPlacements[fromId] && state.canvasPlacements[targetId] && fromId !== targetId) {
        const a = surfaceRef.current?.querySelector(`[data-canvas-placed="${fromId}"]`)?.getBoundingClientRect();
        const b = surfaceRef.current?.querySelector(`[data-canvas-placed="${targetId}"]`)?.getBoundingClientRect();
        const view = surfaceRef.current?.getBoundingClientRect();
        if (a && b && view) {
          svg.setAttribute("width", String(view.width));
          svg.setAttribute("height", String(view.height));
          svg.replaceChildren();
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(a.left + a.width / 2 - view.left));
          line.setAttribute("y1", String(a.top + a.height / 2 - view.top));
          line.setAttribute("x2", String(b.left + b.width / 2 - view.left));
          line.setAttribute("y2", String(b.top + b.height / 2 - view.top));
          svg.append(line);
        }
      }
      return;
    }
    svg?.replaceChildren();
    root.querySelectorAll(".is-workspace-link-hover").forEach((el) => el.classList.remove("is-workspace-link-hover"));
    const listCard = target.closest<HTMLElement>(".workspace-list .card[data-id]");
    const canvasCard = target.closest<HTMLElement>(".canvas-placed-card[data-canvas-placed]");
    const id = listCard?.dataset.id || canvasCard?.dataset.canvasPlaced;
    if (!id || !useDocument.getState().canvasPlacements[id]) return;
    const peer = listCard
      ? root.querySelector(`.canvas-placed-card[data-canvas-placed="${id}"]`)
      : root.querySelector(`.workspace-list .card[data-id="${id}"]`);
    peer?.classList.add("is-workspace-link-hover");
  };
  root.addEventListener("mouseover", onOver);
  return () => root.removeEventListener("mouseover", onOver);
}
