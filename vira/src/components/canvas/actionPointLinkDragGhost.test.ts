// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  clearActionPointLinkDragGhost,
  linkDragGhostTransform,
  syncActionPointLinkDragGhost,
} from "./actionPointLinkDragGhost.ts";

describe("actionPointLinkDragGhost", () => {
  afterEach(() => {
    clearActionPointLinkDragGhost();
    document.body.innerHTML = "";
  });

  it("shows a small chip that follows the pointer", () => {
    document.body.innerHTML = `
      <article class="action-point-card" data-canvas-drag-ap-id="ap-1">
        <div class="action-point-title">Link me</div>
      </article>
    `;
    const card = document.querySelector(".action-point-card")!;

    syncActionPointLinkDragGhost(card, 120, 80);
    const ghost = document.querySelector(".action-point-link-drag-ghost");
    expect(ghost).toBeTruthy();
    expect(ghost!.querySelector(".action-point-card")).toBeNull();
    const chip = ghost!.querySelector(".action-point-link-drag-chip");
    expect(chip?.textContent).toBe("Link me");

    const first = linkDragGhostTransform(120, 80);
    expect(ghost!.style.transform).toBe(`translate(${Math.round(first.x)}px, ${Math.round(first.y)}px)`);

    syncActionPointLinkDragGhost(card, 200, 160);
    expect(document.querySelectorAll(".action-point-link-drag-ghost")).toHaveLength(1);
    const second = linkDragGhostTransform(200, 160);
    expect(ghost!.style.transform).toBe(`translate(${Math.round(second.x)}px, ${Math.round(second.y)}px)`);

    clearActionPointLinkDragGhost();
    expect(document.querySelector(".action-point-link-drag-ghost")).toBeNull();
  });

  it("reads the title from a canvas placed host", () => {
    document.body.innerHTML = `
      <div class="canvas-placed-action-point" data-canvas-placed="ap-2">
        <article class="action-point-card">
          <div class="action-point-title">On canvas</div>
        </article>
      </div>
    `;
    const host = document.querySelector(".canvas-placed-action-point")!;
    syncActionPointLinkDragGhost(host, 50, 50);
    expect(document.querySelector(".action-point-link-drag-chip")?.textContent).toBe("On canvas");
  });
});
