import { describe, expect, it } from "vitest";
import { CARD_WIDTH, DROP_OFFSET_Y } from "../../domain/index.ts";
import { listCardGhostTransform } from "./listCardPointerDragGhost.ts";

describe("listCardGhostTransform", () => {
  it("matches canvas drop anchoring", () => {
    expect(listCardGhostTransform(500, 300)).toEqual({
      x: 500 - CARD_WIDTH / 2,
      y: 300 - DROP_OFFSET_Y,
    });
  });
});
