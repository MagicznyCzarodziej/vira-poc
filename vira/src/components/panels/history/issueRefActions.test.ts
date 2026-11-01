// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { bindIssueRefActions } from "./issueRefActions.ts";
import { useDocument } from "../../../store/index.ts";

describe("upgrade issue ref", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("updates a stale pinned ref inside a sticky note", () => {
    useDocument.getState().submitComposer("Answer v1", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const step = useDocument.getState().items[itemId]!.steps[0]!;
    step.answer = "Answer v2";
    step.answerRev = 2;
    step.answerRevisions.push({ rev: 2, text: "Answer v2", at: "2026-02-01T00:00:00.000Z" });
    useDocument.getState().setFieldHeadText(itemId, 0, "answer", step.answer!);

    const noteId = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().setNoteBody(noteId, `See !1/a1@v1`);
    useDocument.getState().cancelEdit();

    document.body.innerHTML = `
      <div class="canvas-placed-note" data-canvas-placed="${noteId}">
        <article class="canvas-sticky-note" data-note-id="${noteId}">
          <button type="button" class="issue-ref issue-ref-stale" data-action="goto-issue" data-issue-ref="item-1/a1@v1">!1/a1@v1</button>
        </article>
      </div>
      <button type="button" data-action="upgrade-issue-ref" data-issue-ref="item-1/a1@v1">Update link to current</button>
    `;

    const unbind = bindIssueRefActions();
    const refBtn = document.querySelector<HTMLElement>("[data-action='goto-issue']")!;
    refBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.querySelector<HTMLElement>("[data-action='upgrade-issue-ref']")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(useDocument.getState().notes[noteId]?.body).toContain("@v2");
    expect(useDocument.getState().notes[noteId]?.body).not.toContain("@v1");
    unbind();
  });
});
