import type { FieldName, IssueRef, SavedDocument } from "../domain/index.ts";

export type Surface = "list" | "canvas";
export type EditField = "problem" | "answer" | "tags" | "followup";

export type EditTarget = {
  id: string;
  field: EditField;
  step: number;
  surface: Surface;
};

export type DocumentState = SavedDocument & {
  openComposer: boolean;
  composerTags: string[];
  followupDrafts: Record<string, string>;
  editing: EditTarget | null;
  editInitial: string;
  focusNonce: number;
  revealId: string | null;
  canvasSelection: string[];
  setView: (mode: SavedDocument["viewMode"]) => void;
  toggleDates: () => void;
  setListFilter: (notOnCanvas: boolean) => void;
  openNewDecision: () => void;
  closeComposer: () => void;
  addComposerTag: (tag: string) => void;
  submitComposer: (text: string) => void;
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
  bringToFront: (id: string) => void;
  movePlacement: (id: string, x: number, y: number) => void;
  movePlacements: (moves: { id: string; x: number; y: number }[]) => void;
  setCanvasSelection: (ids: string[]) => void;
  toggleCanvasSelection: (id: string) => void;
  clearCanvasSelection: () => void;
  removeCanvasSelectionFromCanvas: () => void;
  setViewport: (viewport: SavedDocument["canvasViewport"], userSet?: boolean) => void;
  createBlankCard: (where: Surface) => string | null;
  addRandom: () => void;
  importFigJamStickiesFromCsv: (csvText: string) => number;
  clearAll: () => void;
  setFieldHeadText: (itemId: string, stepIndex: number, field: FieldName, text: string) => void;
  upgradeIssueRef: (parsed: IssueRef, source?: { itemId: string; stepIndex: number; field: FieldName }) => boolean;
  clearReveal: () => void;
};
