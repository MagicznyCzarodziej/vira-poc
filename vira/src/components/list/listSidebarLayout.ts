import type { CSSProperties } from "react";

export function listSidebarGridTemplateRows(actionsExpanded: boolean, decisionsExpanded: boolean): string {
  if (actionsExpanded && decisionsExpanded) return "minmax(0, 1fr) minmax(0, 1fr)";
  if (actionsExpanded) return "minmax(0, 1fr) auto";
  if (decisionsExpanded) return "auto minmax(0, 1fr)";
  return "auto auto";
}

export function listSidebarSectionFlexStyle(
  actionsExpanded: boolean,
  decisionsExpanded: boolean,
  section: "actions" | "decisions",
): CSSProperties {
  const expanded = section === "actions" ? actionsExpanded : decisionsExpanded;
  if (!expanded) {
    return { flex: "0 0 auto", minHeight: "auto", height: "auto" };
  }
  const soleExpanded =
    (section === "actions" && actionsExpanded && !decisionsExpanded)
    || (section === "decisions" && decisionsExpanded && !actionsExpanded);
  if (soleExpanded) {
    return { flex: "1 1 0", minHeight: 0 };
  }
  return { flex: "1 1 0", minHeight: 0 };
}
