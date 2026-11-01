// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { useDocument } from "./useDocument.ts";

describe("canvas frame tool", () => {
  it("toggles the frame tool", () => {
    useDocument.getState().clearAll();
    expect(useDocument.getState().canvasTool).toBe("default");
    useDocument.getState().toggleFrameTool();
    expect(useDocument.getState().canvasTool).toBe("frame");
    useDocument.getState().toggleFrameTool();
    expect(useDocument.getState().canvasTool).toBe("default");
  });
});
