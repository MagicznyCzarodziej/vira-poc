import { describe, expect, it } from "vitest";
import {
  applyInferredFrameParents,
  childFrameIds,
  inferFrameParentId,
  reinferAllFrameParents,
} from "./frameNesting.ts";
import type { FramePlacement } from "./types.ts";

describe("frameNesting", () => {
  const frames = {
    "frame-outer": { id: "frame-outer" },
    "frame-inner": { id: "frame-inner" },
  };

  it("nests a smaller frame in the smallest larger container", () => {
    const framePlacements: Record<string, FramePlacement> = {
      "frame-outer": { x: 0, y: 0, width: 800, height: 600, parentFrameId: null },
      "frame-inner": { x: 200, y: 150, width: 300, height: 200, parentFrameId: null },
    };
    expect(inferFrameParentId("frame-inner", framePlacements, frames)).toBe("frame-outer");
    expect(inferFrameParentId("frame-outer", framePlacements, frames)).toBeNull();
  });

  it("lists direct child frames by parent id", () => {
    const framePlacements: Record<string, FramePlacement> = {
      "frame-outer": { x: 0, y: 0, width: 800, height: 600, parentFrameId: null },
      "frame-inner": { x: 200, y: 150, width: 300, height: 200, parentFrameId: "frame-outer" },
    };
    expect(childFrameIds("frame-outer", framePlacements)).toEqual(["frame-inner"]);
  });

  it("updates parent links after moves", () => {
    const framePlacements: Record<string, FramePlacement> = {
      "frame-outer": { x: 0, y: 0, width: 800, height: 600, parentFrameId: null },
      "frame-inner": { x: 900, y: 900, width: 300, height: 200, parentFrameId: "frame-outer" },
    };
    applyInferredFrameParents(framePlacements, frames, ["frame-inner"]);
    expect(framePlacements["frame-inner"]!.parentFrameId).toBeNull();
  });

  it("nests existing frames inside a newly added larger frame", () => {
    const frames = {
      "frame-a": { id: "frame-a" },
      "frame-b": { id: "frame-b" },
      "frame-new": { id: "frame-new" },
    };
    const framePlacements = {
      "frame-a": { x: 50, y: 50, width: 200, height: 160, parentFrameId: null },
      "frame-b": { x: 280, y: 60, width: 180, height: 140, parentFrameId: null },
      "frame-new": { x: 0, y: 0, width: 520, height: 320, parentFrameId: null },
    };
    reinferAllFrameParents(framePlacements, frames);
    expect(framePlacements["frame-a"]!.parentFrameId).toBe("frame-new");
    expect(framePlacements["frame-b"]!.parentFrameId).toBe("frame-new");
    expect(framePlacements["frame-new"]!.parentFrameId).toBeNull();
  });
});
