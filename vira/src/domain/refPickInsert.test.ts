import { describe, expect, it } from "vitest";
import { expandRefPickEnd } from "./refPickInsert.ts";

describe("expandRefPickEnd", () => {
  it("consumes a trailing bang after the selection", () => {
    expect(expandRefPickEnd("See !", 0, 3)).toBe(5);
  });

  it("leaves text unchanged when there is no orphan bang", () => {
    expect(expandRefPickEnd("See here", 0, 3)).toBe(3);
  });
});
