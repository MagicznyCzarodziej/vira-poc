/** Scroll position when zooming about a surface point (mx, my) in client coords. */
export function scrollForZoomAtPoint(
  worldX: number,
  worldY: number,
  mx: number,
  my: number,
  zoom: number,
): { scrollLeft: number; scrollTop: number } {
  return {
    scrollLeft: Math.round(worldX * zoom - mx),
    scrollTop: Math.round(worldY * zoom - my),
  };
}

/**
 * Keep `--canvas-zoom` in sync with world scale so UI can use calc(Npx / var(--canvas-zoom)).
 * Clears transform before re-applying when zoom changes so the browser re-rasterizes vectors
 * instead of scaling a stale compositor layer (blurry until full reload).
 */
export function applyCanvasWorldScale(world: HTMLElement, zoom: number): void {
  const key = "canvasZoom";
  const prev = world.dataset[key];
  const next = String(zoom);
  if (prev !== undefined && prev !== next) {
    world.style.transform = "none";
    void world.offsetWidth;
  }
  world.dataset[key] = next;
  world.style.transform = `scale(${zoom})`;
  world.style.setProperty("--canvas-zoom", next);
}
