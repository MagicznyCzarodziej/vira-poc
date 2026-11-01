import type { FieldName, FrameRect, FrameResizeHandle, IssueRef, SavedDocument } from "../domain/index.ts";

export type Surface = "list" | "canvas";
export type EditField = "problem" | "answer" | "tags" | "followup" | "actionPoint" | "frameTitle";

export type EditTarget = {
  id: string;
  field: EditField;
  step: number;
  surface: Surface;
  /** Which canvas host is being edited when the same item appears more than once. */
  canvasPlacementKey?: string;
};

export type ComposerIntent = "decision" | "question";

export type CanvasTool = "default" | "frame";

export type DocumentState = SavedDocument & {
  openComposer: boolean;
  composerIntent: ComposerIntent;
  composerTags: string[];
  followupDrafts: Record<string, string>;
  editing: EditTarget | null;
  editInitial: string;
  focusNonce: number;
  revealId: string | null;
  canvasSelection: string[];
  canvasTool: CanvasTool;
  setCanvasTool: (tool: CanvasTool) => void;
  toggleFrameTool: () => void;
  setView: (mode: SavedDocument["viewMode"]) => void;
  toggleDates: () => void;
  setListFilter: (notOnCanvas: boolean) => void;
  openNewDecision: () => void;
  openNewQuestion: () => void;
  closeComposer: () => void;
  addComposerTag: (tag: string) => void;
  submitComposer: (text: string, mode?: "decision" | "question") => void;
  setFollowupDraft: (id: string, value: string) => void;
  beginEdit: (target: EditTarget) => void;
  commitEdit: (value: string, next?: EditTarget | null) => void;
  cancelEdit: () => void;
  addTag: (id: string, tag: string) => void;
  toggleTentative: (id: string, step: number) => void;
  archiveAnswer: (id: string, step: number) => void;
  archiveQuestionAt: (id: string, step: number) => void;
  archiveCardById: (id: string) => void;
  removeFromCanvas: (id: string) => void;
  placeAtWorld: (id: string, x: number, y: number) => void;
  placeNewCardAtWorld: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  movePlacement: (id: string, x: number, y: number) => void;
  movePlacements: (moves: { id: string; x: number; y: number }[]) => void;
  /** Alt-drag: clone card placements at given positions; returns old key → new key. */
  duplicateCardPlacementsForDrag: (
    placementKeys: readonly string[],
    positions: Readonly<Record<string, { x: number; y: number }>>,
  ) => Record<string, string>;
  setCanvasSelection: (ids: string[]) => void;
  toggleCanvasSelection: (id: string) => void;
  clearCanvasSelection: () => void;
  removeCanvasSelectionFromCanvas: () => void;
  setViewport: (viewport: SavedDocument["canvasViewport"], userSet?: boolean) => void;
  createBlankCard: (where: Surface, intent?: ComposerIntent) => string | null;
  addRandom: () => void;
  importFigJamStickiesFromCsv: (csvText: string) => number;
  clearAll: () => void;
  setFieldHeadText: (itemId: string, stepIndex: number, field: FieldName, text: string) => void;
  upgradeIssueRef: (parsed: IssueRef, source?: { itemId: string; stepIndex: number; field: FieldName }) => boolean;
  addActionPointToDecision: (itemId: string, stepIndex: number, surface: Surface) => string | null;
  linkActionPointToDecision: (actionPointId: string, itemId: string, stepIndex: number) => boolean;
  unlinkActionPointFromDecision: (actionPointId: string, itemId: string, stepIndex: number) => boolean;
  createStandaloneActionPoint: (title?: string) => string;
  setActionPointTitle: (actionPointId: string, title: string) => void;
  toggleActionPointDone: (actionPointId: string) => void;
  placeActionPointAtWorld: (id: string, x: number, y: number) => void;
  moveActionPointPlacement: (id: string, x: number, y: number) => void;
  moveActionPointPlacements: (moves: { id: string; x: number; y: number }[]) => void;
  bringActionPointToFront: (id: string) => void;
  removeActionPointFromCanvas: (id: string) => void;
  createFrameOnCanvas: (x: number, y: number, title?: string) => string;
  createFrameWithBoundsOnCanvas: (bounds: FrameRect, title?: string) => string;
  setFrameTitle: (frameId: string, title: string) => void;
  moveFramePlacements: (moves: { id: string; x: number; y: number }[]) => void;
  resizeFrame: (id: string, width: number, height: number) => void;
  resizeFrameFromHandle: (
    id: string,
    handle: FrameResizeHandle,
    start: FrameRect,
    dx: number,
    dy: number,
  ) => void;
  bringFrameToFront: (id: string) => void;
  removeFrameFromCanvas: (id: string) => void;
  clearReveal: () => void;
};
