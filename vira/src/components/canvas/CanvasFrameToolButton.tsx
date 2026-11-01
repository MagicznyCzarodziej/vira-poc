import { useDocument } from "../../store/index.ts";
import { IconFrame } from "../Icons.tsx";

export function CanvasFrameToolButton() {
  const canvasTool = useDocument((state) => state.canvasTool);
  const active = canvasTool === "frame";

  return (
    <button
      type="button"
      className={`canvas-tool-btn canvas-frame-tool-btn${active ? " is-active" : ""}`}
      data-action="canvas-frame-tool"
      aria-label="Frame tool — drag on canvas to draw a frame"
      aria-pressed={active}
      title={active ? "Frame tool (Esc to exit)" : "Frame tool (F)"}
      onClick={() => useDocument.getState().toggleFrameTool()}
    >
      <IconFrame />
    </button>
  );
}
