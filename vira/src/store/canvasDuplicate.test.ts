// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { canvasPlacementKeysForItem } from "../domain/index.ts";
import { useDocument } from "./useDocument.ts";

describe("duplicateCardPlacementsForDrag", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("clones placements in the store at the given positions", () => {
    useDocument.getState().submitComposer("One", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 40, 50);
    const originalKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;

    const keyMap = useDocument.getState().duplicateCardPlacementsForDrag([originalKey], {
      [originalKey]: { x: 40, y: 50 },
    });

    const copyKey = keyMap[originalKey];
    expect(copyKey).toBeTruthy();
    expect(copyKey).not.toBe(originalKey);
    expect(useDocument.getState().canvasPlacements[originalKey]).toMatchObject({ x: 40, y: 50, itemId });
    expect(useDocument.getState().canvasPlacements[copyKey!]).toMatchObject({ x: 40, y: 50, itemId });
    expect(canvasPlacementKeysForItem(
      useDocument.getState().canvasPlacements,
      useDocument.getState().items,
      itemId,
    )).toHaveLength(2);
  });

  it("duplicates each key in a multi-placement batch", () => {
    useDocument.getState().submitComposer("A", "decision");
    const itemA = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().submitComposer("B", "decision");
    const itemB = Object.keys(useDocument.getState().items).find((id) => id !== itemA)!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemA, 10, 10);
    useDocument.getState().placeNewCardAtWorld(itemB, 200, 20);
    const keyA = Object.keys(useDocument.getState().canvasPlacements).find(
      (k) => useDocument.getState().canvasPlacements[k]?.itemId === itemA,
    )!;
    const keyB = Object.keys(useDocument.getState().canvasPlacements).find(
      (k) => useDocument.getState().canvasPlacements[k]?.itemId === itemB,
    )!;

    const keyMap = useDocument.getState().duplicateCardPlacementsForDrag([keyA, keyB], {
      [keyA]: { x: 10, y: 10 },
      [keyB]: { x: 200, y: 20 },
    });

    expect(keyMap[keyA]).not.toBe(keyA);
    expect(keyMap[keyB]).not.toBe(keyB);
    expect(Object.keys(useDocument.getState().canvasPlacements)).toHaveLength(4);
  });
});
