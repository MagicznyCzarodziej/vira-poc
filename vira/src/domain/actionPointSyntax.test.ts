import { describe, expect, it } from "vitest";
import {
  actionPointRefPreviewTitle,
  canonicalizeActionPointRefsInText,
  formatActionPointMarkdown,
  formatActionPointRef,
  mergeActionPointRefsAfterEdit,
  parseActionPointIdsInText,
  stripActionPointRefsFromText,
} from "./actionPointSyntax.ts";

describe("actionPointSyntax", () => {
  it("formats bare AP tokens", () => {
    expect(formatActionPointRef("ap-3")).toBe("!ap3");
    expect(formatActionPointMarkdown("ap-3", "Write RFC")).toBe("!ap3");
  });

  it("parses markdown and bare tokens", () => {
    const text = "See [Ship it](!ap2) and !ap5";
    expect(parseActionPointIdsInText(text)).toEqual(["ap-2", "ap-5"]);
  });

  it("strips AP syntax for editing", () => {
    expect(stripActionPointRefsFromText("Plan [Old](!ap2) now")).toBe("Plan now");
    expect(stripActionPointRefsFromText("Plan !ap2 now")).toBe("Plan now");
  });

  it("merges AP tokens back after edit", () => {
    const source = "Ship [Action](!ap2) today";
    expect(mergeActionPointRefsAfterEdit("Ship tomorrow", source)).toBe("Ship tomorrow !ap2");
  });

  it("canonicalizes legacy markdown links to bare tokens", () => {
    expect(canonicalizeActionPointRefsInText("Go [Act](!ap7)")).toBe("Go !ap7");
  });

  it("normalizes AP ref preview titles without fixed length", () => {
    expect(actionPointRefPreviewTitle("Short")).toBe("Short");
    expect(actionPointRefPreviewTitle("  Trim me  ")).toBe("Trim me");
    const long = "abcdefghijklmnopqrstuvwxyz1234567890";
    expect(actionPointRefPreviewTitle(long)).toBe(long);
    expect(actionPointRefPreviewTitle("")).toBe("Action");
  });
});
