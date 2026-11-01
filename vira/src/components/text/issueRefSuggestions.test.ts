// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { normalizeStep } from "../../domain/steps.ts";
import type { Card } from "../../domain/types.ts";
import { issueRefButtons } from "./issueRefSuggestions.ts";

function card(id: string, problem: string): Card {
  return {
    id,
    tags: [],
    archivedAt: null,
    steps: [normalizeStep({ problem, answer: null })],
  };
}

describe("issueRefButtons", () => {
  it("excludes the host card from the item list", () => {
    const items = {
      "item-1": card("item-1", "First"),
      "item-2": card("item-2", "Second"),
    };
    const onPick = vi.fn();
    const buttons = issueRefButtons("!", items, onPick, { hostItemId: "item-1" });
    expect(buttons).not.toBeNull();
    const labels = buttons!.map((b) => b.querySelector(".issue-menu-id")?.textContent);
    expect(labels).not.toContain("!1");
    expect(labels).toContain("!2");
  });

  it("still lists steps on the host card when drilling into !num/", () => {
    const items = {
      "item-1": {
        ...card("item-1", "Q1"),
        steps: [
          normalizeStep({ problem: "Q1", answer: "A1" }),
          normalizeStep({ problem: "Q2", answer: "A2" }),
        ],
      },
    };
    const onPick = vi.fn();
    const buttons = issueRefButtons("!1/", items, onPick, { hostItemId: "item-1" });
    expect(buttons?.length).toBeGreaterThan(0);
  });
});
