// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isTypingIssueRef } from "./autocompleteSuggestions.ts";

function atEnd(ta: HTMLTextAreaElement, pos: number) {
  ta.selectionStart = pos;
  ta.selectionEnd = pos;
}

describe("isTypingIssueRef", () => {
  it("detects an in-progress bang trigger", () => {
    const ta = document.createElement("textarea");
    ta.value = "See !2/a";
    atEnd(ta, ta.value.length);
    expect(isTypingIssueRef(ta)).toBe(true);
  });

  it("ignores bang inside completed markdown link syntax", () => {
    const ta = document.createElement("textarea");
    ta.value = "[label](!1/a1) done";
    atEnd(ta, ta.value.length);
    expect(isTypingIssueRef(ta)).toBe(false);
  });

  it("ignores bang in link destination when cursor is on the bang", () => {
    const ta = document.createElement("textarea");
    ta.value = "[label](!1/a1)";
    atEnd(ta, "[label](".length + 1);
    expect(isTypingIssueRef(ta)).toBe(false);
  });
});
