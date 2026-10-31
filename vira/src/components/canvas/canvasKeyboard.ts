export function isSpaceKey(event: Pick<KeyboardEvent, "key" | "code">): boolean {
  return event.code === "Space" || event.key === " ";
}

export function shouldStartCanvasSpacePan(spaceHeld: boolean, button: number): boolean {
  return spaceHeld && button === 0;
}

export function isCanvasSelectionRemoveKey(event: Pick<KeyboardEvent, "key">): boolean {
  return event.key === "Delete" || event.key === "Backspace";
}

export function shouldRemoveCanvasSelectionOnKey(opts: {
  key: Pick<KeyboardEvent, "key">;
  typing: boolean;
  selectionCount: number;
  viewMode: "list" | "board";
}): boolean {
  return (
    isCanvasSelectionRemoveKey(opts.key)
    && !opts.typing
    && opts.selectionCount > 0
    && opts.viewMode === "list"
  );
}

export function isCanvasScrollKey(event: Pick<KeyboardEvent, "key" | "code">): boolean {
  return (
    event.key === "Home"
    || event.key === "End"
    || event.key === "PageUp"
    || event.key === "PageDown"
    || isSpaceKey(event)
  );
}

export function shouldBlockCanvasScrollNavigation(opts: {
  typing: boolean;
  pointerOverCanvas: boolean;
  focusNode: Node | null;
  canvasSurface: Node;
}): boolean {
  if (opts.typing) return false;
  if (opts.pointerOverCanvas) return true;
  if (opts.focusNode && opts.canvasSurface.contains(opts.focusNode)) return true;
  return false;
}
