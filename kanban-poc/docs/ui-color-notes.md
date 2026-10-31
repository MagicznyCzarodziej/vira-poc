# UI color & status (PoC — matches `index.html`)

This document describes **visual status and color** for parity when rebuilding UI. Behavior requirements are in [`SPEC.md`](SPEC.md); domain terms in [`../GLOSSARY.md`](../GLOSSARY.md).

## Page chrome

| Token / element | Value |
|-----------------|--------|
| Page background | `--page` `#d4d4d8` |
| App surfaces | `--bg` `#ffffff`, `--surface` `#d4d4d8` |
| Neutrals | `--tone-1` `#f4f4f5` … `--tone-3` `#c4c4c8` |
| Body text | `--text` `#09090b`, muted `--muted` `#71717a` |
| Canvas | `--canvas-bg` `#e5e5e7` |
| Font | Inter, 14px base, weight 500 |

## Board columns (not RAG labels)

Two columns only:

| Column | Header | Column dot | Cards shown |
|--------|--------|------------|-------------|
| Needs decision | “NEEDS DECISION” | dark (`--text`) | `itemNeedsDecision(item)` — at least one active step not fully resolved (includes **tentative** decisions) |
| Answered | “ANSWERED” | faint (`--faint`) | All active steps fully resolved and non-tentative |

There are **no** separate “Open / In progress / Resolved” column labels in the UI.

## Card status classes (list, board, canvas)

Derived from **active steps only** via `cardStatusClass(item)`:

| Class | When | Card shell background |
|-------|------|------------------------|
| `card-incomplete` | No active step has a decision | `--question-bg` `#ffad9f` (coral) on whole card |
| `card-partial` | Some but not all steps fully resolved | `--tone-1` `#f4f4f5`; header/tags use question coral |
| `card-complete` | Every active step fully resolved | `--answer-card-bg` `#c8f5d0` on shell; header/tags match |

### Question & decision fields inside a card

| Region | Typical background |
|--------|-------------------|
| Question (`.problem`) | On incomplete/partial cards: inherits coral header area; on complete cards: `--answer-bg` `#afe9b9` when step is answered |
| Filled decision (`.answer-block`) | `--answer-bg` `#afe9b9` |
| Empty decision slot | Hidden when step unanswered except placeholder “Add decision”; uses `--tone-1` when shown |
| **Tentative** decision (⚑) | `--answer-tentative-bg` `#fef3c7` on `.answer-block.answer-marked` |

Cards are **not** white with a small accent bar; status is communicated by **tinted card and Q/A regions**, plus board column membership and the tentative flag.

## Non-color cues (accessibility)

- **Tentative:** ⚑ button (`aria-pressed`) and amber tentative background.
- **Stale decision links:** `.issue-ref-stale` styling + “Stale link” in preview/drawer; Shift+click to upgrade pin.
- **Archive:** trash controls on question/decision/card (not color-only).
- **Dates:** optional “Dates” header toggle (`body.show-dates`) reveals decision dates on answers.

## Design references (informative)

These informed contrast and “don’t rely on color alone” thinking; the PoC does **not** fully implement their white-card + RAG label pattern:

- [WCAG 2.2 — Use of Color (1.4.1)](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
- [MDN — Use of color](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color)
- [USWDS — Using color](https://designsystem.digital.gov/design-tokens/color/overview/)

When changing styling, update **this file and `index.html` tokens together**.
