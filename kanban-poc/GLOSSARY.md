# Vira (Kanban PoC)

A local-first workspace for recording **decisions** as cards: each card holds one or more question→answer **steps**, optional **tags**, cross-links to other decisions, and an optional spatial **canvas** layout alongside a list or board view.

**Persistence:** one `localStorage` document at schema version **1**. There is no migration or upgrade path—invalid saves are replaced with the built-in seed data. Normative behavior lives in [`docs/SPEC.md`](docs/SPEC.md).

## Language

**Decision (card)**  
A persisted record identified as `!N` in the UI (internal id `item-N`). It is the unit of archive, canvas placement, and list/board membership.  
_Avoid_: Issue, ticket, task (unless referring to Allegro fixture copy).

**Question**  
The problem text on a step—the thing being decided.  
_Avoid_: Problem (in user-facing copy; “problem” remains the internal field name).

**Decision (answer)**  
The resolved outcome text for a step. Empty means undecided. The UI placeholder for an empty answer is **Add decision**.  
_Avoid_: Answer alone in product copy when you mean the final decision field.

**Step**  
One question and at most one live decision on a card. Follow-up questions append new steps.  
_Avoid_: Timeline row, QA pair (implementation terms).

**Revision**  
An immutable snapshot of a question or decision field at a point in time, numbered `v1`, `v2`, … with a timestamp. Edits append revisions; archive appends an empty **removed** head revision.  
_Avoid_: Version (except in `@vN` reference syntax), edit history entry.

**Pinned reference**  
A link to another decision that includes `@vN`, freezing which revision was meant. Unpinned links track the target’s current head revision.  
_Avoid_: Frozen link, snapshot link.

**Stale link**  
A pinned reference whose target revision, step, answer, or whole card no longer matches reality (including archive).  
_Avoid_: Broken link (use “missing” only when the target does not exist).

**Archive**  
Soft-delete: the data stays for history and link resolution, but the card or field no longer appears in live lists, pickers, or canvas. Never hard-deleted in normal use.  
_Avoid_: Delete (except the dismiss control that means “remove from canvas”).

**Canvas placement**  
A card’s position and stacking order on the spatial canvas; independent of whether the card appears in the list.  
_Avoid_: Pin, node (graph sense).

**Not on canvas (filter)**  
List filter showing only live cards that have no active canvas placement.  
_Avoid_: Unplaced, off-board.

**Tentative decision**  
A filled decision marked with the flag icon (⚑) as needing refinement; the step is not treated as fully resolved for board column or card-complete styling.  
_Avoid_: Draft answer, WIP.

**Mention**  
An `@handle` token in text, styled for readability; handles are discovered from existing text, not a fixed directory.  
_Avoid_: Assignee, user tag.

**Tag**  
A `#label` chip on a card (or composer), used for filtering reference search. Tags are **lowercase and deduped** whenever they are entered, edited, or loaded.  
_Avoid_: Label, category (generic).

**Decision reference (`!`)**  
Cross-link syntax in text: `!12`, `!12/2` (question on step 2), `!12/a2` (decision on step 2), optional pin `@v3`. Markdown form `[label](!12@v3)`. `#` in text is for **tags**, not decision ids.  
_Avoid_: Issue link, hash ref.

**Reference picker**  
Side panel to insert a markdown link to another decision (whole card, question, or decision field), with optional revision pin.  
_Avoid_: Link dialog, issue picker.

**History drawer**  
Side panel opened from a reference or card id, showing revisions, whole-card timeline, and diff for stale pins.  
_Avoid_: Issue drawer, detail modal.

**Board view**  
Two columns: **Needs decision** vs **Answered**, driven by whether all active steps are fully resolved (non-tentative).  
_Avoid_: Kanban (generic).

**List view**  
Split workspace: scrollable decision list plus spatial canvas.  
_Avoid_: Workspace mode (internal class name `list`).

**Spawn control**  
The card-icon control on the canvas: click creates a card at viewport center; drag to list or canvas creates a card at drop target.  
_Avoid_: Add button, FAB.
