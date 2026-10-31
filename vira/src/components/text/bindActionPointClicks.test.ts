// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { navigateToActionPoint, unlinkActionPointRefFromDecision } from "./bindActionPointClicks.ts";

vi.mock("../canvas/flyToCard.ts", () => ({
  requestCanvasReveal: vi.fn(),
}));

vi.mock("../panels/history/revealCardInList.ts", () => ({
  revealActionPointInList: vi.fn(),
}));

import { requestCanvasReveal } from "../canvas/flyToCard.ts";
import { revealActionPointInList } from "../panels/history/revealCardInList.ts";

describe("unlinkActionPointRefFromDecision", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("removes the ref from the decision answer block", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);

    document.body.innerHTML = `
      <article class="card" data-id="${itemId}">
        <div class="answer-block answered" data-step="0" data-id="${itemId}">
          <div class="action-point-ref action-point-ref--with-unlink">
            <button type="button" class="action-point-ref-label" data-action="goto-action-point" data-action-point-id="${apId}">Deploy</button>
            <button type="button" class="action-point-ref-unlink" data-action="unlink-action-point" data-action-point-id="${apId}">×</button>
          </div>
        </div>
      </article>
    `;
    const unlink = document.querySelector<HTMLElement>("[data-action='unlink-action-point']")!;

    expect(unlinkActionPointRefFromDecision(unlink)).toBe(true);
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs ?? []).toEqual([]);
  });
});

describe("navigateToActionPoint", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    vi.mocked(requestCanvasReveal).mockClear();
    vi.mocked(revealActionPointInList).mockClear();
  });

  it("scrolls the list and flies on canvas when the action is placed", () => {
    const apId = useDocument.getState().createStandaloneActionPoint("Ship");
    useDocument.getState().placeActionPointAtWorld(apId, 10, 20);
    useDocument.getState().setView("board");

    navigateToActionPoint(apId);

    expect(useDocument.getState().viewMode).toBe("list");
    expect(requestCanvasReveal).toHaveBeenCalledWith(apId);
    expect(revealActionPointInList).toHaveBeenCalledWith(apId);
  });

  it("only scrolls the list when the action is not on canvas", () => {
    const apId = useDocument.getState().createStandaloneActionPoint("Review");

    navigateToActionPoint(apId);

    expect(requestCanvasReveal).not.toHaveBeenCalled();
    expect(revealActionPointInList).toHaveBeenCalledWith(apId);
  });
});
