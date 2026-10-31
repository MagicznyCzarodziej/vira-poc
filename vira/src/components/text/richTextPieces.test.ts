import { describe, expect, it } from "vitest";
import {
  actionPointRefVisible,
  collapseActionPointRuns,
} from "./richTextPieces.ts";

describe("collapseActionPointRuns", () => {
  it("merges AP tokens separated only by whitespace", () => {
    const pieces = [
      { kind: "actionPoint", id: "ap-1", raw: "" },
      { kind: "text", text: " " },
      { kind: "actionPoint", id: "ap-2", raw: "" },
      { kind: "text", text: "tail" },
    ];
    const out = collapseActionPointRuns(pieces);
    expect(out).toEqual([
      { kind: "actionPointRun", items: [pieces[0], pieces[2]] },
      { kind: "text", text: "tail" },
    ]);
  });

  it("keeps separate runs when non-whitespace text sits between", () => {
    const pieces = [
      { kind: "actionPoint", id: "ap-1", raw: "" },
      { kind: "text", text: "and" },
      { kind: "actionPoint", id: "ap-2", raw: "" },
    ];
    const out = collapseActionPointRuns(pieces);
    expect(out.map((p) => p.kind)).toEqual(["actionPointRun", "text", "actionPointRun"]);
  });
});

describe("actionPointRefVisible", () => {
  it("hides done APs but keeps missing ids", () => {
    const bag = { "ap-1": { done: true }, "ap-2": { done: false } };
    expect(actionPointRefVisible(bag, "ap-1")).toBe(false);
    expect(actionPointRefVisible(bag, "ap-2")).toBe(true);
    expect(actionPointRefVisible(bag, "ap-9")).toBe(true);
  });
});
