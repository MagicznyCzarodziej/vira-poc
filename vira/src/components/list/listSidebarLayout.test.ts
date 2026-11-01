import { describe, expect, it } from "vitest";
import { listSidebarGridTemplateRows, listSidebarSectionFlexStyle } from "./listSidebarLayout.ts";

describe("listSidebarGridTemplateRows", () => {
  it("uses auto rows only when both sections are collapsed", () => {
    expect(listSidebarGridTemplateRows(false, false)).toBe("auto auto");
  });

  it("gives the expanded section a fr row", () => {
    expect(listSidebarGridTemplateRows(true, false)).toBe("minmax(0, 1fr) auto");
    expect(listSidebarGridTemplateRows(false, true)).toBe("auto minmax(0, 1fr)");
    expect(listSidebarGridTemplateRows(true, true)).toBe("minmax(0, 1fr) minmax(0, 1fr)");
  });
});

describe("listSidebarSectionFlexStyle", () => {
  it("does not grow collapsed sections", () => {
    expect(listSidebarSectionFlexStyle(false, true, "actions")).toEqual({
      flex: "0 0 auto",
      minHeight: "auto",
      height: "auto",
    });
  });

  it("grows expanded sections", () => {
    expect(listSidebarSectionFlexStyle(false, true, "decisions")).toEqual({
      flex: "1 1 0",
      minHeight: 0,
    });
  });
});
