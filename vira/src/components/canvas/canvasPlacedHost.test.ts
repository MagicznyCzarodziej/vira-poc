// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { canvasPlacedHostFromTarget, canvasPlacedId } from "./canvasPlaced.ts";

describe("canvasPlacedHostFromTarget", () => {
  it("finds card and action hosts", () => {
    document.body.innerHTML = `
      <div class="canvas-placed-card" data-canvas-placed="item-1"><span id="card-hit">q</span></div>
      <div class="canvas-placed-action-point" data-canvas-placed="ap-1"><span id="ap-hit">a</span></div>
    `;
    const cardHit = document.getElementById("card-hit")!;
    const apHit = document.getElementById("ap-hit")!;
    expect(canvasPlacedId(canvasPlacedHostFromTarget(cardHit)!)).toBe("item-1");
    expect(canvasPlacedId(canvasPlacedHostFromTarget(apHit)!)).toBe("ap-1");
  });
});
