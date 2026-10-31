import type { StateCreator } from "zustand";
import {
  addStep,
  archiveStepAnswerField,
  createCard,
  normalizeTagName,
  parseTags,
  recordAnswerEdit,
  recordProblemEdit,
  type Card,
} from "../domain/index.ts";
import type { DocumentState, EditTarget } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

function fieldInitial(card: Card, target: EditTarget, drafts: Record<string, string>): string {
  if (target.field === "tags") return card.tags.join(", ");
  if (target.field === "followup") return drafts[card.id] ?? "";
  const step = card.steps[target.step];
  if (!step) return "";
  if (target.field === "problem") return step.problem;
  return step.answer ?? "";
}

function peelTrailingTag(value: string): { text: string; tag: string | null } {
  const match = value.match(/#([\w][\w.-]*)$/);
  if (!match || match.index == null) return { text: value, tag: null };
  return { text: value.slice(0, match.index), tag: normalizeTagName(match[1]) };
}

type EditSlice = Pick<
  DocumentState,
  | "openNewDecision"
  | "closeComposer"
  | "addComposerTag"
  | "submitComposer"
  | "setFollowupDraft"
  | "beginEdit"
  | "commitEdit"
  | "cancelEdit"
>;

export const createEditSlice: StateCreator<DocumentState, [], [], EditSlice> = (set, get) => ({
  openNewDecision: () => set({ openComposer: true, composerTags: [], focusNonce: get().focusNonce + 1 }),
  closeComposer: () => set({ openComposer: false, composerTags: [] }),
  addComposerTag: (tag) => {
    const name = normalizeTagName(tag);
    if (!name || get().composerTags.includes(name)) return;
    set({ composerTags: [...get().composerTags, name] });
  },
  submitComposer: (raw) => {
    const peeled = peelTrailingTag(raw);
    if (peeled.tag) get().addComposerTag(peeled.tag);
    const text = peeled.text.trim();
    if (!text) {
      set({ openComposer: false, composerTags: [] });
      return;
    }
    const bag = bagOf(get());
    bag.items = { ...bag.items };
    const id = createCard(bag, { problem: text, tags: get().composerTags });
    if (!id) return;
    set({
      items: { ...bag.items },
      nextId: bag.nextId,
      openComposer: false,
      composerTags: [],
      editing: { id, field: "answer", step: 0, surface: get().viewMode === "board" ? "list" : "list" },
      editInitial: "",
      focusNonce: get().focusNonce + 1,
    });
    schedule(get);
  },
  setFollowupDraft: (id, value) => set({ followupDrafts: { ...get().followupDrafts, [id]: value } }),
  beginEdit: (target) => {
    const card = get().items[target.id];
    if (!card) return;
    set({
      editing: target,
      editInitial: fieldInitial(card, target, get().followupDrafts),
      focusNonce: get().focusNonce + 1,
    });
  },
  commitEdit: (value, next) => {
    const editing = get().editing;
    if (!editing) {
      if (next) get().beginEdit(next);
      return;
    }
    const peeled = editing.field === "tags" ? { text: value, tag: null } : peelTrailingTag(value);
    const card = get().items[editing.id];
    let items = get().items;
    if (card) {
      const copy = structuredClone(card);
      if (peeled.tag && !copy.tags.includes(peeled.tag)) copy.tags.push(peeled.tag);
      const step = copy.steps[editing.step];
      if (editing.field === "tags") copy.tags = parseTags(value);
      else if (editing.field === "problem" && step && peeled.text.trim()) recordProblemEdit(step, peeled.text);
      else if (editing.field === "answer" && step) {
        if (peeled.text.trim()) recordAnswerEdit(step, peeled.text);
        else archiveStepAnswerField(step);
      } else if (editing.field === "followup" && peeled.text.trim()) {
        addStep(copy, peeled.text);
        const drafts = { ...get().followupDrafts };
        delete drafts[editing.id];
        const stepIndex = copy.steps.length - 1;
        set({
          items: { ...items, [editing.id]: copy },
          followupDrafts: drafts,
          editing: { id: editing.id, field: "answer", step: stepIndex, surface: editing.surface },
          editInitial: "",
          focusNonce: get().focusNonce + 1,
        });
        schedule(get);
        return;
      }
      items = { ...items, [editing.id]: copy };
    }
    if (next) {
      const fresh = items[next.id];
      set({
        items,
        editing: next,
        editInitial: fresh ? fieldInitial(fresh, next, get().followupDrafts) : "",
        focusNonce: get().focusNonce + 1,
      });
    } else {
      set({ editing: null, editInitial: "", ...(card ? { items } : {}) });
    }
    schedule(get);
  },
  cancelEdit: () => set({ editing: null, editInitial: "" }),
});
