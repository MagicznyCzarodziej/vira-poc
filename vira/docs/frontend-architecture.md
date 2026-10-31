# Vira frontend architecture

This document describes how the Vira web app is structured: tooling, layers, directories, and the patterns used to split responsibilities between UI, state, and domain logic.

## Stack and runtime model

| Piece | Choice |
| --- | --- |
| UI | React 19 (function components, hooks) |
| Bundler / dev server | Vite 8 |
| Language | TypeScript (strict, ES2022, `react-jsx`) |
| Client state | Zustand 5 |
| Styling | Plain CSS via `@import` cascade (no CSS-in-JS, no utility framework) |
| Tests | Vitest (domain and text helpers; `environment: "node"`) |

The app is a **single-page application** with no router: one root tree mounted from `src/main.tsx` into `#root`. There is no server-rendered React layer; persistence is **localStorage** on the client.

Entry flow:

1. `index.html` loads `/src/main.tsx` as an ES module.
2. `main.tsx` creates a React root, wraps `App` in `StrictMode`, and imports global styles from `src/styles/app.css`.
3. `App.tsx` composes the shell (header, main views, overlays); `components/app/useAppShellEffects.ts` wires document-level effects (body classes, ref-pick mode).

## Layered architecture

Code is organized into three cooperating layers. Dependencies generally flow **inward**: components and store may import domain; domain never imports React or Zustand.

```
┌─────────────────────────────────────────────────────────┐
│  UI (src/components, src/styles)                        │
│  React trees, DOM gestures, CSS, local UI hooks          │
└───────────────────────────┬─────────────────────────────┘
                            │ reads/writes via hooks,
                            │ calls domain pure functions
┌───────────────────────────▼─────────────────────────────┐
│  Store (src/store)                                      │
│  Zustand: document + panels; persistence scheduling      │
└───────────────────────────┬─────────────────────────────┘
                            │ mutates via domain ops
┌───────────────────────────▼─────────────────────────────┐
│  Domain (src/domain)                                    │
│  Types, invariants, card/step/ref logic, load/save       │
└─────────────────────────────────────────────────────────┘

        src/lib — small vendored/non-domain utilities
```

### Domain layer (`src/domain`)

Pure TypeScript: **no React**. This is the source of truth for business rules and document shape.

- **`types.ts`** — Core model: `Card`, `Step`, `Revision`, `Placement`, `Viewport`, `SavedDocument`, `IssueRef`, etc.
- **Feature modules** — Each file owns a slice of behavior, e.g. `steps.ts`, `cards.ts`, `refs.ts`, `tags.ts`, `canvas.ts`, `history.ts`, `diff.ts`.
- **`persistence.ts`** — Normalize, validate, and read/write `SavedDocument` to localStorage (`STORAGE_KEY` / `STORAGE_VERSION` from `constants.ts`).
- **`seed.ts` / `seedFixture.ts` / `fixtures.ts`** — Initial and demo data.
- **`index.ts`** — Public barrel: re-exports types and functions the UI and store are allowed to use.

Store actions typically: read current `items` / placements from state, call domain helpers to produce the next immutable-ish structures, then `set()` and `schedule()` a save.

Domain logic that must stay testable without a browser lives here. Vitest tests (e.g. `domain.test.ts`, `refFieldTokens.test.ts`) target these modules.

### Store layer (`src/store`)

Two Zustand stores split **document** vs **ephemeral panel UI**.

#### `useDocument` — primary application state

Defined in `useDocument.ts`. State type is `DocumentState` in `documentTypes.ts`: persisted fields from `SavedDocument` plus **session-only** fields (`editing`, `openComposer`, `followupDrafts`, `revealId`, etc.).

The store is composed from **slices** (each slice is a `StateCreator` fragment):

| Slice | File | Responsibility |
| --- | --- | --- |
| Edit / composer | `editSlice.ts` | Inline edit lifecycle, new decision composer, follow-up drafts |
| Cards / items | `cardSlice.ts` | Create, archive, tags, issue-ref upgrades, random/clear |
| Document UI prefs | `documentUiSlice.ts` | View mode, dates toggle, list filter, reveal animation flag |
| Canvas | `canvasSlice.ts` | Placements, viewport, z-order, remove from canvas |

Public store entry point: **`store/index.ts`** exports `useDocument`, `usePanels`, and shared types.

On startup:

1. `loadInitial()` reads from localStorage or falls back to `createDocumentFromSeed()`.
2. `persist(loaded)` writes once so the store and storage stay aligned.
3. Mutations call `schedule(get)` for debounced saves (250ms) via `documentPersistence.ts`; `beforeunload` calls `flush()` for a synchronous save.

