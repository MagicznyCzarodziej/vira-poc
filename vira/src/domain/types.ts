export type FieldName = "problem" | "answer";

export type Revision = {
  rev: number;
  text: string;
  at: string;
  tentative?: boolean;
  archived?: boolean;
};

export type Step = {
  problem: string;
  answer: string | null;
  answerTentative: boolean;
  decidedAt: string | null;
  /** Linked action points — not stored in answer prose. */
  actionPointRefs?: string[];
  problemRevisions: Revision[];
  answerRevisions: Revision[];
  problemRev: number;
  answerRev: number;
  archivedAt: string | null;
  answerArchivedAt: string | null;
};

export type Card = {
  id: string;
  tags: string[];
  archivedAt: string | null;
  steps: Step[];
};

export type Placement = {
  x: number;
  y: number;
  order?: string;
};

/** One card on the canvas; `itemId` is the shared decision card (key may differ when duplicated). */
export type CardCanvasPlacement = Placement & {
  itemId?: string;
};

export type Viewport = {
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
};

export type ViewMode = "board" | "list";

export type ActionPoint = {
  id: string;
  title: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
};

export type Frame = {
  id: string;
  title: string;
  createdAt: string;
};

export type FramePlacement = Placement & {
  width: number;
  height: number;
  /** Explicit canvas nesting (Figma-style parent frame). */
  parentFrameId?: string | null;
};

import type { NoteColor } from "./noteColors.ts";

export type { NoteColor };

export type Note = {
  id: string;
  body: string;
  color: NoteColor;
  createdAt: string;
};

export type NotePlacement = Placement & {
  width: number;
  height: number;
};

export type SavedDocument = {
  version: 1;
  nextId: number;
  nextActionPointId: number;
  items: Record<string, Card>;
  actionPoints: Record<string, ActionPoint>;
  actionPointPlacements: Record<string, Placement>;
  nextFrameId: number;
  frames: Record<string, Frame>;
  framePlacements: Record<string, FramePlacement>;
  nextNoteId: number;
  notes: Record<string, Note>;
  notePlacements: Record<string, NotePlacement>;
  viewMode: ViewMode;
  showAllDates: boolean;
  listFilterNotOnCanvas: boolean;
  /** When set, decisions list shows only cards with this tag (normalized). */
  listFilterTag: string | null;
  sidebarHidden: boolean;
  /** Collapsed accordion keys (`list-section@…`, etc.). */
  accordionCollapsed: string[];
  nextCanvasPlacementId: number;
  canvasPlacements: Record<string, CardCanvasPlacement>;
  canvasViewport: Viewport;
  canvasViewportUserSet: boolean;
};

export type StepResolutionContext = {
  actionPoints?: Record<string, ActionPoint>;
};

export type IssueRef = {
  itemId: string;
  stepIndex: number | null;
  focusAnswer: boolean;
  revision: number | null;
};

export type StaleReason =
  | "missing"
  | "card-archived"
  | "step-archived"
  | "answer-archived"
  | "revision";

export type CardStatusClass = "card-incomplete" | "card-partial" | "card-complete";

export type DocBag = {
  nextId: number;
  nextCanvasPlacementId: number;
  items: Record<string, Card>;
  canvasPlacements: Record<string, CardCanvasPlacement>;
};
