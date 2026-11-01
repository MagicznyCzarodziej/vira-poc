import { CARD_WIDTH, DROP_OFFSET_Y } from "../../domain/index.ts";
import type { ComposerIntent } from "../../store/documentTypes.ts";
import { useDocument } from "../../store/index.ts";
import {
  isCanvasCardSpawnPayload,
  isCanvasSpawnPayload,
  spawnIntentFromPayload,
} from "./canvasSpawnPayload.ts";

export {
  isCanvasSpawnPayload,
  isCanvasCardSpawnPayload,
  isCanvasFrameSpawnPayload,
  SPAWN,
  SPAWN_DECISION,
  SPAWN_FRAME,
  SPAWN_QUESTION,
  spawnIntentFromPayload,
  spawnPayloadForFrame,
  spawnPayloadForIntent,
} from "./canvasSpawnPayload.ts";

export type SpawnGesture = {
  id: number;
  x: number;
  y: number;
  dist: number;
  drag: boolean;
  dropped: boolean;
  intent: ComposerIntent;
};

export function bindCanvasDrop(
  surface: HTMLElement,
  spawnGesture: { readonly current: SpawnGesture | null },
): () => void {
  const worldPoint = (clientX: number, clientY: number) => {
    const rect = surface.getBoundingClientRect();
    const zoom = useDocument.getState().canvasViewport.zoom;
    return {
      x: (surface.scrollLeft + clientX - rect.left) / zoom,
      y: (surface.scrollTop + clientY - rect.top) / zoom,
    };
  };
  const onDrop = (event: DragEvent) => {
    const payload = event.dataTransfer?.getData("text/plain");
    if (!payload) return;
    if (!surface.contains(event.target as Node) && !isCanvasSpawnPayload(payload)) return;
    if (isCanvasCardSpawnPayload(payload) && (event.target as Element).closest(".workspace-list")) {
      event.preventDefault();
      if (spawnGesture.current) spawnGesture.current.dropped = true;
      useDocument.getState().createBlankCard("list", spawnIntentFromPayload(payload));
      return;
    }
    if (isCanvasCardSpawnPayload(payload) && !(event.target as Element).closest("[data-canvas-surface]")) return;
    event.preventDefault();
    if (isCanvasCardSpawnPayload(payload)) {
      if (spawnGesture.current) spawnGesture.current.dropped = true;
      const id = useDocument.getState().createBlankCard("canvas", spawnIntentFromPayload(payload));
      if (!id) return;
      const pt = worldPoint(event.clientX, event.clientY);
      useDocument.getState().placeNewCardAtWorld(id, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
      return;
    }
    if (!(event.target as Element).closest("[data-canvas-surface]")) return;
    const pt = worldPoint(event.clientX, event.clientY);
    useDocument.getState().placeAtWorld(payload, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
  };
  const onDragOver = (event: DragEvent) => {
    if ((event.target as Element).closest("[data-canvas-surface], .workspace-list")) {
      event.preventDefault();
    }
  };
  const app = document.getElementById("app");
  app?.addEventListener("dragover", onDragOver);
  app?.addEventListener("drop", onDrop);
  return () => {
    app?.removeEventListener("dragover", onDragOver);
    app?.removeEventListener("drop", onDrop);
  };
}
