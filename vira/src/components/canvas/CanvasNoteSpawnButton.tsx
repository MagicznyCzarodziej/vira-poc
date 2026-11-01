import { type ReactNode, type RefObject } from "react";
import { useDocument } from "../../store/index.ts";
import { placeCenteredNote } from "./canvasCommands.ts";
import { setCanvasSpawnDragImage } from "./canvasSpawnDragGhost.ts";
import type { SpawnGesture } from "./canvasDrop.ts";
import { spawnPayloadForNote } from "./canvasSpawnPayload.ts";

type Props = {
  spawnGesture: RefObject<SpawnGesture | null>;
  spawnAt: RefObject<number>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

export function CanvasNoteSpawnButton({ spawnGesture, spawnAt, surfaceRef, children }: Props) {
  const spawnCentered = () => placeCenteredNote(surfaceRef, spawnAt);

  return (
    <button
      type="button"
      className="canvas-spawn-btn"
      data-action="canvas-spawn-note"
      data-canvas-spawn
      draggable
      aria-label="New sticky note — N, click, or drag onto canvas"
      title="New note (N, click, or drag)"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const active = document.activeElement;
        if (
          (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)
          && active.closest(".card, .composer, .canvas-sticky-note")
        ) {
          useDocument.getState().commitEdit(active.value);
        }
        spawnGesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          dist: 0,
          drag: false,
          dropped: false,
          kind: "note",
        };
      }}
      onPointerMove={(event) => {
        const gesture = spawnGesture.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        gesture.dist = Math.max(gesture.dist, dx * dx + dy * dy);
      }}
      onPointerUp={(event) => {
        const gesture = spawnGesture.current;
        if (!gesture || gesture.id !== event.pointerId || gesture.kind !== "note") return;
        window.setTimeout(() => {
          if (gesture.drag || gesture.dropped) return;
          spawnGesture.current = null;
          spawnCentered();
        }, 0);
      }}
      onDragStart={(event) => {
        if (spawnGesture.current) spawnGesture.current.drag = true;
        event.dataTransfer.setData("text/plain", spawnPayloadForNote());
        event.dataTransfer.effectAllowed = "copy";
        setCanvasSpawnDragImage(event.nativeEvent, "note");
      }}
      onDragEnd={() => {
        const gesture = spawnGesture.current;
        if (!gesture || gesture.kind !== "note") return;
        const micro = gesture.drag && !gesture.dropped && gesture.dist <= 36;
        spawnGesture.current = null;
        if (micro) spawnCentered();
        else if (gesture.drag) spawnAt.current = Date.now();
      }}
      onClick={() => {
        if (Date.now() - spawnAt.current < 400) return;
        const gesture = spawnGesture.current;
        if (gesture?.drag || gesture?.dropped) return;
        spawnCentered();
      }}
    >
      {children}
    </button>
  );
}
