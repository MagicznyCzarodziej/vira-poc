import type { StateCreator } from "zustand";
import {
  addRandomCards,
  archiveCard,
  archiveQuestion,
  archiveStepAnswerField,
  createBlankCard as createBlankCardInBag,
  importFigJamStickies,
  normalizeTagName,
  parseFigJamStickyCsv,
  recomputeNextId,
  locateIssueRefSource,
  replaceIssueRefRevisionInText,
  setStepFieldHeadText,
  toggleAnswerTentative,
  type FieldName,
} from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

type CardSlice = Pick<
  DocumentState,
  | "addTag"
  | "toggleTentative"
  | "archiveAnswer"
  | "archiveQuestionAt"
  | "archiveCardById"
  | "createBlankCard"
  | "addRandom"
  | "importFigJamStickiesFromCsv"
  | "clearAll"
  | "setFieldHeadText"
  | "upgradeIssueRef"
>;

export const createCardSlice: StateCreator<DocumentState, [], [], CardSlice> = (set, get) => ({
  addTag: (id, tag) => {
    const name = normalizeTagName(tag);
    const card = get().items[id];
    if (!name || !card || card.tags.includes(name)) return;
    const copy = structuredClone(card);
    copy.tags.push(name);
    set({ items: { ...get().items, [id]: copy } });
    schedule(get);
  },
  toggleTentative: (id, stepIndex) => {
    const card = get().items[id];
    const step = card?.steps[stepIndex];
    if (!card || !step) return;
    const copy = structuredClone(card);
    const next = copy.steps[stepIndex];
    if (!next) return;
    toggleAnswerTentative(next);
    set({ items: { ...get().items, [id]: copy } });
    schedule(get);
  },
  archiveAnswer: (id, stepIndex) => {
    const card = get().items[id];
    const step = card?.steps[stepIndex];
    if (!card || !step) return;
    const copy = structuredClone(card);
    const next = copy.steps[stepIndex];
    if (!next || !archiveStepAnswerField(next)) return;
    set({ items: { ...get().items, [id]: copy } });
    schedule(get);
  },
  archiveQuestionAt: (id, stepIndex) => {
    const card = get().items[id];
    if (!card) return;
    const copy = structuredClone(card);
    if (!archiveQuestion(copy, stepIndex)) return;
    set({ items: { ...get().items, [id]: copy } });
    schedule(get);
  },
  archiveCardById: (id) => {
    const bag = bagOf(get());
    bag.items = structuredClone(bag.items);
    bag.canvasPlacements = { ...bag.canvasPlacements };
    archiveCard(bag, id);
    const drafts = { ...get().followupDrafts };
    delete drafts[id];
    set({ items: { ...bag.items }, canvasPlacements: { ...bag.canvasPlacements }, followupDrafts: drafts });
    schedule(get);
  },
  createBlankCard: (where) => {
    const bag = bagOf(get());
    bag.items = { ...bag.items };
    const id = createBlankCardInBag(bag);
    set({
      items: { ...bag.items },
      nextId: bag.nextId,
      editing: { id, field: "problem", step: 0, surface: where },
      editInitial: "",
      focusNonce: get().focusNonce + 1,
      revealId: where === "canvas" ? id : null,
    });
    schedule(get);
    return id;
  },
  addRandom: () => {
    const bag = bagOf(get());
    bag.items = structuredClone(bag.items);
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    addRandomCards(bag);
    set({
      items: bag.items,
      nextId: bag.nextId,
      canvasPlacements: bag.canvasPlacements,
      openComposer: false,
    });
    schedule(get);
  },
  importFigJamStickiesFromCsv: (csvText) => {
    const stickies = parseFigJamStickyCsv(csvText);
    if (stickies.length === 0) return 0;
    const bag = bagOf(get());
    bag.items = { ...bag.items };
    const ids = importFigJamStickies(bag, stickies);
    set({
      items: bag.items,
      nextId: bag.nextId,
      openComposer: false,
      editing: null,
      editInitial: "",
    });
    schedule(get);
    return ids.length;
  },
  clearAll: () => {
    set({
      items: {},
      nextId: recomputeNextId({}),
      canvasPlacements: {},
      canvasViewport: { scrollLeft: 0, scrollTop: 0, zoom: 1 },
      canvasViewportUserSet: false,
      followupDrafts: {},
      openComposer: false,
      composerTags: [],
      editing: null,
      editInitial: "",
    });
    schedule(get);
  },
  setFieldHeadText: (itemId, stepIndex, field, text) => {
    const card = get().items[itemId];
    const step = card?.steps[stepIndex];
    if (!card || !step) return;
    const copy = structuredClone(card);
    const next = copy.steps[stepIndex];
    if (!next) return;
    setStepFieldHeadText(next, field, text);
    set({ items: { ...get().items, [itemId]: copy } });
    schedule(get);
  },
  upgradeIssueRef: (parsed, source) => {
    if (parsed.revision == null || parsed.stepIndex == null) return false;
    const target = get().items[parsed.itemId]?.steps[parsed.stepIndex];
    if (!target) return false;
    const field: FieldName = parsed.focusAnswer ? "answer" : "problem";
    const head = field === "answer" ? target.answerRev : target.problemRev;
    const located = source ?? locateIssueRefSource(get().items, parsed);
    if (!located) return false;
    const card = get().items[located.itemId];
    const step = card?.steps[located.stepIndex];
    if (!card || !step) return false;
    const before = located.field === "answer" ? (step.answer ?? "") : step.problem;
    const updated = replaceIssueRefRevisionInText(before, parsed, head);
    if (updated === before) return false;
    get().setFieldHeadText(located.itemId, located.stepIndex, located.field, updated);
    return true;
  },
});
