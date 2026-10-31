import { type ReactNode, type RefObject } from "react";
import type { ComposerIntent } from "../../store/documentTypes.ts";
import { useDocument } from "../../store/index.ts";
import { placeCenteredCard } from "./canvasCommands.ts";
import { setCanvasSpawnDragImage } from "./canvasSpawnDragGhost.ts";
import type { SpawnGesture } from "./canvasDrop.ts";
import { spawnPayloadForIntent } from "./canvasSpawnPayload.ts";

type SpawnButtonProps = {
  intent: ComposerIntent;
  spawnGesture: RefObject<SpawnGesture | null>;
  spawnAt: RefObject<number>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  className?: string;
  "aria-label": string;
  title: string;
  children: ReactNode;
};

export function CanvasSpawnButton({
  intent,
  spawnGesture,
  spawnAt,
  surfaceRef,
  className = "canvas-spawn-btn",
  "aria-label": ariaLabel,
  title,
  children,
}: SpawnButtonProps) {
  const spawnCentered = () => placeCenteredCard(surfaceRef, spawnAt, intent);

  return (
    <button
      type="button"
      className={className}
      data-action={intent === "question" ? "canvas-spawn-question" : "canvas-spawn-decision"}
      data-canvas-spawn
      data-canvas-spawn-intent={intent}
      draggable
      aria-label={ariaLabel}
      title={title}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const active = document.activeElement;
        if (
          (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)
          && active.closest(".card, .composer")
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
          intent,
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
        if (!gesture || gesture.id !== event.pointerId || gesture.intent !== intent) return;
        window.setTimeout(() => {
          if (gesture.drag || gesture.dropped) return;
          spawnGesture.current = null;
          spawnCentered();
        }, 0);
      }}
      onDragStart={(event) => {
        if (spawnGesture.current) spawnGesture.current.drag = true;
        event.dataTransfer.setData("text/plain", spawnPayloadForIntent(intent));
        event.dataTransfer.effectAllowed = "copy";
        setCanvasSpawnDragImage(event.nativeEvent);
      }}
      onDragEnd={() => {
        const gesture = spawnGesture.current;
        if (!gesture || gesture.intent !== intent) return;
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
