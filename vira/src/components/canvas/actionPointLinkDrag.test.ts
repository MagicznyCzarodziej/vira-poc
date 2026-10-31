// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import {
  AP_LINK_DRAG_BODY_CLASS,
  AP_LINK_DROP_TARGET_CLASS,
  beginActionPointLinkDrag,
  clearActionPointLinkDropHighlight,
  endActionPointLinkDrag,
  findDecisionAnswerLinkTarget,
  finishActionPointLinkDrop,
  syncActionPointLinkDropHighlight,
} from "./actionPointLinkDrag.ts";

describe("actionPointLinkDrag", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("finds a decision answer under the pointer", () => {
    document.body.innerHTML = `
      <article class="card" data-id="item-1">
        <div class="answer-block answered" data-step="0" data-id="item-1">
          <span class="answer-text">Ship REST</span>
        </div>
      </article>
    `;
    const block = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => block;
    expect(findDecisionAnswerLinkTarget(100, 20)).toEqual({ itemId: "item-1", stepIndex: 0 });
  });

  it("links an action to a decision on drop", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Task");
    useDocument.getState().cancelEdit();

    document.body.innerHTML = `
      <article class="card" data-id="${itemId}">
        <div class="answer-block answered" data-step="0" data-id="${itemId}">
          <span class="answer-text">Ship REST</span>
        </div>
      </article>
    `;
    const block = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => block;

    expect(finishActionPointLinkDrop(apId, 50, 20)).toBe(true);
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
    expect(block.classList.contains(AP_LINK_DROP_TARGET_CLASS)).toBe(false);
  });

  it("accepts empty add-decision blocks as link targets", () => {
    document.body.innerHTML = `
      <article class="card" data-id="item-2">
        <div class="answer-block empty" data-step="0" data-id="item-2">Add decision</div>
      </article>
    `;
    const empty = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => empty;
    expect(findDecisionAnswerLinkTarget(10, 10)).toEqual({ itemId: "item-2", stepIndex: 0 });
  });

  it("returns null when nothing is under the pointer", () => {
    document.elementFromPoint = () => null;
    expect(findDecisionAnswerLinkTarget(0, 0)).toBeNull();
    expect(finishActionPointLinkDrop("ap-1", 0, 0)).toBe(false);
  });

  it("highlights and clears drop targets while linking", () => {
    document.body.innerHTML = `
      <article class="card" data-id="item-3">
        <div class="answer-block answered" data-step="1" data-id="item-3">
          <span class="answer-text">Yes</span>
        </div>
      </article>
    `;
    const block = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => block;

    beginActionPointLinkDrag();
    syncActionPointLinkDropHighlight(5, 5);
    expect(document.body.classList.contains(AP_LINK_DRAG_BODY_CLASS)).toBe(true);
    expect(block.classList.contains(AP_LINK_DROP_TARGET_CLASS)).toBe(true);

    document.elementFromPoint = () => null;
    syncActionPointLinkDropHighlight(500, 500);
    expect(block.classList.contains(AP_LINK_DROP_TARGET_CLASS)).toBe(false);

    endActionPointLinkDrag();
    expect(document.body.classList.contains(AP_LINK_DRAG_BODY_CLASS)).toBe(false);
    clearActionPointLinkDropHighlight();
  });

  it("resolves multi-step indices from data-step", () => {
    document.body.innerHTML = `
      <article class="card" data-id="item-4">
        <div class="answer-block answered" data-step="2" data-id="item-4">
          <span class="answer-text">Step three</span>
        </div>
      </article>
    `;
    document.elementFromPoint = () => document.querySelector(".answer-block");
    expect(findDecisionAnswerLinkTarget(1, 1)).toEqual({ itemId: "item-4", stepIndex: 2 });
  });
});
