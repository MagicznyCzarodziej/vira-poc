// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { decisionActionPointRefContext } from "./actionPointRefContext.ts";

describe("decisionActionPointRefContext", () => {
  it("reads item and step from the answer block", () => {
    document.body.innerHTML = `
      <article class="card" data-id="item-3">
        <div class="answer-block answered" data-step="1" data-id="item-3">
          <button type="button" data-action="goto-action-point" data-action-point-id="ap-1">Task</button>
        </div>
      </article>
    `;
    const button = document.querySelector("button")!;
    expect(decisionActionPointRefContext(button)).toEqual({ itemId: "item-3", stepIndex: 1 });
  });

  it("returns null outside an answer block", () => {
    document.body.innerHTML = `<button data-action="goto-action-point">x</button>`;
    expect(decisionActionPointRefContext(document.querySelector("button")!)).toBeNull();
  });
});
