import { describe, expect, it } from "vitest";
import { normalizeStep } from "./steps.ts";
import { refLinkRows } from "./refLinkRows.ts";
import type { Card } from "./types.ts";

function decisionOnlyCard(id: string, answer: string): Card {
  return {
    id,
    tags: [],
    archivedAt: null,
    steps: [normalizeStep({ problem: "", answer })],
  };
}

describe("refLinkRows", () => {
  it("uses decision text for card row when question is empty", () => {
    const items = { "item-7": decisionOnlyCard("item-7", "Ship REST first") };
    const groups = refLinkRows(items, "REST", "all", []);
    expect(groups).toHaveLength(1);
    const cardRow = groups[0]!.rows.find((row) => row.kind === "card");
    expect(cardRow?.question).toBe("Ship REST first");
    expect(cardRow?.answer).toBe("Ship REST first");
  });

  it("omits question rows when step has no problem text", () => {
    const items = { "item-7": decisionOnlyCard("item-7", "Ship REST first") };
    const groups = refLinkRows(items, "", "question", []);
    const questionRows = groups.flatMap((g) => g.rows.filter((row) => row.kind === "question"));
    expect(questionRows).toHaveLength(0);
  });

  it("still exposes answer rows for decision-only steps", () => {
    const items = { "item-7": decisionOnlyCard("item-7", "Ship REST first") };
    const groups = refLinkRows(items, "", "answer", []);
    const answerRows = groups.flatMap((g) => g.rows.filter((row) => row.kind === "answer"));
    expect(answerRows).toHaveLength(1);
    expect(answerRows[0]?.answer).toBe("Ship REST first");
  });
});
