import { describe, expect, it } from "vitest";
import {
  NOTE_COLOR_MAP,
  NOTE_COLORS,
  normalizeNoteColor,
  noteColorHex,
  noteColorIsDark,
} from "./noteColors.ts";

describe("noteColors", () => {
  it("exposes a compact palette in display order", () => {
    expect(NOTE_COLORS).toHaveLength(15);
    expect(new Set(NOTE_COLORS).size).toBe(NOTE_COLORS.length);
    for (const id of Object.keys(NOTE_COLOR_MAP)) {
      expect(NOTE_COLORS).toContain(id);
    }
    expect(NOTE_COLORS.indexOf("lemon")).toBeLessThan(NOTE_COLORS.indexOf("blue"));
    expect(NOTE_COLORS.indexOf("stone")).toBeLessThan(NOTE_COLORS.indexOf("black"));
  });

  it("treats black and dark gray as dark backgrounds", () => {
    expect(noteColorIsDark("black")).toBe(true);
    expect(noteColorIsDark("dark-gray")).toBe(true);
    expect(noteColorIsDark("lemon")).toBe(false);
  });

  it("maps legacy yellow to lemon", () => {
    expect(normalizeNoteColor("yellow")).toBe("lemon");
  });

  it("defaults unknown colors to white", () => {
    expect(normalizeNoteColor("not-a-color")).toBe("white");
  });

  it("returns hex for every palette id", () => {
    for (const id of NOTE_COLORS) {
      expect(noteColorHex(id)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