Components subscribe with selectors, e.g. `useDocument((s) => s.viewMode)`, to limit re-renders.

Imperative call sites (gesture handlers, DOM listeners) often use `useDocument.getState().someAction()` to avoid hook rules inside non-React code.

#### `usePanels` — overlays and pickers

`usePanels.ts` holds UI that does not belong in the saved document:

- History drawer (`drawerRefId`)
- Issue-ref link picker session (`picker`: caret range, mode, optional card field context)

Opening the drawer closes the picker and vice versa. Small helpers `drawerOpen` / `pickerOpen` support derived checks outside components.

### UI layer (`src/components`, `src/styles`)

React components render views and attach behavior. Heavy or high-frequency DOM work is often extracted into **`bind*.ts` modules** that register listeners and return cleanup functions—used from `useEffect` in components or from app-shell hooks such as `useAppShellEffects`.

## Directory structure

```
vira/
├── index.html                 # SPA shell, font links
├── vite.config.ts             # Vite + Vitest
├── tsconfig*.json
├── docs/
│   └── frontend-architecture.md
└── src/
    ├── main.tsx               # React bootstrap
    ├── App.tsx                # Top-level layout
    ├── components/app/        # App-shell hooks (document body classes, ref-pick)
    ├── vite-env.d.ts
    ├── domain/                # Pure model + operations (see above)
    ├── store/                 # Zustand stores and persistence glue
    ├── lib/                   # e.g. fractional-indexing helper
    ├── styles/                # CSS modules-by-file, imported from app.css
    └── components/
        ├── Header.tsx
        ├── BoardView.tsx      # Board columns view
        ├── ListView.tsx       # List + canvas split view
        ├── CardView.tsx       # Card shell (list/canvas/panel surfaces)
        ├── Composer.tsx
        ├── Icons.tsx
        ├── card/              # Card innards: steps, tags, textarea, follow-up
        ├── canvas/            # Spatial canvas workspace + gestures
        ├── panels/            # History drawer, ref picker, issue preview
        │   └── history/       # History panel subcomponents and actions
        └── text/              # Rich text, mentions, ref autocomplete, selection toolbar
```

### View modes and composition

`SavedDocument.viewMode` is `"board"` | `"list"`. `App` switches the main region:

- **Board** — `BoardView`: kanban-style columns (“Needs decision” / “Answered”), shared list rendering via `CardView`.
- **List** — `ListView`: decision list beside `CanvasWorkspace` (list filter: all vs not on canvas).

Overlays are **siblings** of `main`, not nested routes:

- `HistoryDrawer`, `RefLinkPicker`, `IssuePreview`, `SelectionRefToolbar`

Global chrome: `Header` (view tabs, dates toggle, PoC data actions).

## Component patterns

### Surfaces

`CardView` accepts `surface: "list" | "canvas" | "panel"`. The same card UI is reused in the board/list, on the canvas, and inside the history panel—with `readOnly` when `surface === "panel"`. Edit targets (`EditTarget`) include `surface` so only one field edits at a time per surface/card.

Optional props tune behavior (`draggableToCanvas`, `historyEventIndex` for time-travel display).

### Card decomposition

- **`CardView`** — Layout, actions (archive, remove from canvas, open history), delegates fields.
- **`card/CardStep.tsx`** — Problem/answer rows, tentative toggle, archive controls.
- **`card/CardTags.tsx`**, **`FollowupField.tsx`**, **`AutoTextarea.tsx`** — Focused field editors with edit handoff between fields.

### Canvas subsystem (`components/canvas/`)

`CanvasWorkspace` owns refs to the scroll surface and wires:

- Viewport sync (zoom, scroll, initial centering) via effects + `useDocument`
- **`bindCanvasGestures`** — Pan, drag cards, zoom, spawn; coordinates with edit commit on pointer down outside cards
- **`bindCanvasRefLinks`** — Click/hover behavior for issue-ref links on canvas
- **`bindCanvasReveal`**, **`canvasDrop.ts`**, **`canvasCommands.ts`**, **`flyToCard.ts`** — Reveal animation, drag-from-list drop, zoom helpers
- **`FakeScrollbars.tsx`** — Custom scrollbar UI aligned with scaled world

Canvas state (`canvasPlacements`, `canvasViewport`) lives in the document store; geometry constants (`WORLD_W`, `WORLD_H`, `CARD_WIDTH`, …) live in domain.

### Text and issue references (`components/text/`)

Rich mention/ref UX is split between React and DOM:

