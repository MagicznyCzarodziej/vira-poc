// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/index.ts";
import { usePanels } from "../../store/index.ts";
import { clearRefPickCompose, endRefPickSession, refPickModeActive } from "./bindRefPickFromCard.ts";
import { resetRefPickSessionForTests } from "./refPickSession.ts";
import { isTypingIssueRef } from "./autocompleteSuggestions.ts";

describe("refPickModeActive", () => {
  beforeEach(() => {
    clearRefPickCompose();
    resetRefPickSessionForTests();
    usePanels.setState({ picker: null });
    document.body.classList.remove("ref-pick-active");
  });

  it("is false when picker is closed and textarea is not typing a ref", () => {
    const ta = document.createElement("textarea");
    ta.value = "Decision with [link](!1/a1) done.";
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    document.body.append(ta);
    ta.focus();
    expect(isTypingIssueRef(ta)).toBe(false);
    expect(refPickModeActive()).toBe(false);
  });

  it("is true while ref link picker is open", () => {
    usePanels.setState({
      picker: {
        label: "selected",
        start: 0,
        end: 1,
        textSnapshot: "!",
        mode: "inline",
        itemId: "item-1",
        field: "answer",
        stepIndex: 0,
      },
    });
    expect(refPickModeActive()).toBe(true);
  });

  it("ends pick mode after a reference is inserted even if orphan ! remains", () => {
    const ta = document.createElement("textarea");
    ta.value = "See !";
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    document.body.append(ta);
    ta.focus();
    expect(refPickModeActive()).toBe(true);
    endRefPickSession();
    expect(refPickModeActive()).toBe(false);
    expect(document.body.classList.contains("ref-pick-active")).toBe(false);
  });

  it("clears stale compose tracking when picker closes", () => {
    const ta = document.createElement("textarea");
    ta.value = "!";
    ta.selectionStart = ta.selectionEnd = 1;
    document.body.append(ta);
    ta.focus();
    expect(refPickModeActive()).toBe(true);
    clearRefPickCompose();
    ta.blur();
    expect(refPickModeActive()).toBe(false);
  });
});
