import {
  isListCardDragButton,
  isListCardDragField,
  isListCardEditSurface,
  noteListCardDragEnded,
} from "./listCardDrag.ts";

/** HTML5 drag from list card chrome (buttons use pointer drag in listCardPointerDrag). */
export function bindListCardHtmlDrag(root: HTMLElement): () => void {
  const onDragStart = (event: DragEvent) => {
    const card = (event.target as Element).closest<HTMLElement>("[data-canvas-drag-id]");
    const id = card?.dataset.canvasDragId;
    if (!card || !id || !event.dataTransfer) return;
    if (isListCardDragField(event.target) || isListCardEditSurface(event.target)) {
      event.preventDefault();
      return;
    }
    if (isListCardDragButton(event.target, card)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => noteListCardDragEnded();

  root.addEventListener("dragstart", onDragStart, true);
  root.addEventListener("dragend", onDragEnd, true);
  return () => {
    root.removeEventListener("dragstart", onDragStart, true);
    root.removeEventListener("dragend", onDragEnd, true);
  };
}
