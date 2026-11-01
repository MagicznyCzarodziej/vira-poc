// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "./useDocument.ts";

describe("documentUiSlice", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("toggles list section accordion keys", () => {
    useDocument.getState().toggleAccordionCollapsed("list-section@decisions");
    expect(useDocument.getState().accordionCollapsed).toEqual(["list-section@decisions"]);
  });

  it("toggles sidebar visibility", () => {
    expect(useDocument.getState().sidebarHidden).toBe(false);
    useDocument.getState().toggleSidebarHidden();
    expect(useDocument.getState().sidebarHidden).toBe(true);
    useDocument.getState().setSidebarHidden(false);
    expect(useDocument.getState().sidebarHidden).toBe(false);
  });
});
