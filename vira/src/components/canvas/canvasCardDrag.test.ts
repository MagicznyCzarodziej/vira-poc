// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  isCanvasCardEditSurface,
  isCanvasCardTypingTarget,
  shouldStartCanvasCardDrag,
} from "./canvasCardDrag.ts";

describe("isCanvasCardTypingTarget", () => {
  it("is true only when the event target belongs to the focused field", () => {
    document.body.innerHTML = `
      <div class="canvas-placed-card">
        <textarea id="ta"></textarea>
        <div data-editable="problem">Question</div>
      </div>
    `;
    const ta = document.getElementById("ta") as HTMLTextAreaElement;
    ta.focus();
    expect(isCanvasCardTypingTarget(ta)).toBe(true);
    expect(isCanvasCardTypingTarget(document.querySelector("[data-editable]"))).toBe(false);
  });
});

describe("isCanvasCardEditSurface", () => {
  it("is true for click-to-edit fields on a placed card", () => {
    document.body.innerHTML = `
      <div class="canvas-placed-card">
        <div class="problem editable" data-editable="problem">Question</div>
        <span class="card-id">42</span>
      </div>
    `;
    expect(isCanvasCardEditSurface(document.querySelector(".problem"))).toBe(true);
    expect(isCanvasCardEditSurface(document.querySelector(".card-id"))).toBe(false);
  });
});

describe("shouldStartCanvasCardDrag", () => {
  it("requires moving past the drag threshold", () => {
    expect(shouldStartCanvasCardDrag(0, 0, 7, 0)).toBe(false);
    expect(shouldStartCanvasCardDrag(0, 0, 9, 0)).toBe(true);
  });
});
