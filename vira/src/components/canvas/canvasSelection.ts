export function resolveCanvasDragGroup(selection: readonly string[], draggedId: string): string[] {
  return selection.includes(draggedId) && selection.length > 1 ? [...selection] : [draggedId];
}

export function mergeMarqueeSelection(baseIds: readonly string[], hitIds: readonly string[]): string[] {
  return [...new Set([...baseIds, ...hitIds])];
}
