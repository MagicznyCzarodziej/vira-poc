// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { shouldToggleListSidebarShortcut } from "./bindListSidebarShortcut.ts";

describe("bindListSidebarShortcut", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    useDocument.getState().setView("list");
  });

  it("matches S in list view", () => {
    const event = new KeyboardEvent("keydown", { key: "s", bubbles: true });
    expect(shouldToggleListSidebarShortcut(event)).toBe(true);
  });

  it("ignores mod+S", () => {
    const event = new KeyboardEvent("keydown", { key: "s", metaKey: true, bubbles: true });
    expect(shouldToggleListSidebarShortcut(event)).toBe(false);
  });

  it("ignores when not in list view", () => {
    useDocument.getState().setView("board");
    const event = new KeyboardEvent("keydown", { key: "s", bubbles: true });
    expect(shouldToggleListSidebarShortcut(event)).toBe(false);
  });
});
