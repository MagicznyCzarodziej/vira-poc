import { CARD_WIDTH, WORLD_H, WORLD_W, ZOOM_MIN, clampZoom, type Viewport } from "../../domain/index.ts";

const CARD_EST_H = 360;

export type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };

export function placedCardBounds(placement: { x: number; y: number }, el: HTMLElement | null): WorldBounds {
  return {
    minX: placement.x,
    minY: placement.y,
    maxX: placement.x + (el?.offsetWidth || CARD_WIDTH),
    maxY: placement.y + (el?.offsetHeight || CARD_EST_H),
  };
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function flyZoom(a: { x: number; y: number }, b: { x: number; y: number }, surface: HTMLElement, maxZoom: number): number {
  const padX = CARD_WIDTH + 140;
  const padY = 320;
  const spanW = Math.max(1, Math.abs(b.x - a.x) + padX);
  const spanH = Math.max(1, Math.abs(b.y - a.y) + padY);
  const fit = Math.min(surface.clientWidth / spanW, surface.clientHeight / spanH);
  return clampZoom(Math.min(fit * 0.9, maxZoom));
}

let flyToken = 0;

function applyCenter(
  surface: HTMLElement,
  worldX: number,
  worldY: number,
  zoom: number,
  setViewport: (viewport: Viewport) => void,
): void {
  setViewport(paintCenter(surface, worldX, worldY, zoom));
}

let pendingReveal: string | null = null;

export function requestCanvasReveal(id: string): void {
  const live = document.querySelector("[data-canvas-live]");
  if (live) {
    pendingReveal = null;
    window.dispatchEvent(new CustomEvent("vira:reveal-card", { detail: { id, smooth: true } }));
    return;
  }
  pendingReveal = id;
}

export function takePendingReveal(): string | null {
  const id = pendingReveal;
  pendingReveal = null;
  return id;
}

function step(token: number, durationMs: number, onStep: (eased: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      if (token !== flyToken) {
        resolve(false);
        return;
      }
      const p = Math.min(1, (now - t0) / durationMs);
      onStep(ease(p));
      if (p < 1) requestAnimationFrame(frame);
      else resolve(true);
    };
    requestAnimationFrame(frame);
  });
}

function paintCenter(surface: HTMLElement, worldX: number, worldY: number, zoom: number): Viewport {
  const nextZoom = clampZoom(zoom);
  const maxLeft = Math.max(0, Math.ceil(WORLD_W * nextZoom) - surface.clientWidth);
  const maxTop = Math.max(0, Math.ceil(WORLD_H * nextZoom) - surface.clientHeight);
  const next = {
    zoom: nextZoom,
    scrollLeft: Math.min(maxLeft, Math.max(0, worldX * nextZoom - surface.clientWidth / 2)),
    scrollTop: Math.min(maxTop, Math.max(0, worldY * nextZoom - surface.clientHeight / 2)),
  };
  const world = surface.querySelector<HTMLElement>(".canvas-world");
  const content = surface.querySelector<HTMLElement>("[data-canvas-scroll-content]");
  if (world && content) {
    world.style.transform = `scale(${next.zoom})`;
    content.style.width = `${Math.ceil(WORLD_W * next.zoom)}px`;
    content.style.height = `${Math.ceil(WORLD_H * next.zoom)}px`;
  }
  surface.scrollLeft = next.scrollLeft;
  surface.scrollTop = next.scrollTop;
  return next;
}

export function popCanvasPlacedCard(itemId: string): void {
  const placed = document.querySelector<HTMLElement>(`[data-canvas-placed="${itemId}"]`);
  const card = placed?.querySelector(".card");
  if (!placed || !card) return;
  placed.classList.remove("is-canvas-reveal-pop");
  void card.getBoundingClientRect();
  placed.classList.add("is-canvas-reveal-pop");
  const onEnd = (event: Event) => {
    if (event.target !== card) return;
    placed.classList.remove("is-canvas-reveal-pop");
    card.removeEventListener("animationend", onEnd);
  };
  card.addEventListener("animationend", onEnd);
}

export function flyViewportToCard(
  surface: HTMLElement,
  bounds: WorldBounds,
  getViewport: () => Viewport,
  setViewport: (viewport: Viewport) => void,
  onComplete?: () => void,
): void {
  const token = ++flyToken;
  const current = getViewport();
  const desiredZoom = current.zoom;
  const viewCenter = {
    x: (surface.scrollLeft + surface.clientWidth / 2) / desiredZoom,
    y: (surface.scrollTop + surface.clientHeight / 2) / desiredZoom,
  };
  const cardCenter = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  const distance = Math.hypot(cardCenter.x - viewCenter.x, cardCenter.y - viewCenter.y);
  const finish = () => {
    if (token !== flyToken) return;
    applyCenter(surface, cardCenter.x, cardCenter.y, desiredZoom, setViewport);
    onComplete?.();
  };
  if (distance <= 520) {
    void step(token, 480, (t) => {
      applyCenter(
        surface,
        viewCenter.x + (cardCenter.x - viewCenter.x) * t,
        viewCenter.y + (cardCenter.y - viewCenter.y) * t,
        desiredZoom,
        setViewport,
      );
    }).then(finish);
    return;
  }
  let midZoom = clampZoom(Math.min(flyZoom(viewCenter, cardCenter, surface, desiredZoom), desiredZoom * 0.42));
  if (midZoom >= desiredZoom - 0.025) midZoom = clampZoom(Math.max(ZOOM_MIN, desiredZoom * 0.35));
  void step(token, 960, (linear) => {
    const move = ease(linear);
    const zoomArc = Math.sin(linear * Math.PI);
    applyCenter(
      surface,
      viewCenter.x + (cardCenter.x - viewCenter.x) * move,
      viewCenter.y + (cardCenter.y - viewCenter.y) * move,
      desiredZoom + (midZoom - desiredZoom) * zoomArc,
      setViewport,
    );
  }).then(finish);
}
