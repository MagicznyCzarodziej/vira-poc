# Vira — Product requirements (PoC)

**Purpose:** Describe what the app must *do* so it can be rebuilt with new code and structure while preserving the same user-visible behavior and persisted meaning.

**Language:** Use terms from [`../GLOSSARY.md`](../GLOSSARY.md).  
**Visual status colors:** Informative guide in [`ui-color-notes.md`](ui-color-notes.md) (not logic requirements).

**Out of scope:** Authentication, multi-user sync, server backend, export/import UI, upgrading old saved data from other formats.

---

## 1. Product summary

**Vira** is a local-first **decision log**. Each **decision (card)** has a stable public id (`!1`, `!2`, …), optional **tags**, one or more **steps** (question + optional live **decision** text), and **revision history** for each text field.

Users can:

- View cards on a **board** (two columns) or in **list view** (scrollable list plus a spatial **canvas**).
- Edit inline, add follow-up questions, mark decisions **tentative**, and **archive** at card, question, or decision level.
- Link decisions with **`!` references**, optional revision **pins** (`@vN`), `@mentions`, and `#tags` in text.
- Place cards on the canvas, pan/zoom, reorder stacking, and see visual links between referenced cards on the canvas.

All data for the PoC lives in the browser (single saved document). There is **no migration path**: if the saved document is missing, corrupt, or not the expected version, the app replaces it with built-in **sample data** and saves that.

---

## 2. What must be saved vs session-only

### 2.1 Saved document (version 1)

The app must persist one JSON document including:

| Area | Must include |
|------|----------------|
| Identity | Document version number (only **1** is supported). |
| Cards | All non-archived and archived cards, each with id, tags, archive timestamp (if archived), and ordered steps. |
| Steps | Question text, live decision text (or empty), tentative flag, decision timestamp when filled, per-field revision lists and “current revision” pointers, question/decision archive timestamps when archived. |
| UI prefs | Board vs list view, whether decision dates are shown on cards, list filter (all vs not on canvas). |
| Canvas | Per-card placement: x/y in a large fixed world, stacking order key, plus viewport scroll and zoom and whether the user has manually set the viewport. |
| Id generation | A counter for new card ids; on load, the app must ensure new ids cannot collide with existing card ids (numeric part of id). |

Save should be **debounced** (on the order of a few hundred ms) after changes, and flushed when the user leaves the page.

### 2.2 Not saved

Must not rely on persistence for: open “new decision” composer, follow-up question drafts, open history drawer state, hover previews, drag/pan/zoom gestures in progress, focus/edit handoff between fields, or reference-picker UI state.

### 2.3 Load behavior

- Valid version-1 document → load cards, preferences, canvas placements and viewport; normalize tags (lowercase, dedupe); drop canvas placements for **archived** cards; clamp placements inside the canvas world; ensure every placed card has a stacking order key.
- Anything else → load **sample data** (same as first visit), save, and continue.

---

## 3. Card and step model (behavioral)

### 3.1 Card

- Each card has a unique id; the UI shows the numeric part with a **`!` prefix**.
- **Tags** are a list of strings; whenever tags are entered or loaded, they must be trimmed, lowercased, and deduplicated.
- **Archive card:** card disappears from live board, list, canvas, and reference targets; history remains reachable from past links and the history drawer. All steps and decisions on that card are archived in history; canvas placement is removed.

### 3.2 Step

- A step has one **question** and at most one **live decision**.
- **Undecided:** no live decision text; UI shows placeholder **Add decision**.
- **Decided:** non-empty live decision text; optional **tentative** flag (⚑). Tentative counts as decided for display but **not** as fully settled for board/column and card completion styling.
- **Follow-up:** user can add another step with a new question; previous steps remain.

### 3.3 Revisions

- Each edit to question or decision text that actually changes content appends a new **revision** (numbered v1, v2, … with timestamp).
- The app always knows which revision is **current** for each field.
- **Archive** on a field appends a revision marked removed (empty content), clears live text where applicable, and sets the appropriate archive timestamp. UI shows removed fields as “(removed)” in history while keeping older revisions visible.
- Restoring decision text after archive (new non-empty edit) clears decision archive and appends a normal revision.

### 3.4 Which steps count as “active”

- Archived questions are not shown on the main card UI but remain in history.
- Board status, list completion styling, and “needs decision” logic use **active steps only** (non-archived questions).

---

## 4. Completion, board columns, and card appearance

### 4.1 Step states (for logic)

| State | Meaning |
|-------|---------|
| Undecided | No live decision, or decision archived with nothing live. |
| Decided | Live non-empty decision, not decision-archived. |
| Fully settled | Decided and **not** tentative. |

### 4.2 Board view

Two columns only:

