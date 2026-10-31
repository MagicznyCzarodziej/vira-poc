import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { canvasSpawnPreviewCard, CARD_WIDTH } from "../../domain/index.ts";
import { CardView } from "../CardView.tsx";

let ghostEl: HTMLDivElement | null = null;
let ghostRoot: Root | null = null;

function prepareCanvasSpawnDragGhost(): HTMLDivElement {
  if (!ghostEl) {
    ghostEl = document.createElement("div");
    ghostEl.className = "canvas-spawn-drag-ghost";
    ghostEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghostEl);
    ghostRoot = createRoot(ghostEl);
  }
  flushSync(() => {
    ghostRoot!.render(
      createElement(CardView, { item: canvasSpawnPreviewCard(), surface: "panel" }),
    );
  });
  return ghostEl;
}

export function setCanvasSpawnDragImage(event: DragEvent): void {
  const ghost = prepareCanvasSpawnDragGhost();
  const card = ghost.querySelector(".card");
  const w = card?.getBoundingClientRect().width || CARD_WIDTH;
  const h = card?.getBoundingClientRect().height || 96;
  event.dataTransfer?.setDragImage(ghost, Math.round(w / 2), Math.round(Math.min(h * 0.38, 52)));
}
