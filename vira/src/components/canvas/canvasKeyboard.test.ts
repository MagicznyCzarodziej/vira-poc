// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  isCanvasScrollKey,
  isCanvasSelectionRemoveKey,
  isSpaceKey,
  shouldBlockCanvasScrollNavigation,
  shouldRemoveCanvasSelectionOnKey,
  shouldStartCanvasSpacePan,
} from "./canvasKeyboard.ts";

describe("canvasKeyboard", () => {
  it("recognizes the space key by code and key", () => {
    expect(isSpaceKey({ key: " ", code: "Space" })).toBe(true);
    expect(isSpaceKey({ key: "x", code: "KeyX" })).toBe(false);
  });

  it("recognizes delete keys for removing canvas selection", () => {
    expect(isCanvasSelectionRemoveKey({ key: "Delete" })).toBe(true);
    expect(isCanvasSelectionRemoveKey({ key: "Backspace" })).toBe(true);
    expect(isCanvasSelectionRemoveKey({ key: "Escape" })).toBe(false);
  });

  it("removes canvas selection only in list view while not typing", () => {
    const base = {
      key: { key: "Delete" },
      typing: false,
      selectionCount: 2,
      viewMode: "list" as const,
    };
    expect(shouldRemoveCanvasSelectionOnKey(base)).toBe(true);
    expect(shouldRemoveCanvasSelectionOnKey({ ...base, typing: true })).toBe(false);
    expect(shouldRemoveCanvasSelectionOnKey({ ...base, selectionCount: 0 })).toBe(false);
    expect(shouldRemoveCanvasSelectionOnKey({ ...base, viewMode: "board" })).toBe(false);
    expect(shouldRemoveCanvasSelectionOnKey({ ...base, key: { key: "a" } })).toBe(false);
  });

  it("starts space pan on primary button regardless of hit target", () => {
    expect(shouldStartCanvasSpacePan(true, 0)).toBe(true);
    expect(shouldStartCanvasSpacePan(true, 1)).toBe(false);
    expect(shouldStartCanvasSpacePan(false, 0)).toBe(false);
  });

  it("recognizes scroll navigation keys", () => {
    expect(isCanvasScrollKey({ key: "PageDown", code: "PageDown" })).toBe(true);
    expect(isCanvasScrollKey({ key: "PageUp", code: "PageUp" })).toBe(true);
    expect(isCanvasScrollKey({ key: "Home", code: "Home" })).toBe(true);
    expect(isCanvasScrollKey({ key: "End", code: "End" })).toBe(true);
    expect(isCanvasScrollKey({ key: " ", code: "Space" })).toBe(true);
    expect(isCanvasScrollKey({ key: "a", code: "KeyA" })).toBe(false);
  });

  it("blocks when the pointer is over the canvas and the user is not typing", () => {
    const surface = document.createElement("div");
    expect(
      shouldBlockCanvasScrollNavigation({
        typing: false,
        pointerOverCanvas: true,
        focusNode: null,
        canvasSurface: surface,
      }),
    ).toBe(true);
    expect(
      shouldBlockCanvasScrollNavigation({
        typing: true,
        pointerOverCanvas: true,
        focusNode: null,
        canvasSurface: surface,
      }),
    ).toBe(false);
  });

  it("blocks when focus is inside the canvas surface", () => {
    const surface = document.createElement("div");
    const button = document.createElement("button");
    surface.append(button);
    expect(
      shouldBlockCanvasScrollNavigation({
        typing: false,
        pointerOverCanvas: false,
        focusNode: button,
        canvasSurface: surface,
      }),
    ).toBe(true);
  });

  it("does not block when the pointer is elsewhere and focus is outside the canvas", () => {
    const surface = document.createElement("div");
    const list = document.createElement("div");
    document.body.append(list);
    expect(
      shouldBlockCanvasScrollNavigation({
        typing: false,
        pointerOverCanvas: false,
        focusNode: list,
        canvasSurface: surface,
      }),
    ).toBe(false);
  });
});