| Column | Cards shown |
|--------|-------------|
| **Needs decision** | Live cards where at least one active step is not fully settled. |
| **Answered** | Live cards where every active step is fully settled. |

The **new decision** entry (composer) appears only in the Needs decision column.

### 4.3 Card status (list, board, canvas)

Among active steps:

- **None decided** → strong “open” styling (see color notes).
- **Some but not all fully settled** → partial styling.
- **All fully settled** → complete styling.

Tentative decisions prevent “complete” and “Answered” until cleared or finalized (toggle off tentative).

---

## 5. Views and chrome

### 5.1 Header

- App name **Vira**.
- Switch **Board** | **List**.
- **Dates** toggle: when on, show formatted decision dates on filled decisions; when off, hide them.
- PoC affordances: load **random sample cards**, **clear all** (with confirmation), indicator that data is stored locally only.

### 5.2 Board view

- Two columns as in §4.2; full card interaction; no canvas.

### 5.3 List view

- **Decisions** list (all live cards by default), sorted by **numeric card number** ascending (not plain string sort).
- Filter: **All** | **Not on canvas** (only cards with no canvas placement).
- **Canvas** area beside or below list (layout is flexible; behavior is not): large pannable/zoomable surface, spawn control, zoom controls.
- Padding and density should feel consistent (comfortable margins; list mode uses full viewport height without double scrollbars where possible).

---

## 6. Card UI and interactions

### 6.1 Card content

- Header: card id control opens **whole-card history**; editable tag row (comma-separated in edit mode).
- Per step: editable question; editable decision or empty placeholder; controls to archive question (only if more than one active step remains), archive decision, toggle tentative when decided.
- **Follow-up** field: expands on hover/focus or when non-empty; draft text is session-only until committed.

### 6.2 List vs canvas copy

- Same information on list and canvas instances of a card.
- On canvas: **remove from canvas** (does not archive the card).
- On list: drag-to-canvas only if the card is **not** already placed; if already on canvas, attempting list drag gives clear feedback (e.g. shake) and does not start a drag.

### 6.3 Creating cards

- **Board:** composer under Needs decision column.
- **List:** root composer when opened.
- **Canvas spawn control:** click → new card centered in current viewport, focus question on canvas; drag → drop on list creates card in list, drop on canvas places at drop position.
- **Keyboard:** **`C`** when not typing in a field and pointer was recently over canvas → new card at that position on canvas.

New card from composer: non-empty first question creates card and focuses the new card’s decision field; empty dismisses composer.

---

## 7. Editing rules

### 7.1 Inline editing

- Click-to-edit on tags, questions, and decisions.
- Tags commit on Enter or blur.
- Questions: empty commit must not wipe an existing question; non-empty commit records a revision if text changed.
- Decisions: non-empty commit records revision and clears decision archive; **empty commit** after there was text or decision history must **archive the decision** (same outcome as trash), not silently delete history.

Escape cancels the current edit without saving.

### 7.2 Focus handoff

- User must be able to click from one editable field to another (including follow-up and canvas/list/panel) with **one click**: first field commits, second opens for edit without requiring a second click.
- Click outside should commit open edits appropriately; clicking the spawn control while editing must not break spawn drag behavior.
- While dragging a new card from spawn, in-flight text edits should be saved without tearing down the drag.

### 7.3 Composer and follow-up

- Composer: Enter submits when appropriate; typing `#tag` at cursor can confirm tag without submitting whole composer.
- Follow-up: non-empty + Enter or leaving field adds step and may focus the new step’s decision field; empty blur adds nothing.

### 7.4 Autocomplete in text fields

Shared menu while typing in question/decision/composer fields:

| Trigger | Offers |
|---------|--------|
| `@` + text | Handles already used anywhere in stored text (not a fixed directory). |
| `!` + text | Linkable live cards, steps, and decisions matching prefix. |
| `#` + text | Known tags. |

Arrow keys navigate; Enter/Tab accept; Escape closes. Mouse choice inserts without losing textarea focus.

Inserting a reference from picker or autocomplete should default to a **pinned** link at the target’s current revision.

---

## 8. Decision references and rich text

### 8.1 Reference syntax (user-visible)

- Whole card: `!12`
- Question on step *n* (1-based in syntax): `!12/2`
- Decision on step *n*: `!12/a2`
- Optional pin: `@v3` on any form
- Markdown link: `[label](!12@v3)`

**`#` followed by digits is not a decision id** — hash words are tags. Decision links use **`!` only**.

### 8.2 Rendering text

- Safe rendering (no script injection).
- `#tags` and `@mentions` visually distinct from body text; `@vN` in references is not treated as a mention.
- Decision references become clickable controls in rendered text.

### 8.3 Staleness

