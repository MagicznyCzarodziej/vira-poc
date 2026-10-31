// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isListCardDragButton, isListCardDragField, isListCardEditSurface } from "./listCardDrag.ts";

describe("isListCardDragField", () => {
  it("blocks drag only for the focused typing field", () => {
    document.body.innerHTML = `
      <article class="card">
        <textarea id="ta"></textarea>
        <div data-editable="problem">Text</div>
      </article>
    `;
    const ta = document.getElementById("ta") as HTMLTextAreaElement;
    ta.focus();
    expect(isListCardDragField(ta)).toBe(true);
    expect(isListCardDragField(document.querySelector("[data-editable]"))).toBe(false);
  });
});

describe("isListCardEditSurface", () => {
  it("includes click-to-edit fields before focus", () => {
    document.body.innerHTML = `
      <article class="card">
        <div data-editable="problem">Question</div>
        <textarea id="ta"></textarea>
      </article>
    `;
    expect(isListCardEditSurface(document.querySelector("[data-editable]"))).toBe(true);
    expect(isListCardEditSurface(document.getElementById("ta"))).toBe(true);
    expect(isListCardEditSurface(document.querySelector(".card"))).toBe(false);
  });
});

describe("isListCardDragButton", () => {
  it("detects buttons inside the card", () => {
    document.body.innerHTML = `
      <article class="card">
        <button type="button" class="card-id">!1</button>
      </article>
    `;
    const card = document.querySelector(".card")!;
    const button = document.querySelector("button")!;
    expect(isListCardDragButton(button, card)).toBe(true);
    expect(isListCardDragButton(card, card)).toBe(false);
  });
});
