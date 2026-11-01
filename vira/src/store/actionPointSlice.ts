import type { StateCreator } from "zustand";
import {
  addActionPointRefToStep,
  collapseDecisionShellIfNoAnswerOrRefs,
  createActionPoint,
  ensureEmptyDecisionForActionPointRefs,
  isStepArchived,
  placeActionPointAtWorld,
  removeActionPointFromCanvasPlacements,
  removeActionPointRefFromStep,
  stepResolved,
  toggleActionPointDone as toggleActionPointDoneInBag,
} from "../domain/index.ts";
import { revealActionPointInList } from "../components/panels/history/revealCardInList.ts";
import type { DocumentState, Surface } from "./documentTypes.ts";
import { schedule } from "./documentPersistence.ts";

type ActionPointSlice = Pick<
  DocumentState,
  | "addActionPointToDecision"
  | "linkActionPointToDecision"
  | "unlinkActionPointFromDecision"
  | "createStandaloneActionPoint"
  | "setActionPointTitle"
  | "toggleActionPointDone"
  | "placeActionPointAtWorld"
  | "moveActionPointPlacement"
  | "moveActionPointPlacements"
  | "bringActionPointToFront"
  | "removeActionPointFromCanvas"
>;

export const createActionPointSlice: StateCreator<DocumentState, [], [], ActionPointSlice> = (set, get) => ({
  createStandaloneActionPoint: (title = "Action") => {
    const actionPoints = { ...get().actionPoints };
    const bag = { nextActionPointId: get().nextActionPointId, actionPoints };
    const ap = createActionPoint(bag, title);
    set({
      actionPoints: bag.actionPoints,
      nextActionPointId: bag.nextActionPointId,
      editing: { id: ap.id, field: "actionPoint", step: 0, surface: "list" },
      editInitial: ap.title,
      focusNonce: get().focusNonce + 1,
    });
    schedule(get);
    return ap.id;
  },
  setActionPointTitle: (actionPointId, title) => {
    const ap = get().actionPoints[actionPointId];
    if (!ap) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === ap.title) return;
    const actionPoints = { ...get().actionPoints, [actionPointId]: { ...ap, title: trimmed } };
    set({ actionPoints });
    schedule(get);
  },
  addActionPointToDecision: (itemId, stepIndex, surface) => {
    const card = get().items[itemId];
    const step = card?.steps[stepIndex];
    if (!card || !step || isStepArchived(step)) return null;

    const copy = structuredClone(card);
    const nextStep = copy.steps[stepIndex];
    if (!nextStep) return null;

    const actionPoints = { ...get().actionPoints };
    const bag = { nextActionPointId: get().nextActionPointId, actionPoints };
    const ap = createActionPoint(bag, "Action");

    if (!stepResolved(nextStep)) ensureEmptyDecisionForActionPointRefs(nextStep);
    addActionPointRefToStep(nextStep, ap.id);

    set({
      items: { ...get().items, [itemId]: copy },
      actionPoints: bag.actionPoints,
      nextActionPointId: bag.nextActionPointId,
      editing: { id: ap.id, field: "actionPoint", step: 0, surface: "list" },
      editInitial: ap.title,
      focusNonce: get().focusNonce + 1,
    });
    schedule(get);
    revealActionPointInList(ap.id);
    return ap.id;
  },
  linkActionPointToDecision: (actionPointId, itemId, stepIndex) => {
    if (!get().actionPoints[actionPointId]) return false;
    const card = get().items[itemId];
    const step = card?.steps[stepIndex];
    if (!card || !step || isStepArchived(step)) return false;

    const copy = structuredClone(card);
    const nextStep = copy.steps[stepIndex];
    if (!nextStep) return false;
    if (!stepResolved(nextStep)) ensureEmptyDecisionForActionPointRefs(nextStep);
    addActionPointRefToStep(nextStep, actionPointId);
    set({ items: { ...get().items, [itemId]: copy } });
    schedule(get);
    return true;
  },
  unlinkActionPointFromDecision: (actionPointId, itemId, stepIndex) => {
    const card = get().items[itemId];
    const step = card?.steps[stepIndex];
    if (!card || !step) return false;

    const copy = structuredClone(card);
    const nextStep = copy.steps[stepIndex];
    if (!nextStep || !removeActionPointRefFromStep(nextStep, actionPointId)) return false;
    collapseDecisionShellIfNoAnswerOrRefs(nextStep);

    set({ items: { ...get().items, [itemId]: copy } });
    schedule(get);
    return true;
  },
  toggleActionPointDone: (actionPointId) => {
    const ap = get().actionPoints[actionPointId];
    if (!ap) return;
    const actionPoints = { ...get().actionPoints };
    const copy = { ...ap };
    toggleActionPointDoneInBag(copy);
    actionPoints[actionPointId] = copy;
    set({ actionPoints });
    schedule(get);
  },
  placeActionPointAtWorld: (id, x, y) => {
    const actionPointPlacements = { ...get().actionPointPlacements };
    placeActionPointAtWorld(actionPointPlacements, get().actionPoints, id, x, y);
    set({ actionPointPlacements, revealId: id });
    schedule(get);
  },
  moveActionPointPlacement: (id, x, y) => {
    const actionPointPlacements = structuredClone(get().actionPointPlacements);
    placeActionPointAtWorld(actionPointPlacements, get().actionPoints, id, x, y);
    set({ actionPointPlacements });
    schedule(get);
  },
  moveActionPointPlacements: (moves) => {
    if (moves.length === 0) return;
    const actionPointPlacements = structuredClone(get().actionPointPlacements);
    const actionPoints = get().actionPoints;
    for (const { id, x, y } of moves) {
      placeActionPointAtWorld(actionPointPlacements, actionPoints, id, x, y);
    }
    set({ actionPointPlacements });
    schedule(get);
  },
  bringActionPointToFront: (id) => {
    const pos = get().actionPointPlacements[id];
    if (!pos || !get().actionPoints[id]) return;
    const actionPointPlacements = { ...get().actionPointPlacements };
    placeActionPointAtWorld(actionPointPlacements, get().actionPoints, id, pos.x, pos.y);
    set({ actionPointPlacements });
    schedule(get);
  },
  removeActionPointFromCanvas: (id) => {
    const actionPointPlacements = { ...get().actionPointPlacements };
    removeActionPointFromCanvasPlacements(actionPointPlacements, id);
    set({
      actionPointPlacements,
      canvasSelection: get().canvasSelection.filter((selected) => selected !== id),
    });
    schedule(get);
  },
});
