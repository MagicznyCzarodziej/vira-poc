import { describe, expect, it } from "vitest";
import { cardHasTag, itemMatchesListTagFilter, liveItemIdsWithTag } from "./listTagFilter.ts";
import type { Card } from "./types.ts";

const card = (tags: string[]): Card => ({
  id: "item-1",
  tags,
  archivedAt: null,
  steps: [{ problem: "?", answer: null, answerTentative: false, decidedAt: null, problemRevisions: [], answerRevisions: [], problemRev: 0, answerRev: 0, archivedAt: null, answerArchivedAt: null }],
});

describe("listTagFilter", () => {
  it("matches tags case-insensitively", () => {
    expect(cardHasTag(card(["Allegro"]), "allegro")).toBe(true);
    expect(itemMatchesListTagFilter(card(["Allegro"]), "allegro")).toBe(true);
    expect(itemMatchesListTagFilter(card(["Allegro"]), null)).toBe(true);
    expect(itemMatchesListTagFilter(card(["Allegro"]), "ux")).toBe(false);
  });

  it("collects live item ids for a tag", () => {
    const items = {
      "item-1": card(["a"]),
      "item-2": { ...card(["b"]), id: "item-2" },
      "item-3": { ...card(["a", "b"]), id: "item-3" },
    };
    expect(liveItemIdsWithTag(items, "a").sort()).toEqual(["item-1", "item-3"]);
  });
});
