import {
  allKnownMentions,
  allKnownTags,
  buildIssueRefMarkdown,
  normalizeTagName,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { normalizeRefTokenForField, type IssueRefSuggestContext } from "../../domain/index.ts";
import { issueRefButtons } from "./issueRefSuggestions.ts";
import { closeMenu } from "./mentionMenu.ts";
import { suppressRefPickAfterInsert } from "./refPickSession.ts";
import type { AutocompleteOptions } from "./useAutocomplete.ts";

function writeRange(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
  insert: string,
  opts?: AutocompleteOptions,
  grow = false,
) {
  const next = `${ta.value.slice(0, start)}${insert}${ta.value.slice(end)}`;
  const cursor = start + insert.length;
  if (opts?.onValue) {
    opts.onValue(next, cursor);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  ta.value = next;
  ta.focus();
  ta.setSelectionRange(cursor, cursor);
  if (grow) {
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function triggerRange(ta: HTMLTextAreaElement, pattern: RegExp) {
  const pos = ta.selectionStart ?? ta.value.length;
  const before = ta.value.slice(0, pos);
  const match = before.match(pattern);
  if (!match) return null;
  return { start: pos - match[0].length, end: pos };
}

function insertMention(ta: HTMLTextAreaElement, name: string, opts?: AutocompleteOptions) {
  const range = triggerRange(ta, /@([\w.-]*)$/);
  if (!range) return;
  writeRange(ta, range.start, range.end, `@${name} `, opts);
}

function refSuggestContext(ta: HTMLTextAreaElement): IssueRefSuggestContext | undefined {
  if (ta.dataset.noteId) return undefined;
  const field = ta.dataset.refField;
  const hostItemId = ta.dataset.refItemId || ta.dataset.id;
  const ctx: IssueRefSuggestContext = {};
  if (field === "answer" || field === "problem") ctx.field = field;
  if (hostItemId) ctx.hostItemId = hostItemId;
  return Object.keys(ctx).length ? ctx : undefined;
}

export function isTypingIssueRef(ta: HTMLTextAreaElement): boolean {
  const pos = ta.selectionStart ?? ta.value.length;
  const before = ta.value.slice(0, pos);
  const match = before.match(/!\d*(?:\/(?:a?\d*))?(?:@v?\d*)?$/);
  if (!match) return false;
  const bangIndex = before.length - match[0].length;
  if (bangIndex > 0 && before[bangIndex - 1] === "(") return false;
  return true;
}

export function completeIssueRefAtCursor(ta: HTMLTextAreaElement, refToken: string, opts?: AutocompleteOptions): boolean {
  const range = triggerRange(ta, /!\d*(?:\/(?:a?\d*))?(?:@v?\d*)?$/);
  if (!range) return false;
  const items = useDocument.getState().items;
  const insert = buildIssueRefMarkdown(
    items,
    normalizeRefTokenForField(refToken, refSuggestContext(ta)),
    "",
  );
  if (!insert) return false;
  writeRange(ta, range.start, range.end, `${insert} `, opts);
  closeMenu();
  suppressRefPickAfterInsert();
  return true;
}

function insertIssueRef(ta: HTMLTextAreaElement, refToken: string, opts?: AutocompleteOptions) {
  completeIssueRefAtCursor(ta, refToken, opts);
}

function insertHashTag(ta: HTMLTextAreaElement, tagName: string, opts?: AutocompleteOptions) {
  const range = triggerRange(ta, /#([\w.-]*)$/);
  const tag = normalizeTagName(tagName);
  if (!range || !tag) return;
  opts?.onTag?.(tag, ta);
  writeRange(ta, range.start, range.end, "", opts, true);
}

export function confirmTagAtCursor(ta: HTMLTextAreaElement, opts?: AutocompleteOptions): boolean {
  const pos = ta.selectionStart ?? ta.value.length;
  const match = ta.value.slice(0, pos).match(/#([\w.-]*)$/);
  const name = normalizeTagName(match?.[1] ?? "");
  if (!name) return false;
  insertHashTag(ta, name, opts);
  closeMenu();
  return true;
}

function optionButton(label: string, onPick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mention-menu-item";
  button.setAttribute("role", "option");
  button.textContent = label;
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    onPick();
    closeMenu();
  });
  return button;
}

export function suggestionButtons(ta: HTMLTextAreaElement, opts?: AutocompleteOptions): HTMLButtonElement[] {
  const pos = ta.selectionStart ?? ta.value.length;
  const before = ta.value.slice(0, pos);
  const state = useDocument.getState();
  const items = state.items;
  const mention = before.match(/@([\w.-]*)$/);

  if (mention && !/^v\d+$/.test(mention[1] ?? "")) {
    const query = (mention[1] ?? "").toLowerCase();
    const hits = allKnownMentions(
      items,
      Object.values(state.followupDrafts),
      Object.values(state.actionPoints).map((ap) => ap.title),
    )
      .filter((name) => name.toLowerCase().startsWith(query))
      .slice(0, 8);
    if (hits.length) {
      return hits.map((name) => optionButton(`@${name}`, () => insertMention(ta, name, opts)));
    }
  }

  const issueButtons = issueRefButtons(
    before,
    items,
    (refToken) => insertIssueRef(ta, refToken, opts),
    refSuggestContext(ta),
  );
  if (issueButtons !== null) return issueButtons;

  const tag = opts?.tags !== false ? before.match(/#([\w.-]*)$/) : null;
  if (tag) {
    const query = (tag[1] ?? "").toLowerCase();
    const hits = allKnownTags(items).filter((name) => name.toLowerCase().startsWith(query)).slice(0, 8);
    const typed = normalizeTagName(query);
    const options = query && typed && !hits.includes(typed) ? [typed, ...hits] : hits;
    return options.map((name) => optionButton(`#${name}`, () => insertHashTag(ta, name, opts)));
  }

  return [];
}
