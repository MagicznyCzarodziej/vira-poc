import { CARD_WIDTH, DROP_OFFSET_Y } from "../../domain/index.ts";

let host: HTMLDivElement | null = null;

export function listCardGhostTransform(clientX: number, clientY: number): { x: number; y: number } {
  return { x: clientX - CARD_WIDTH / 2, y: clientY - DROP_OFFSET_Y };
}

export function syncListCardDragGhost(card: HTMLElement, clientX: number, clientY: number): void {
  if (!host) {
    host = document.createElement("div");
    host.className = "list-card-pointer-drag-ghost";
    host.setAttribute("aria-hidden", "true");
    const clone = card.cloneNode(true) as HTMLElement;
    clone.classList.remove("is-list-pointer-dragging");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    host.append(clone);
    document.body.append(host);
  }
  const { x, y } = listCardGhostTransform(clientX, clientY);
  host.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export function clearListCardDragGhost(): void {
  host?.remove();
  host = null;
}