A reference may be stale when:

| Situation | User-facing notion |
|-----------|-------------------|
| Target card or step missing | Missing |
| Target archived | Archived (card, question, or decision as appropriate) |
| Pin points at old revision | Out of date vs current text |

Stale links must be visually distinguishable and explained in preview/drawer.

**Shift+click** on a stale link in editable context should rewrite the link to pin the **current** revision (upgrade).

**Ctrl/⌘+click** opens/reveals target in workspace: scroll list to card; if placed, center canvas on that card.

### 8.4 Reference picker

From text selection (toolbar): panel to search/filter by kind, tags, and text; insert markdown link with pin at current revision.

### 8.5 Hover preview

Short delay before tooltip; read-only snippet; stale footer; stable enough to interact without flicker (brief lock after click/hover).

### 8.6 History drawer

Opened from reference or card id:

- Read-only view of target card.
- Per-field revision list and whole-card timeline.
- For pinned stale refs: diff between pinned text and current head; control to upgrade pin.
- Escape closes drawer.

---

## 9. Archive and removal (requirements)

| User action | Required outcome |
|-------------|------------------|
| Archive card | Card archived; steps/decisions archived in history; removed from canvas; follow-up draft cleared |
| Archive question | Question archived; blocked if it is the last active question |
| Archive decision (trash or clear all decision text and commit) | Decision archived in history; live decision cleared; tentative cleared |
| Remove from canvas | Placement only; card unchanged |

Pickers, autocomplete, and “live” link targets must only offer **non-archived** cards and fields that still exist for linking.

---

## 10. Canvas (requirements)

### 10.1 Space

- Fixed large world (on the order of tens of thousands of pixels per axis); card positions clamped so cards stay inside.
- Card width fixed for layout; drop from list/spawn positions card near pointer (slightly below center is acceptable).

### 10.2 Viewport

- Pan and zoom; zoom range roughly 5%–250%; zoom-at-cursor with modifier+wheel; on-screen +/- and reset showing **rounded percent**.
- Remember scroll and zoom across sessions; if user has never adjusted viewport, auto-center sensibly on first show; if they have, restore their view across UI refreshes.

### 10.3 Manipulation

- Pan: middle mouse, space+drag, or background drag (not when interacting with card content).
- Drag placed card: move in world space; small movement threshold before treating as drag; suppress accidental click after drag.
- Bring moved or newly placed card to front of stack.
- Stacking order must be stable and reorderable without renumbering all cards (fractional or equivalent ordering is fine).

### 10.4 List ↔ canvas

- Drag from list onto canvas places card.
- Cross-highlight when hovering list entry and canvas copy of same card (and vice versa).
- When hovering a decision link on a canvas card, if target is also on canvas, show a dashed line between card bounds.

### 10.5 Scrollbars

If native scrollbars are hidden, provide usable custom scroll indicators that fade when idle and support drag.

---

## 11. PoC sample actions

- **Random cards:** inject a rich fixture set (tags, refs, multi-step, canvas positions) for demo.
- **Clear all:** confirm, then empty cards and canvas state and reset viewport.

No raw JSON debug dump in the UI.

---

## 12. Fixed product decisions

These are intentional for the PoC; a reimplementation should match them:

1. List sort by **numeric** card id, not lexicographic string order.
2. Tags always lowercase and deduplicated whenever saved or loaded.
3. Clearing a decision in the editor archives it when there was content or history (same as trash).
4. Archived cards never appear on canvas; saved placements for archived cards are dropped on load.
5. Board columns and card completion colors follow [`ui-color-notes.md`](ui-color-notes.md).
6. No backwards compatibility for older save formats—only version 1, else sample data.

---

## 13. Acceptance checklist

Use this to verify a rebuild matches intent:

- [ ] Local save/load version 1; invalid save → sample data; debounced save and flush on exit
- [ ] Cards, steps, revisions, tentative flag, archive at three levels
- [ ] Board Needs decision / Answered; list sort and Not on canvas filter
- [ ] Inline edit, focus handoff, composer, follow-up, tag normalization
- [ ] Rich text: `!` refs, pins, staleness, preview, drawer, picker, upgrade and reveal shortcuts
- [ ] Canvas: world bounds, pan/zoom, drag, z-order, spawn, list drag, ref lines, cross-highlight
- [ ] Remove from canvas vs archive card; list drag blocked when already on canvas
- [ ] Header: Vira, views, dates toggle, random/clear PoC actions
- [ ] Visual status per ui-color-notes (informative parity)

---

*For a map of the current reference implementation’s symbols, see [`APPENDIX-FUNCTION-INDEX.md`](APPENDIX-FUNCTION-INDEX.md) (optional, not required for recreation).*
