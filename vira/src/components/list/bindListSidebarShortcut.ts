import { useDocument } from "../../store/index.ts";

export const LIST_SIDEBAR_SHORTCUT_LABEL = "S";

function typingInField(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLElement
    && !!active.closest("textarea, input, select, [contenteditable='true']");
}

export function shouldToggleListSidebarShortcut(event: KeyboardEvent): boolean {
  if (event.repeat || event.altKey || event.metaKey || event.ctrlKey) return false;
  if (event.key !== "s" && event.key !== "S") return false;
  if (useDocument.getState().viewMode !== "list") return false;
  if (typingInField()) return false;
  return true;
}

export function bindListSidebarShortcut(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!shouldToggleListSidebarShortcut(event)) return;
    event.preventDefault();
    useDocument.getState().toggleSidebarHidden();
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
