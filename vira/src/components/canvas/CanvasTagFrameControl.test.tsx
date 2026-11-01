// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useDocument } from "../../store/useDocument.ts";
import { CanvasTagFrameControl } from "./CanvasTagFrameControl.tsx";

describe("CanvasTagFrameControl", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("opens tag menu from the button and arms placement on tag pick", () => {
    const id = useDocument.getState().createBlankCard("list", "decision");
    useDocument.getState().addTag(id!, "alpha");

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(<CanvasTagFrameControl />);
    });

    act(() => host.querySelector<HTMLButtonElement>('[data-action="open-tag-frame-menu"]')?.click());
    expect(host.querySelector(".canvas-tag-frame-menu")).toBeTruthy();

    act(() => host.querySelector<HTMLButtonElement>('[data-action="pick-frame-tag"]')?.click());
    expect(useDocument.getState().tagFramePlacementTag).toBe("alpha");
    expect(useDocument.getState().tagFrameMenuOpen).toBe(false);
    act(() => root.unmount());
  });
});
