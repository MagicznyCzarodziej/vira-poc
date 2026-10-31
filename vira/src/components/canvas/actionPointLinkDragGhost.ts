import { actionPointRefPreviewTitle } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";

let host: HTMLDivElement | null = null;

const POINTER_OFFSET_X = 10;
const POINTER_OFFSET_Y = 10;

function ghostSourceCard(source: HTMLElement): HTMLElement {
  if (source.classList.contains("action-point-card")) return source;
  return source.querySelector<HTMLElement>(".action-point-card") ?? source;
}

function actionPointIdFromSource(source: HTMLElement): string | null {
  return (
    source.dataset.canvasDragApId
    ?? source.closest<HTMLElement>("[data-canvas-placed]")?.dataset.canvasPlaced
    ?? source.dataset.actionPointId
    ?? source.closest<HTMLElement>("[data-action-point-id]")?.dataset.actionPointId
    ?? null
  );
}

export function linkDragGhostTransform(clientX: number, clientY: number): { x: number; y: number } {
  return { x: clientX + POINTER_OFFSET_X, y: clientY + POINTER_OFFSET_Y };
}

export function syncActionPointLinkDragGhost(source: HTMLElement, clientX: number, clientY: number): void {
  const id = actionPointIdFromSource(source);
  const card = ghostSourceCard(source);
  const titleEl = card.querySelector(".action-point-title");
  const fromStore = id ? useDocument.getState().actionPoints[id]?.title : undefined;
  const label = actionPointRefPreviewTitle(fromStore ?? titleEl?.textContent ?? "Action");

  if (!host) {
    host = document.createElement("div");
    host.className = "action-point-link-drag-ghost";
    host.setAttribute("aria-hidden", "true");
    const chip = document.createElement("span");
    chip.className = "action-point-link-drag-chip";
    chip.textContent = label;
    host.append(chip);
    document.body.append(host);
  } else {
    const chip = host.querySelector(".action-point-link-drag-chip");
    if (chip) chip.textContent = label;
  }

  const { x, y } = linkDragGhostTransform(clientX, clientY);
  host.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export function clearActionPointLinkDragGhost(): void {
  host?.remove();
  host = null;
}
