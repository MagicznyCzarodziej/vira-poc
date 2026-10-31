import { ACTION_DROP_OFFSET_Y, ACTION_POINT_WIDTH } from "../../domain/index.ts";

let host: HTMLDivElement | null = null;

export function listActionPointGhostTransform(clientX: number, clientY: number): { x: number; y: number } {
  return { x: clientX - ACTION_POINT_WIDTH / 2, y: clientY - ACTION_DROP_OFFSET_Y };
}

export function syncListActionPointDragGhost(source: HTMLElement, clientX: number, clientY: number): void {
  if (!host) {
    host = document.createElement("div");
    host.className = "list-action-point-pointer-drag-ghost";
    host.setAttribute("aria-hidden", "true");
    const clone = source.cloneNode(true) as HTMLElement;
    clone.classList.remove("is-list-pointer-dragging");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    host.append(clone);
    document.body.append(host);
  }
  const { x, y } = listActionPointGhostTransform(clientX, clientY);
  host.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export function clearListActionPointDragGhost(): void {
  host?.remove();
  host = null;
}
