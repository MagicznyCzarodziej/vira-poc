import { describe, expect, it } from "vitest";
import {
  accordionCollapseKey,
  isAccordionCollapsed,
  normalizeAccordionCollapsed,
  toggleAccordionCollapsedKey,
} from "./accordionCollapse.ts";

describe("accordionCollapse", () => {
  it("builds stable keys for list sections and canvas hosts", () => {
    expect(accordionCollapseKey({ kind: "listSection", section: "actions" })).toBe("list-section@actions");
    expect(accordionCollapseKey({ kind: "card", itemId: "item-1" })).toBe("card@item-1");
    expect(
      accordionCollapseKey({ kind: "card", itemId: "item-1", canvasPlacementKey: "canvas-9" }),
    ).toBe("card@canvas-9");
    expect(accordionCollapseKey({ kind: "actionPoint", actionPointId: "ap-1" })).toBe("ap@ap-1");
  });

  it("toggles collapsed membership", () => {
    expect(toggleAccordionCollapsedKey([], "card@a")).toEqual(["card@a"]);
    expect(toggleAccordionCollapsedKey(["card@a"], "card@a")).toEqual([]);
    expect(isAccordionCollapsed(["card@a"], "card@a")).toBe(true);
  });

  it("normalizes persisted collapsed keys", () => {
    expect(normalizeAccordionCollapsed(["card@1", 2, ""])).toEqual(["card@1"]);
  });
});
