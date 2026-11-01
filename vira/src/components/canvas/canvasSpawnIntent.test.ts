// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { isCanvasPlacementEditing } from "../../store/editTarget.ts";
import { useDocument } from "../../store/useDocument.ts";
import { placeCenteredCard } from "./canvasCommands.ts";
import { createRef } from "react";

describe("canvas spawn intents", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("scopes question spawn edit to the new canvas placement", () => {
    const surface = document.createElement("div");
    Object.defineProperty(surface, "clientWidth", { value: 800 });
    Object.defineProperty(surface, "clientHeight", { value: 600 });
    surface.getBoundingClientRect = () =>
      ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const ref = createRef<HTMLDivElement>();
    ref.current = surface;

    placeCenteredCard(ref, { current: 0 }, "question");

    const editing = useDocument.getState().editing;
    const id = editing?.id;
    expect(id).toBeTruthy();
    expect(editing?.field).toBe("problem");
    expect(editing?.canvasPlacementKey).toBe(id);
    expect(isCanvasPlacementEditing(editing, id!, id!, "problem", 0)).toBe(true);
    expect(isCanvasPlacementEditing(editing, id!, id!, "answer", 0)).toBe(false);
  });

  it("scopes decision spawn edit to the answer field on canvas", () => {
    const surface = document.createElement("div");
    Object.defineProperty(surface, "clientWidth", { value: 800 });
    Object.defineProperty(surface, "clientHeight", { value: 600 });
    surface.getBoundingClientRect = () =>
      ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const ref = createRef<HTMLDivElement>();
    ref.current = surface;

    placeCenteredCard(ref, { current: 0 }, "decision");

    const editing = useDocument.getState().editing;
    const id = editing?.id;
    expect(editing?.field).toBe("answer");
    expect(isCanvasPlacementEditing(editing, id!, id!, "answer", 0)).toBe(true);
    expect(isCanvasPlacementEditing(editing, id!, id!, "problem", 0)).toBe(false);
  });
});
