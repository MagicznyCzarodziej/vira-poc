// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/index.ts";
import { usePanels } from "../../store/index.ts";
import { registerTextareaCompose } from "./textareaComposeSync.ts";
import { bindRefPickFromCard, tryConsumeRefPick } from "./bindRefPickFromCard.ts";
import { resetRefPickSessionForTests } from "./refPickSession.ts";

describe("ref pick into note", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    resetRefPickSessionForTests();
    usePanels.setState({ picker: null });
    document.body.innerHTML = "";
    useDocument.getState().submitComposer("Decision text", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 100, 100);
  });

  it("inserts a decision ref when clicking a card while typing ! in the note", () => {
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const noteId = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().cancelEdit();

    const ta = document.createElement("textarea");
    ta.className = "inline-input canvas-sticky-note-input";
    ta.dataset.noteId = noteId;
    ta.value = "!";
    ta.selectionStart = ta.selectionEnd = 1;
    document.body.append(ta);
    registerTextareaCompose(ta, {
      tags: false,
      onValue: (next) => useDocument.getState().setNoteBody(noteId, next),
    });
    const unbindPick = bindRefPickFromCard();
    ta.focus();
    document.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    const cardHost = document.createElement("div");
    cardHost.innerHTML = `
      <div class="card" data-id="${itemId}">
        <div class="answer editable" data-editable="answer" data-id="${itemId}" data-step="0" data-ref-pick="answer">Decision text</div>
      </div>
    `;
    document.body.appendChild(cardHost);

    const pickTarget = cardHost.querySelector<HTMLElement>("[data-ref-pick]")!;
    const picked = tryConsumeRefPick({
      target: pickTarget,
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {},
    } as Event);
    expect(picked).toBe(true);
    expect(useDocument.getState().notes[noteId]?.body).toMatch(/!\d+/);
    unbindPick();
  });
});
