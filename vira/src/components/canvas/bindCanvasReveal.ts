import { resolveCardCanvasPlacementKey } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { flyViewportToCard, placedCardBounds, popCanvasPlacedCard, takePendingReveal } from "./flyToCard.ts";

export function bindCanvasReveal(surface: HTMLElement): () => void {
  const onReveal = (event: Event) => {
    const detail = (event as CustomEvent<{ id: string; smooth?: boolean }>).detail;
    const id = detail?.id;
    const doc = useDocument.getState();
    if (!id) return;
    if (doc.frames[id]) {
      const framePlacement = doc.framePlacements[id];
      if (!framePlacement) return;
      const bounds = {
        minX: framePlacement.x,
        minY: framePlacement.y,
        maxX: framePlacement.x + framePlacement.width,
        maxY: framePlacement.y + framePlacement.height,
      };
      const pop = () => {
        const placed = surface.querySelector<HTMLElement>(`[data-canvas-placed="${id}"]`);
        if (!placed) return;
        placed.classList.remove("is-canvas-reveal-pop");
        void placed.getBoundingClientRect();
        placed.classList.add("is-canvas-reveal-pop");
      };
      if (detail.smooth !== false) {
        flyViewportToCard(
          surface,
          bounds,
          () => useDocument.getState().canvasViewport,
          (next) => useDocument.getState().setViewport(next),
          pop,
        );
        return;
      }
      const zoom = useDocument.getState().canvasViewport.zoom;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      useDocument.getState().setViewport({
        zoom,
        scrollLeft: centerX * zoom - surface.clientWidth / 2,
        scrollTop: centerY * zoom - surface.clientHeight / 2,
      });
      pop();
      return;
    }
    const isAction = !!doc.actionPoints[id];
    const placementKey = isAction ? null : resolveCardCanvasPlacementKey(doc.canvasPlacements, doc.items, id);
    const pos = isAction
      ? doc.actionPointPlacements[id]
      : placementKey
        ? doc.canvasPlacements[placementKey]
        : null;
    if (!pos) return;
    const placed = surface.querySelector<HTMLElement>(
      isAction || !placementKey
        ? `[data-canvas-placed="${id}"]`
        : `[data-canvas-placed="${placementKey}"]`,
    );
    const bounds = placedCardBounds(pos, placed);
    const pop = () => popCanvasPlacedCard(placementKey ?? id);
    if (detail.smooth !== false) {
      flyViewportToCard(
        surface,
        bounds,
        () => useDocument.getState().canvasViewport,
        (next) => useDocument.getState().setViewport(next),
        pop,
      );
      return;
    }
    const zoom = useDocument.getState().canvasViewport.zoom;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    useDocument.getState().setViewport({
      zoom,
      scrollLeft: centerX * zoom - surface.clientWidth / 2,
      scrollTop: centerY * zoom - surface.clientHeight / 2,
    });
    pop();
  };
  const onCenter = (event: Event) => {
    const id = (event as CustomEvent<{ id: string }>).detail?.id;
    onReveal(new CustomEvent("vira:reveal-card", { detail: { id, smooth: false } }));
  };
  surface.dataset.canvasLive = "1";
  window.addEventListener("vira:reveal-card", onReveal);
  window.addEventListener("vira:center-card", onCenter);
  const pending = takePendingReveal();
  if (pending) onReveal(new CustomEvent("vira:reveal-card", { detail: { id: pending, smooth: true } }));
  return () => {
    delete surface.dataset.canvasLive;
    window.removeEventListener("vira:reveal-card", onReveal);
    window.removeEventListener("vira:center-card", onCenter);
  };
}
