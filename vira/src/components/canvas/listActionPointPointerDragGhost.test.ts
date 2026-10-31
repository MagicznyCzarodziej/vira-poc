// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ACTION_DROP_OFFSET_Y, ACTION_POINT_WIDTH } from "../../domain/index.ts";
import {
  clearListActionPointDragGhost,
  listActionPointGhostTransform,
  syncListActionPointDragGhost,
} from "./listActionPointPointerDragGhost.ts";

describe("listActionPointGhostTransform", () => {
  it("matches canvas drop anchoring", () => {
    expect(listActionPointGhostTransform(500, 300)).toEqual({
      x: 500 - ACTION_POINT_WIDTH / 2,
      y: 300 - ACTION_DROP_OFFSET_Y,
    });
  });
});

describe("syncListActionPointDragGhost", () => {
  afterEach(() => {
    clearListActionPointDragGhost();
  });

  it("creates a fixed ghost that follows the pointer", () => {
    const source = document.createElement("article");
    source.className = "action-point-card";
    source.textContent = "Ship it";
    syncListActionPointDragGhost(source, 120, 80);
    const ghost = document.querySelector(".list-action-point-pointer-drag-ghost");
    expect(ghost).toBeTruthy();
    expect(ghost?.textContent).toContain("Ship it");
    expect(ghost?.getAttribute("aria-hidden")).toBe("true");
    const { x, y } = listActionPointGhostTransform(120, 80);
    expect((ghost as HTMLElement).style.transform).toBe(`translate(${Math.round(x)}px, ${Math.round(y)}px)`);

    syncListActionPointDragGhost(source, 200, 160);
    const { x: x2, y: y2 } = listActionPointGhostTransform(200, 160);
    expect((ghost as HTMLElement).style.transform).toBe(`translate(${Math.round(x2)}px, ${Math.round(y2)}px)`);
    expect(document.querySelectorAll(".list-action-point-pointer-drag-ghost")).toHaveLength(1);
  });

  it("clears the ghost from the document", () => {
    syncListActionPointDragGhost(document.createElement("article"), 0, 0);
    clearListActionPointDragGhost();
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
  });
});
