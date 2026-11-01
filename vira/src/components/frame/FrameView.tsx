import { memo } from "react";
import type { FrameRect } from "../../domain/index.ts";
import type { Frame } from "../../domain/types.ts";
import { useDocument, type Surface } from "../../store/index.ts";
import { shouldSuppressListCardClick } from "../canvas/listCardDrag.ts";
import { AutoTextarea } from "../card/AutoTextarea.tsx";
import { IconSquareDashedXCorner } from "../Icons.tsx";
import { CanvasFrameBorder } from "./CanvasFrameBorder.tsx";
import { FRAME_RESIZE_HANDLES } from "./frameResizeHandles.ts";

export const FrameView = memo(function FrameView({
  frame,
  width,
  height,
  occludersLocal = [],
}: {
  frame: Frame;
  width: number;
  height: number;
  surface: Surface;
  occludersLocal?: readonly FrameRect[];
}) {
  const zoom = useDocument((state) => state.canvasViewport.zoom);
  const borderEmphasis = useDocument((state) => state.canvasSelection.includes(frame.id));
  const editing = useDocument((state) => state.editing);
  const editInitial = useDocument((state) => {
    const e = state.editing;
    if (!e || e.id !== frame.id || e.field !== "frameTitle" || e.surface !== "canvas") return "";
    return state.editInitial;
  });
  const focusNonce = useDocument((state) => {
    const e = state.editing;
    if (!e || e.id !== frame.id || e.field !== "frameTitle" || e.surface !== "canvas") return 0;
    return state.focusNonce;
  });
  const editingTitle =
    editing?.id === frame.id
    && editing.field === "frameTitle"
    && editing.surface === "canvas";

  const startTitleEdit = () => {
    if (shouldSuppressListCardClick()) return;
    useDocument.getState().beginEdit({
      id: frame.id,
      field: "frameTitle",
      step: 0,
      surface: "canvas",
    });
  };

  return (
    <div
      className="canvas-frame-inner"
      style={{ width, height }}
      data-frame-id={frame.id}
    >
      <CanvasFrameBorder
        frameId={frame.id}
        width={width}
        height={height}
        zoom={zoom}
        occludersLocal={occludersLocal}
        emphasis={borderEmphasis}
      />
      <div className="canvas-frame-label">
        {editingTitle ? (
          <AutoTextarea
            key={`frame-${focusNonce}`}
            className="inline-input canvas-frame-title-input"
            initial={editInitial}
            dataset={{ "frame-id": frame.id }}
            onCancel={() => useDocument.getState().cancelEdit()}
            onCommit={(value) => useDocument.getState().commitEdit(value)}
          />
        ) : (
          <button
            type="button"
            className="canvas-frame-title"
            data-editable="frameTitle"
            data-id={frame.id}
            onClick={startTitleEdit}
          >
            {frame.title}
          </button>
        )}
        <button
          type="button"
          className="canvas-frame-dismiss"
          data-action="remove-frame-from-canvas"
          aria-label="Remove frame from canvas"
          title="Remove frame"
          onClick={() => {
            if (shouldSuppressListCardClick()) return;
            useDocument.getState().removeFrameFromCanvas(frame.id);
          }}
        >
          <IconSquareDashedXCorner />
        </button>
      </div>
      {FRAME_RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          className={`canvas-frame-resize canvas-frame-resize--${handle}`}
          data-frame-resize={handle}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});
