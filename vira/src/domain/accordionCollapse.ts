export type ListSidebarSection = "actions" | "decisions";

export type AccordionCollapseTarget =
  | { kind: "card"; itemId: string; canvasPlacementKey?: string | null }
  | { kind: "actionPoint"; actionPointId: string }
  | { kind: "listSection"; section: ListSidebarSection };

export function accordionCollapseKey(target: AccordionCollapseTarget): string {
  if (target.kind === "listSection") return `list-section@${target.section}`;
  if (target.kind === "card") {
    return target.canvasPlacementKey
      ? `card@${target.canvasPlacementKey}`
      : `card@${target.itemId}`;
  }
  return `ap@${target.actionPointId}`;
}

export function isAccordionCollapsed(collapsed: readonly string[], key: string): boolean {
  return collapsed.includes(key);
}

export function toggleAccordionCollapsedKey(collapsed: readonly string[], key: string): string[] {
  if (collapsed.includes(key)) return collapsed.filter((entry) => entry !== key);
  return [...collapsed, key];
}

export function normalizeAccordionCollapsed(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}
