import { type RefObject } from "react";
import { CARD_WIDTH, DROP_OFFSET_Y, clampZoom } from "../../domain/index.ts";
import type { ComposerIntent } from "../../store/documentTypes.ts";
import { useDocument } from "../../store/index.ts";

export function zoomCanvas(surfaceRef: RefObject<HTMLDivElement | null>, factor: number): void {
  const surface = surfaceRef.current;
  if (!surface) return;
  const rect = surface.getBoundingClientRect();
  const current = useDocument.getState().canvasViewport;
  const mx = rect.width / 2;
  const my = rect.height / 2;
  const worldX = (surface.scrollLeft + mx) / current.zoom;
  const worldY = (surface.scrollTop + my) / current.zoom;
  const zoom = clampZoom(current.zoom * factor);
  useDocument.getState().setViewport({
    zoom,
    scrollLeft: worldX * zoom - mx,
    scrollTop: worldY * zoom - my,
  });
}

export function placeCenteredCard(
  surfaceRef: RefObject<HTMLDivElement | null>,
  spawnAt: { current: number },
  intent: ComposerIntent = "decision",
): void {
  const now = Date.now();
  if (now - spawnAt.current < 50) return;
  spawnAt.current = now;
  const surface = surfaceRef.current;
  if (!surface) return;
  const rect = surface.getBoundingClientRect();
  const id = useDocument.getState().createBlankCard("canvas", intent);
  if (!id) return;
  const zoom = useDocument.getState().canvasViewport.zoom;
  const x = (surface.scrollLeft + rect.width / 2) / zoom - CARD_WIDTH / 2;
  const y = (surface.scrollTop + rect.height / 2) / zoom - DROP_OFFSET_Y;
  useDocument.getState().placeNewCardAtWorld(id, x, y);
}
