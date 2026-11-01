// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  isIssueRefHoverTarget,
  shouldHighlightAnswerBlockOnHover,
  shouldHighlightProblemOnHover,
} from "./cardFieldHover.ts";

describe("isIssueRefHoverTarget", () => {
  it("matches goto-issue ref buttons", () => {
    const btn = document.createElement("button");
    btn.dataset.action = "goto-issue";
    expect(isIssueRefHoverTarget(btn)).toBe(true);
  });
});

describe("shouldHighlightAnswerBlockOnHover", () => {
  it("highlights when hovering answer text", () => {
    const block = document.createElement("div");
    block.className = "answer-block";
    const text = document.createElement("span");
    text.className = "answer-text editable";
    text.textContent = "We decided yes.";
    block.append(text);
    document.body.append(block);
    expect(shouldHighlightAnswerBlockOnHover(text)).toBe(true);
  });

  it("does not highlight when hovering an embedded reference link", () => {
    const block = document.createElement("div");
    block.className = "answer-block";
    const text = document.createElement("span");
    text.className = "answer-text editable";
    const ref = document.createElement("button");
    ref.type = "button";
    ref.className = "issue-ref issue-ref-link";
    ref.dataset.action = "goto-issue";
    ref.textContent = "Other decision";
    text.append(ref);
    block.append(text);
    document.body.append(block);
    expect(shouldHighlightAnswerBlockOnHover(ref)).toBe(false);
  });

  it("does not apply answer block hover class when pointer is on a ref link", () => {
    const block = document.createElement("div");
    block.className = "answer-block";
    const text = document.createElement("span");
    text.className = "answer-text editable";
    const ref = document.createElement("button");
    ref.dataset.action = "goto-issue";
    text.append(ref);
    block.append(text);

    block.classList.toggle("is-answer-field-hover", shouldHighlightAnswerBlockOnHover(ref));
    expect(block.classList.contains("is-answer-field-hover")).toBe(false);

    block.classList.toggle("is-answer-field-hover", shouldHighlightAnswerBlockOnHover(text));
    expect(block.classList.contains("is-answer-field-hover")).toBe(true);
  });
});

describe("shouldHighlightProblemOnHover", () => {
  it("does not highlight when hovering a reference in the question", () => {
    const problem = document.createElement("div");
    problem.className = "problem editable";
    const ref = document.createElement("button");
    ref.dataset.action = "goto-issue";
    problem.append(ref);
    expect(shouldHighlightProblemOnHover(ref)).toBe(false);
  });
});
