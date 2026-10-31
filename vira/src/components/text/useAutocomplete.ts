import { confirmTagAtCursor, suggestionButtons } from "./autocompleteSuggestions.ts";
import { bindTextarea, handleMenuKey, openMenu } from "./mentionMenu.ts";

export type AutocompleteOptions = {
  onTag?: (tag: string, ta: HTMLTextAreaElement) => void;
  onValue?: (value: string, cursor: number) => void;
};

export { menuIsOpen } from "./mentionMenu.ts";

export function isTypingTag(value: string, cursor: number): boolean {
  return /#([\w.-]*)$/.test(value.slice(0, cursor));
}

export function bindAutocomplete(ta: HTMLTextAreaElement, opts?: AutocompleteOptions): () => void {
  if (!ta || ta.closest(".issue-ref-panel-body")) return () => {};
  return bindTextarea(
    ta,
    () => openMenu(ta, suggestionButtons(ta, opts)),
    (event) => {
      if (handleMenuKey(event)) return;
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing && confirmTagAtCursor(ta, opts)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
  );
}
