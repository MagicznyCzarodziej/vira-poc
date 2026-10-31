import { describe, expect, it } from "vitest";
import { normalizeRefTokenForField } from "./refFieldTokens.ts";

describe("normalizeRefTokenForField", () => {
  it("maps question-shaped tokens to answer refs in answer fields", () => {
    expect(normalizeRefTokenForField("item-5/2", { field: "answer" })).toBe("item-5/a2");
    expect(normalizeRefTokenForField("item-5/a2", { field: "answer" })).toBe("item-5/a2");
    expect(normalizeRefTokenForField("item-5/2", { field: "problem" })).toBe("item-5/2");
  });
});
