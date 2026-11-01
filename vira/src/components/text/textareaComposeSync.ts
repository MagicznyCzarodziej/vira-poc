import type { AutocompleteOptions } from "./useAutocomplete.ts";

type ComposeSync = Pick<AutocompleteOptions, "onValue" | "tags">;

const composeByTextarea = new WeakMap<HTMLTextAreaElement, ComposeSync>();

export function registerTextareaCompose(
  ta: HTMLTextAreaElement,
  sync: ComposeSync,
): () => void {
  composeByTextarea.set(ta, sync);
  return () => composeByTextarea.delete(ta);
}

export function autocompleteOptsForTextarea(ta: HTMLTextAreaElement): AutocompleteOptions | undefined {
  return composeByTextarea.get(ta);
}
