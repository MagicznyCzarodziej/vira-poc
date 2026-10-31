import type { StateCreator } from "zustand";
import {
  addStep,
  archiveStepAnswerField,
  createCard,
  getAnswerText,
  getProblemText,
  normalizeTagName,
  parseTags,
  ensureEmptyDecisionForActionPointRefs,
  recordAnswerEdit,
  recordProblemEdit,
  stepActionPointRefIds,
  stripActionPointRefsFromText,
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

function editableFieldInitial(card: Card, target: EditTarget, drafts: Record<string, string>): string {
  const raw = fieldInitial(card, target, drafts);
  if (target.field === "answer" || target.field === "problem") {
    return stripActionPointRefsFromText(raw);
  }
  return raw;
}

function peelTrailingTag(value: string): { text: string; tag: string | null } {
  const match = value.match(/#([\w][\w.-]*)$/);
  if (!match || match.index == null) return { text: value, tag: null };
  return { text: value.slice(0, match.index), tag: normalizeTagName(match[1]) };
}

type EditSlice = Pick<
  DocumentState,
  | "openNewDecision"
  | "openNewQuestion"
  | "closeComposer"
  | "addComposerTag"
  | "submitComposer"
  | "setFollowupDraft"
  | "beginEdit"
  | "commitEdit"
  | "cancelEdit"
>;

export const createEditSlice: StateCreator<DocumentState, [], [], EditSlice> = (set, get) => ({
  openNewDecision: () =>
    set({ openComposer: true, composerIntent: "decision", composerTags: [], focusNonce: get().focusNonce + 1 }),
  openNewQuestion: () =>
    set({ openComposer: true, composerIntent: "question", composerTags: [], focusNonce: get().focusNonce + 1 }),
  closeComposer: () => set({ openComposer: false, composerTags: [], composerIntent: "decision" }),
  addComposerTag: (tag) => {
    const name = normalizeTagName(tag);
    if (!name || get().composerTags.includes(name)) return;
    set({ composerTags: [...get().composerTags, name] });
  },
  submitComposer: (raw, mode) => {
    const intent = mode ?? get().composerIntent;
    const peeled = peelTrailingTag(raw);
    if (peeled.tag) get().addComposerTag(peeled.tag);
    const text = peeled.text.trim();
    if (!text) {
      set({ openComposer: false, composerTags: [], composerIntent: "decision" });
      return;
    }
    const bag = bagOf(get());
    bag.items = { ...bag.items };
    const tags = get().composerTags;
    const id =
      intent === "question"
        ? createCard(bag, { problem: text, tags })
        : createCard(bag, { problem: "", answer: text, tags });
    if (!id) return;
    const surface = get().viewMode === "board" ? "list" : "list";
    set({
      items: { ...bag.items },
      nextId: bag.nextId,
      openComposer: false,
      composerTags: [],
      composerIntent: "decision",
      editing:
        intent === "question"
          ? { id, field: "answer", step: 0, surface }
          : null,
      editInitial: "",
      focusNonce: get().focusNonce + 1,
    });
    schedule(get);
  },
  setFollowupDraft: (id, value) => set({ followupDrafts: { ...get().followupDrafts, [id]: value } }),
  beginEdit: (target) => {
    if (target.field === "actionPoint") {
      const ap = get().actionPoints[target.id];
      if (!ap) return;
      set({
        editing: target,
        editInitial: ap.title,
        focusNonce: get().focusNonce + 1,
      });
      return;
    }
    const card = get().items[target.id];
    if (!card) return;
    set({
      editing: target,
      editInitial: editableFieldInitial(card, target, get().followupDrafts),
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
    if (editing.field === "actionPoint") {
      get().setActionPointTitle(editing.id, peeled.text.trim() || "Action");
      if (next) {
        get().beginEdit(next);
      } else {
        set({ editing: null, focusNonce: get().focusNonce + 1 });
      }
      schedule(get);
      return;
    }
    const card = get().items[editing.id];
    let items = get().items;
    if (card) {
      const copy = structuredClone(card);
      if (peeled.tag && !copy.tags.includes(peeled.tag)) copy.tags.push(peeled.tag);
      const step = copy.steps[editing.step];
      if (editing.field === "tags") copy.tags = parseTags(value);
      else if (editing.field === "problem" && step && peeled.text.trim()) {
        recordProblemEdit(step, stripActionPointRefsFromText(peeled.text));
      } else if (editing.field === "answer" && step) {
        if (peeled.text.trim()) {
          recordAnswerEdit(step, stripActionPointRefsFromText(peeled.text));
        } else if (stepActionPointRefIds(step).length > 0) {
          ensureEmptyDecisionForActionPointRefs(step);
        } else {
          archiveStepAnswerField(step);
        }
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
        editInitial: fresh ? editableFieldInitial(fresh, next, get().followupDrafts) : "",
        focusNonce: get().focusNonce + 1,
      });
    } else {
      set({ editing: null, editInitial: "", ...(card ? { items } : {}) });
    }
    schedule(get);
  },
  cancelEdit: () => set({ editing: null, editInitial: "" }),
});
