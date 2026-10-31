// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  refEditableTextareaForSelection,
  selectionAnchor,
} from "./selectionGeometry.ts";

function stubRect(el: Element, rect: Partial<DOMRect>) {
  const full = {
    x: 0,
    y: 0,
    width: 200,
    height: 40,
    top: 0,
    left: 0,
    right: 200,
    bottom: 40,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  el.getBoundingClientRect = () => full;
}

describe("refEditableTextareaForSelection", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("uses activeElement when mouseup target is outside the textarea", () => {
    const ta = document.createElement("textarea");
    ta.className = "inline-input";
    document.body.append(ta);
    ta.focus();

    const outside = document.createElement("div");
    document.body.append(outside);

    expect(refEditableTextareaForSelection(outside)).toBe(ta);
  });

  it("uses selectionDragTa when focus is no longer on the textarea", () => {
    const ta = document.createElement("textarea");
    ta.className = "inline-input";
    document.body.append(ta);
    const outside = document.createElement("div");
    document.body.append(outside);
    outside.focus();

    expect(refEditableTextareaForSelection(outside, ta)).toBe(ta);
  });
});

describe("selectionAnchor", () => {
  let mirror: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    mirror = document.createElement("div");
    document.body.append(mirror);
  });

  it("returns anchor when mouseup is outside but text remains selected in the field", () => {
    const ta = document.createElement("textarea");
    ta.className = "inline-input";
    ta.value = "hello world";
    document.body.append(ta);
    stubRect(ta, { left: 10, top: 20, width: 180, height: 32 });
    ta.focus();
    ta.setSelectionRange(0, 5);

    const outside = document.createElement("div");
    document.body.append(outside);
    stubRect(outside, { left: 300, top: 300, width: 50, height: 50 });

    const result = selectionAnchor(outside, mirror, 320, 310);
    expect(result).not.toBeUndefined();
    expect(result).toMatchObject({
      textarea: ta,
      start: 0,
      end: 5,
      label: "hello",
    });
  });

  it("returns undefined when mouseup is unrelated to any ref textarea", () => {
    const outside = document.createElement("div");
    document.body.append(outside);
    expect(selectionAnchor(outside, mirror)).toBeUndefined();
  });
});
