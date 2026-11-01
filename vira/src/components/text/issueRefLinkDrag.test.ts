// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/index.ts";
import {
  finishIssueRefLinkDrop,
  issueRefLinkSourceFromTarget,
  refTokenFromRefPickElement,
} from "./issueRefLinkDrag.ts";

describe("issueRefLinkDrag", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("builds ref token from a problem ref-pick surface", () => {
    useDocument.getState().submitComposer("Should we ship?", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const pick = document.createElement("div");
    pick.dataset.refPick = "problem";
    pick.dataset.id = itemId;
    pick.dataset.step = "0";
    expect(refTokenFromRefPickElement(pick, useDocument.getState().items)).toBe(`${itemId}/1`);
  });

  it("inserts a ref into a note textarea on drop", () => {
    useDocument.getState().submitComposer("Source decision", "decision");
    const sourceId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().submitComposer("Target Q", "question");
    const targetId = Object.keys(useDocument.getState().items).find((id) => id !== sourceId)!;
    useDocument.getState().cancelEdit();

    const noteId = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().cancelEdit();

    const sourcePick = document.createElement("div");
    sourcePick.dataset.refPick = "answer";
    sourcePick.dataset.id = sourceId;
    sourcePick.dataset.step = "0";
    const source = issueRefLinkSourceFromTarget(sourcePick)!;

    const ta = document.createElement("textarea");
    ta.className = "inline-input canvas-sticky-note-input";
    ta.dataset.noteId = noteId;
    ta.value = "See ";
    document.body.appendChild(ta);

    document.elementFromPoint = () => ta;

    const ok = finishIssueRefLinkDrop(source, 10, 10);
    expect(ok).toBe(true);
    expect(useDocument.getState().notes[noteId]?.body).toMatch(/!\d+/);

    const targetPick = document.createElement("div");
    targetPick.className = "problem editable";
    targetPick.dataset.refPick = "problem";
    targetPick.dataset.id = targetId;
    targetPick.dataset.step = "0";
    document.body.appendChild(targetPick);
    document.elementFromPoint = () => targetPick;

    const ok2 = finishIssueRefLinkDrop(source, 20, 20);
    expect(ok2).toBe(true);
    expect(useDocument.getState().items[targetId]!.steps[0]!.problem).toMatch(/!\d+/);
  });
});
