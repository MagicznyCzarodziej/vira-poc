// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { applyCanvasDragTransform, clearCanvasDragTransform } from "./canvasDragPreview.ts";

describe("canvasDragPreview", () => {
  it("applies and clears translate on placed hosts", () => {
    document.body.innerHTML = `<div id="root"><div data-canvas-placed="a"></div></div>`;
    const root = document.getElementById("root")!;
    applyCanvasDragTransform(root, ["a"], { a: { x: 10, y: 20 } }, { x: 10, y: 20 }, { x: 30, y: 50 });
    const el = root.querySelector<HTMLElement>("[data-canvas-placed='a']")!;
    expect(el.style.transform).toBe("translate(20px, 30px)");
    clearCanvasDragTransform(root, ["a"]);
    expect(el.style.transform).toBe("");
  });
});
