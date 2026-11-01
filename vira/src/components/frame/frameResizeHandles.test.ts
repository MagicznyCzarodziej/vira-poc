import { describe, expect, it } from "vitest";
import { parseFrameResizeHandle } from "./frameResizeHandles.ts";

describe("parseFrameResizeHandle", () => {
  it("accepts edge and corner handles", () => {
    expect(parseFrameResizeHandle("nw")).toBe("nw");
    expect(parseFrameResizeHandle("e")).toBe("e");
  });

  it("rejects unknown values", () => {
    expect(parseFrameResizeHandle("middle")).toBeNull();
  });
});
