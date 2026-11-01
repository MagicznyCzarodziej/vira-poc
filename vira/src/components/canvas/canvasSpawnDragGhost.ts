import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  canvasSpawnPreviewCard,
  CARD_WIDTH,
  FRAME_DEFAULT_HEIGHT,
  FRAME_DEFAULT_WIDTH,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
} from "../../domain/index.ts";
import { CardView } from "../CardView.tsx";
import { FrameView } from "../frame/FrameView.tsx";
import { NoteView } from "../note/NoteView.tsx";
import type { Frame, Note } from "../../domain/types.ts";

let ghostEl: HTMLDivElement | null = null;
let ghostRoot: Root | null = null;

const previewFrame: Frame = {
  id: "frame-preview",
  title: "Frame",
  createdAt: "1970-01-01T00:00:00.000Z",
};

const previewNote: Note = {
  id: "note-preview",
  body: "",
  color: "white",
  createdAt: "1970-01-01T00:00:00.000Z",
};

function prepareCanvasSpawnDragGhost(kind: "card" | "frame" | "note"): HTMLDivElement {
  if (!ghostEl) {
    ghostEl = document.createElement("div");
    ghostEl.className = "canvas-spawn-drag-ghost";
    ghostEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghostEl);
    ghostRoot = createRoot(ghostEl);
  }
  flushSync(() => {
    ghostRoot!.render(
      kind === "frame"
        ? createElement(FrameView, {
            frame: previewFrame,
            width: FRAME_DEFAULT_WIDTH,
            height: FRAME_DEFAULT_HEIGHT,
            surface: "canvas",
          })
        : kind === "note"
          ? createElement(NoteView, {
              note: previewNote,
              width: NOTE_DEFAULT_WIDTH,
              height: NOTE_DEFAULT_HEIGHT,
              surface: "canvas",
            })
          : createElement(CardView, { item: canvasSpawnPreviewCard(), surface: "panel" }),
    );
  });
  return ghostEl;
}

export function setCanvasSpawnDragImage(event: DragEvent, kind: "card" | "frame" | "note" = "card"): void {
  const ghost = prepareCanvasSpawnDragGhost(kind);
  if (kind === "note") {
    const note = ghost.querySelector(".canvas-sticky-note");
    const w = note?.getBoundingClientRect().width || NOTE_DEFAULT_WIDTH;
    const h = note?.getBoundingClientRect().height || NOTE_DEFAULT_HEIGHT;
    event.dataTransfer?.setDragImage(ghost, Math.round(w / 2), Math.round(h / 2));
    return;
  }
  if (kind === "frame") {
    const frame = ghost.querySelector(".canvas-frame-inner");
    const w = frame?.getBoundingClientRect().width || FRAME_DEFAULT_WIDTH;
    const h = frame?.getBoundingClientRect().height || FRAME_DEFAULT_HEIGHT;
    event.dataTransfer?.setDragImage(ghost, Math.round(w / 2), Math.round(h / 2));
    return;
  }
  const card = ghost.querySelector(".card");
  const w = card?.getBoundingClientRect().width || CARD_WIDTH;
  const h = card?.getBoundingClientRect().height || 96;
  event.dataTransfer?.setDragImage(ghost, Math.round(w / 2), Math.round(Math.min(h * 0.38, 52)));
}