- **`RichText.tsx`** — Renders parsed issue-ref markup
- **`useAutocomplete.ts`**, **`mentionMenu.ts`**, **`issueRefSuggestions.ts`** — `#tag` and `@`-style completion
- **`bindRefPickFromCard.ts`**, **`SelectionRefToolbar.tsx`** — Pick-a-ref mode from card text
- **`bindCanvasRefLinks.ts`** (canvas) and panel helpers — Navigation to targets

Parsing and staleness rules for refs remain in **`domain/refs.ts`** and related modules.

### Panels (`components/panels/`)

- **`HistoryDrawer`** — Revision timeline for a selected issue ref
- **`RefLinkPicker`** / **`RefLinkResults`** — Search and insert links while editing
- **`IssuePreview`** — Hover tip for refs
- **`history/`** — Panel-specific card chrome, selection, “reveal in list” actions

Panel open state is **`usePanels`**; content still reads card data from **`useDocument`**.

### `data-action` attributes

Interactive controls often expose stable `data-action="..."` hooks. These serve two purposes:

1. **CSS** — e.g. history diff styles targeting `[data-action="goto-issue"]`
2. **Event routing** — Gesture/bind code uses `closest("button, [data-action]")` to distinguish clicks on controls vs card body (start drag, commit edit, ref pick)

React `onClick` handlers still perform the work; `data-action` is primarily for semantics and non-React listeners.

### Imperative `bind*` modules

Pattern: `export function bindSomething(root: HTMLElement, ...): () => void`

- Register native listeners (pointer, wheel, focus)
- Read/write **`useDocument.getState()`** / **`usePanels`**
- Return teardown for `useEffect`

Examples: `bindCanvasGestures`, `bindRefPickFromCard`, `bindAutocomplete` (textarea lifecycle).

This keeps React components declarative while avoiding re-render churn for pan/zoom/drag.

## Styling architecture

- Single entry: **`styles/app.css`** imports a ordered list of concern-based files (`base`, `layout`, `board`, `card`, `canvas`, `history-*`, `issue-ref`, …).
- **No component-scoped CSS modules** — class names are global; BEM-like suffixes (`btn-delete--archive`, `field-remove-btn--problem`) group variants.
- **Body/document classes** toggled from `useAppShellEffects` for cross-cutting modes: `show-dates`, `issue-ref-panel-open`, `ref-pick-active`.

## Data flow (typical edit)

1. User focuses a field → `CardView.start` → `beginEdit(target)` sets `editing` + `editInitial`.
2. User types → controlled/local textarea value; optional autocomplete `bind*` on the element.
3. Commit → `commitEdit(value)` in `editSlice` calls domain recorders (`recordProblemEdit`, `recordAnswerEdit`, tag parsing, etc.), updates `items`, clears `editing`, calls `schedule(get)`.
4. `documentPersistence` debounces → `saveDocument` in domain persists normalized JSON to localStorage.

Canvas moves and viewport changes follow the same pattern through `canvasSlice` + `schedule`.

## Import conventions

- **Explicit `.ts` / `.tsx` extensions** in imports (required by `verbatimModuleSyntax` / bundler resolution).
- UI imports domain via **`../domain/index.ts`** (barrel only—no deep domain paths from components).
- UI imports store via **`../store/index.ts`** (`useDocument`, `usePanels`, `EditTarget`, `Surface`, etc.).
- Pure ref-picker row building and ref token normalization live in **`domain/refLinkRows.ts`** and **`domain/refFieldTokens.ts`**.

## Testing and quality

- **`npm test`** — Vitest; domain and pure text suggestion tests.
- **`npm run build`** — `tsc -b` then `vite build`; strict TS (`noUnusedLocals`, `noUnusedParameters`, etc.).

## What is intentionally out of scope (today)

- No React Router or code-split lazy routes (small bundle, single view switch).
- No global async data layer (fetch/React Query)—document is local-first.
- No shared component library package; all UI lives under `src/components`.

## Mental model for new work

| If you are adding… | Prefer… |
| --- | --- |
| A rule about cards, steps, or refs | `src/domain` + export from `index.ts` if public |
| Persisted document fields | Extend `SavedDocument` / normalization in `persistence.ts`, then slice + UI |
| Session-only UI (modal, picker) | `usePanels` or local component state |
| High-frequency pointer/scroll behavior | `bind*.ts` + thin React wrapper |
| New visual area | Component under the closest folder (`card/`, `canvas/`, `panels/`, `text/`) + CSS file imported from `app.css` |

Keeping domain pure and the store thin makes the React tree mostly a projection of `SavedDocument` plus a small set of editing and panel flags—which keeps the PoC easy to evolve toward sync or a backend later without rewriting card logic.
