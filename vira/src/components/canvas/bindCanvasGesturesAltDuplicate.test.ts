// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { canvasPlacementKeysForItem } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

function mountCanvasCardDragFixture(placementKey: string, itemId: string) {
  document.body.innerHTML = `
    <div class="canvas-surface-shell">
      <div data-canvas-surface style="width:600px;height:400px">
        <div data-canvas-scroll-content>
          <div class="canvas-world">
            <div class="canvas-placed-card" data-canvas-placed="${placementKey}" data-canvas-item-id="${itemId}">
              <article class="card" data-id="${itemId}">
                <div class="card-top card-drag-handle">Ship it</div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
  return surface;
}

describe("bindCanvasGestures alt-drag duplicate", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("creates a new placement and leaves the original when alt-dragging", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;
    const origin = { ...useDocument.getState().canvasPlacements[placementKey]! };

    const surface = mountCanvasCardDragFixture(placementKey, itemId);
    const unbind = bindCanvasGestures(surface, { current: null });
    const handle = document.querySelector(".card-drag-handle")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 11, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 60,
        clientY: 60,
        pointerId: 11,
        button: 0,
        altKey: true,
      }),
    );

    const keys = canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    );
    expect(keys).toHaveLength(2);
    expect(useDocument.getState().canvasPlacements[placementKey]).toMatchObject({ x: origin.x, y: origin.y });
    const copyKey = keys.find((k) => k !== placementKey)!;

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 60, clientY: 60, pointerId: 11, button: 0 }),
    );
    expect(useDocument.getState().canvasPlacements[copyKey]!.x).not.toBe(origin.x);
    unbind();
  });

  it("moves the existing placement without alt and does not clone", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;
    const origin = { ...useDocument.getState().canvasPlacements[placementKey]! };

    const surface = mountCanvasCardDragFixture(placementKey, itemId);
    const unbind = bindCanvasGestures(surface, { current: null });
    const handle = document.querySelector(".card-drag-handle")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 12, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 60, clientY: 60, pointerId: 12, button: 0 }),
    );

    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(1);
    expect(document.querySelector<HTMLElement>(`[data-canvas-placed="${placementKey}"]`)!.style.transform).toContain("translate");

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 60, clientY: 60, pointerId: 12, button: 0 }),
    );
    expect(useDocument.getState().canvasPlacements[placementKey]!.x).not.toBe(origin.x);
    unbind();
  });

  it("reverts the original and duplicates when alt is pressed mid-drag", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;
    const origin = { ...useDocument.getState().canvasPlacements[placementKey]! };

    const surface = mountCanvasCardDragFixture(placementKey, itemId);
    const unbind = bindCanvasGestures(surface, { current: null });
    const handle = document.querySelector(".card-drag-handle")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 13, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 50, clientY: 50, pointerId: 13, button: 0 }),
    );
    expect(document.querySelector<HTMLElement>(`[data-canvas-placed="${placementKey}"]`)!.style.transform).toContain("translate");

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 55,
        clientY: 55,
        pointerId: 13,
        button: 0,
        altKey: true,
      }),
    );

    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(2);
    expect(useDocument.getState().canvasPlacements[placementKey]).toMatchObject({ x: origin.x, y: origin.y });

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 55, clientY: 55, pointerId: 13, button: 0 }),
    );
    unbind();
  });

  it("drops clones and keeps the original in place when alt is released mid-drag", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;
    const origin = { ...useDocument.getState().canvasPlacements[placementKey]! };

    const surface = mountCanvasCardDragFixture(placementKey, itemId);
    const unbind = bindCanvasGestures(surface, { current: null });
    const handle = document.querySelector(".card-drag-handle")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 16, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 60,
        clientY: 60,
        pointerId: 16,
        button: 0,
        altKey: true,
      }),
    );
    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(2);

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 70,
        clientY: 70,
        pointerId: 16,
        button: 0,
        altKey: false,
      }),
    );

    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(1);
    expect(useDocument.getState().canvasPlacements[placementKey]).toMatchObject({ x: origin.x, y: origin.y });
    expect(useDocument.getState().canvasSelection).toEqual([placementKey]);

    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 90,
        clientY: 90,
        pointerId: 16,
        button: 0,
        altKey: false,
      }),
    );
    expect(document.querySelector<HTMLElement>(`[data-canvas-placed="${placementKey}"]`)!.style.transform).toContain("translate");

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 90, clientY: 90, pointerId: 16, button: 0 }),
    );
    expect(useDocument.getState().canvasPlacements[placementKey]!.x).not.toBe(origin.x);
    unbind();
  });

  it("does not duplicate again while alt remains held", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;

    const surface = mountCanvasCardDragFixture(placementKey, itemId);
    const unbind = bindCanvasGestures(surface, { current: null });
    const handle = document.querySelector(".card-drag-handle")!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 14, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 60,
        clientY: 60,
        pointerId: 14,
        button: 0,
        altKey: true,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 90,
        clientY: 90,
        pointerId: 14,
        button: 0,
        altKey: true,
      }),
    );

    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(2);

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 90, clientY: 90, pointerId: 14, button: 0 }),
    );
    unbind();
  });

  it("alt-duplicates each selected card in a group drag", () => {
    useDocument.getState().submitComposer("A", "decision");
    const itemA = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().submitComposer("B", "decision");
    const itemB = Object.keys(useDocument.getState().items).find((id) => id !== itemA)!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemA, 50, 50);
    useDocument.getState().placeNewCardAtWorld(itemB, 150, 50);
    const keyA = Object.keys(useDocument.getState().canvasPlacements).find(
      (k) => useDocument.getState().canvasPlacements[k]?.itemId === itemA,
    )!;
    const keyB = Object.keys(useDocument.getState().canvasPlacements).find(
      (k) => useDocument.getState().canvasPlacements[k]?.itemId === itemB,
    )!;
    const originA = { ...useDocument.getState().canvasPlacements[keyA]! };
    const originB = { ...useDocument.getState().canvasPlacements[keyB]! };
    useDocument.getState().setCanvasSelection([keyA, keyB]);

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface style="width:800px;height:400px">
          <div data-canvas-scroll-content>
            <div class="canvas-world">
              <div class="canvas-placed-card" data-canvas-placed="${keyA}" data-canvas-item-id="${itemA}">
                <article class="card"><div class="card-top card-a">A</div></article>
              </div>
              <div class="canvas-placed-card" data-canvas-placed="${keyB}" data-canvas-item-id="${itemB}">
                <article class="card"><div class="card-top card-b">B</div></article>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 400, right: 800, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });

    const unbind = bindCanvasGestures(surface, { current: null });
    document.querySelector(".card-a")!.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 15, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 40,
        clientY: 40,
        pointerId: 15,
        button: 0,
        altKey: true,
      }),
    );

    expect(Object.keys(useDocument.getState().canvasPlacements)).toHaveLength(4);
    expect(useDocument.getState().canvasPlacements[keyA]).toMatchObject({ x: originA.x, y: originA.y });
    expect(useDocument.getState().canvasPlacements[keyB]).toMatchObject({ x: originB.x, y: originB.y });

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 40, clientY: 40, pointerId: 15, button: 0 }),
    );
    unbind();
  });
});
