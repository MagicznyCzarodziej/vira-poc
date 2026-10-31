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

export type SavedDocument = {
  version: 1;
  nextId: number;
  nextActionPointId: number;
  items: Record<string, Card>;
  actionPoints: Record<string, ActionPoint>;
  actionPointPlacements: Record<string, Placement>;
  viewMode: ViewMode;
  showAllDates: boolean;
  listFilterNotOnCanvas: boolean;
  canvasPlacements: Record<string, Placement>;
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
  items: Record<string, Card>;
  canvasPlacements: Record<string, Placement>;
};
