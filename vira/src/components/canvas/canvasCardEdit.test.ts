// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { editTargetFromCanvasPointer } from "./canvasCardEdit.ts";

describe("editTargetFromCanvasPointer", () => {
  it("maps a problem field to a canvas edit target", () => {
    document.body.innerHTML = `
      <div class="canvas-placed-card" data-canvas-placed="canvas-9">
        <div class="problem editable" data-editable="problem" data-id="item-3" data-step="1">Q?</div>
      </div>
    `;
    expect(editTargetFromCanvasPointer(document.querySelector(".problem"))).toEqual({
      id: "item-3",
      field: "problem",
      step: 1,
      surface: "canvas",
      canvasPlacementKey: "canvas-9",
    });
  });

  it("returns null when the field is not inside a canvas placement host", () => {
    document.body.innerHTML = `
      <div class="problem editable" data-editable="problem" data-id="item-3" data-step="0">Q?</div>
    `;
    expect(editTargetFromCanvasPointer(document.querySelector(".problem"))).toBeNull();
  });

  it("ignores buttons and action controls", () => {
    document.body.innerHTML = `
      <button type="button" class="card-id" data-id="item-1">!1</button>
    `;
    expect(editTargetFromCanvasPointer(document.querySelector(".card-id"))).toBeNull();
  });
});
